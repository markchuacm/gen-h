import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, isAPIError } from "better-auth/api";
import { captcha, emailOTP, twoFactor } from "better-auth/plugins";
import { Pool } from "pg";
import { authDatabaseUrl, env } from "../config.js";
import { sendAccountEmail } from "../services/email.js";
import { isInviteExpired, isStillOnTempPassword } from "../services/invites.js";

export const authPool = new Pool({
  connectionString: authDatabaseUrl(),
  max: env.NODE_ENV === "production" ? 8 : 3,
  application_name: "verae-auth",
});

export async function closeAuthDatabase(): Promise<void> {
  await authPool.end();
}

type InviteRow = {
  role: string;
  setup_completed_at: Date | null;
  password_set_at: Date | null;
  temp_password_expires_at: Date | null;
};

async function loadInviteState(email: string): Promise<InviteRow | null> {
  const { rows } = await authPool.query<InviteRow>(
    `select role, setup_completed_at, password_set_at, temp_password_expires_at
       from app.profiles where lower(email) = lower($1)`,
    [email],
  );
  return rows[0] ?? null;
}

function toInviteState(row: InviteRow) {
  return {
    role: row.role,
    setupCompletedAt: row.setup_completed_at,
    passwordSetAt: row.password_set_at,
    tempPasswordExpiresAt: row.temp_password_expires_at,
  };
}

const otpEmailHtml = (otp: string): string => `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;color:#1f2933">
    <h2 style="font-size:20px;margin:0 0 8px">Verification Code</h2>
    <p style="font-size:14px;color:#52606d;margin:0 0 20px">Use the following code to verify your identity. This code expires in 5 minutes.</p>
    <div style="background:#f5f7fa;border-radius:10px;padding:24px;text-align:center;letter-spacing:10px;font-size:30px;font-weight:700">${otp}</div>
    <p style="font-size:12px;color:#9aa5b1;margin:24px 0 0">If you didn't request this code, you can safely ignore this email.</p>
  </div>`;

// Mirrors the web client's portalUrl(): the production host serves the member
// portal at the origin root; every other environment serves it from /member.
function portalErrorUrl(): string {
  const origin = new URL(env.APP_ORIGIN);
  return origin.hostname === "app.veraehealth.com"
    ? origin.origin
    : new URL("/member", origin).toString();
}

