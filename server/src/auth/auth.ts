import { betterAuth } from "better-auth";
import { captcha, twoFactor } from "better-auth/plugins";
import { Pool } from "pg";
import { authDatabaseUrl, env } from "../config.js";
import { sendAccountEmail } from "../services/email.js";

export const authPool = new Pool({
  connectionString: authDatabaseUrl(),
  max: env.NODE_ENV === "production" ? 8 : 3,
  application_name: "verae-auth",
});

export async function closeAuthDatabase(): Promise<void> {
  await authPool.end();
}

const plugins = [
  twoFactor({
    issuer: "Verae Health",
    allowPasswordless: true,
    accountLockout: { enabled: true, maxFailedAttempts: 8, durationSeconds: 900 },
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
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    resetPasswordTokenExpiresIn: 15 * 60,
    sendResetPassword: async ({ user, token }) => {
      const resetUrl = new URL("/reset-password", env.APP_ORIGIN);
      resetUrl.hash = new URLSearchParams({ token }).toString();
      void sendAccountEmail({
        to: user.email,
        subject: "Reset your Verae Health password",
        text: `Reset your password using this secure link: ${resetUrl.toString()}`,
      }).catch((error) => console.error(JSON.stringify({ event: "reset_email_failed", message: String(error) })));
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 15 * 60,
    sendVerificationEmail: async ({ user, token }) => {
      const verificationUrl = new URL("/verify-email", env.APP_ORIGIN);
      verificationUrl.hash = new URLSearchParams({ token }).toString();
      void sendAccountEmail({
        to: user.email,
        subject: "Verify your Verae Health email",
        text: `Verify your email using this secure link: ${verificationUrl.toString()}`,
      }).catch((error) => console.error(JSON.stringify({ event: "verification_email_failed", message: String(error) })));
    },
  },
  socialProviders: env.GOOGLE_CLIENT_ID
    ? {
        google: {
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
        },
      }
    : {},
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