const plugins = [
  twoFactor({
    issuer: "Verae Health",
    allowPasswordless: true,
    accountLockout: { enabled: true, maxFailedAttempts: 8, durationSeconds: 900 },
  }),
  emailOTP({
    overrideDefaultEmailVerification: true,
    sendVerificationOTP: async ({ email, otp }) => {
      void sendAccountEmail({
        to: email,
        subject: "Your Verae Health verification code",
        text: `Your Verae Health verification code is ${otp}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
        html: otpEmailHtml(otp),
      }).catch((error) => console.error(JSON.stringify({ event: "otp_email_failed", message: String(error) })));
    },
  }),
  ...(env.TURNSTILE_SECRET_KEY
    ? [captcha({ provider: "cloudflare-turnstile" as const, secretKey: env.TURNSTILE_SECRET_KEY })]
    : []),
];

export const auth = betterAuth({
  appName: "Verae Health",
  baseURL: env.BETTER_AUTH_URL,
  basePath: "/api/auth",
  secret: env.BETTER_AUTH_SECRET,
  database: authPool,
  trustedOrigins: [env.APP_ORIGIN],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // Members are invited by an admin, not self-verified; the setup wizard runs an
    // explicit email OTP step instead of a magic link.
    requireEmailVerification: false,
    autoSignIn: false,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 15 * 60,
    sendResetPassword: async ({ user, token }) => {
      const profile = await authPool.query<{ role: string; account_status: string }>(
        "select role, account_status from app.profiles where id = $1",
        [user.id],
      );
      const isDoctorActivation = profile.rows[0]?.role === "doctor" && profile.rows[0]?.account_status === "pending";
      const resetUrl = new URL(isDoctorActivation ? "/activate-account" : "/reset-password", env.APP_ORIGIN);
      resetUrl.hash = new URLSearchParams({ token }).toString();
      await sendAccountEmail({
        to: user.email,
        subject: isDoctorActivation ? "Activate your Verae Health doctor account" : "Reset your Verae Health password",
        text: isDoctorActivation
          ? `Welcome to Verae Health. Activate your doctor account and choose a password using this secure link: ${resetUrl.toString()}`
          : `Reset your password using this secure link: ${resetUrl.toString()}`,
      });
    },
    onPasswordReset: async ({ user }) => {
      // A doctor invitation is completed by choosing a password from the one-time
      // activation link. Ordinary password resets leave account status unchanged.
      const activated = await authPool.query(
        `update app.profiles
           set account_status = 'active', password_set_at = coalesce(password_set_at, now()),
               email_verified_at = coalesce(email_verified_at, now()), updated_at = now()
         where id = $1 and role = 'doctor' and account_status = 'pending'`,
        [user.id],
      );
      if (activated.rowCount) {
        // The activation link arrived in the doctor's inbox, which proves email
        // ownership — doctors have no OTP step to set this otherwise.
        await authPool.query(
          `update identity."user" set "emailVerified" = true, "updatedAt" = now() where id = $1`,
          [user.id],
        );
      }
    },
  },
  socialProviders: env.GOOGLE_CLIENT_ID
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          // "Continue with Google" links to an existing invited account only; it
          // can never create a brand-new user.
          disableSignUp: true,
        },
      }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // The linked Google email must match the invited email.
      allowDifferentEmails: false,
      // Invited accounts start with emailVerified=false until the wizard's OTP
      // step, and doctors (activated via emailed link) never run that step —
      // the default `true` blocked their Google sign-in with account_not_linked.
      // Relaxing is safe here: sign-up is invite-only, Google is a trusted
      // provider, and the emails must match exactly.
      requireLocalEmailVerified: false,
    },
  },
  // Failed OAuth round-trips otherwise land on better-auth's /api/auth/error
  // route, which in production 302s to the API domain root — a bare Fastify 404.
  // Send them to the portal, where the login screen and setup wizard read
  // ?error=<code>. Client calls also pass errorCallbackURL; this is the fallback.
  onAPIError: {
    errorURL: portalErrorUrl(),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "database",
  },
  advanced: {
    useSecureCookies: env.NODE_ENV === "production",
    disableOriginCheck: false,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Public self-signup is closed. Server-side auth.api.signUpEmail (admin
      // invite flow, bootstrap-admin) has no incoming request, so it passes.
      if (ctx.path === "/sign-up/email" && ctx.request) {
        throw new APIError("FORBIDDEN", { message: "Sign-up is by invitation only." });
      }

      // Block sign-in once the temporary password has expired.
      if (ctx.path === "/sign-in/email") {
        const email = ctx.body?.email as string | undefined;
        if (email) {
          const row = await loadInviteState(email);
          if (row && isInviteExpired(toInviteState(row))) {
            throw new APIError("FORBIDDEN", { message: "INVITE_EXPIRED" });
          }
        }
      }

      // A member still on a temp password must not be able to route around the
      // invite by requesting a password reset. Return the generic success shape
      // (no enumeration, no email sent).
      if (ctx.path === "/request-password-reset") {
        const email = ctx.body?.email as string | undefined;
        if (email) {
          const row = await loadInviteState(email);
          if (row && isStillOnTempPassword(toInviteState(row))) {
            // Short-circuit with the same generic success shape the real endpoint
            // returns (a plain object here becomes the response, bypassing the
            // reset email).
            return { status: true };
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Record the authoritative "email verified during setup" flag. This is what
      // the setup wizard and consent endpoint gate on, so a later Google link
      // can't skip the OTP step.
      if (ctx.path === "/email-otp/verify-email") {
        // Only stamp on a successful verification; a failed OTP leaves `returned`
        // as an APIError.
        if (isAPIError(ctx.context.returned)) return;
        const email = ctx.body?.email as string | undefined;
        if (email) {
          await authPool.query(
            `update app.profiles set email_verified_at = now(), updated_at = now()
               where lower(email) = lower($1) and email_verified_at is null`,
            [email],
          );
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await authPool.query(
            `insert into app.profiles (id, email, full_name, avatar_url, role, account_status)
             values ($1, $2, $3, $4, 'member', 'pending')
             on conflict (id) do nothing`,
            [user.id, user.email, user.name ?? null, user.image ?? null],
          );
          await authPool.query(
            "insert into app.member_profiles (member_id) values ($1)",
            [user.id],
          );
        },
      },
      update: {
        after: async (user) => {
          await authPool.query(
            `update app.profiles set email = $2, full_name = $3, avatar_url = $4, updated_at = now() where id = $1`,
            [user.id, user.email, user.name ?? null, user.image ?? null],
          );
        },
      },
    },
  },
  plugins,
});

export type VeraeSession = typeof auth.$Infer.Session;
