import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { CONSENT_VERSION, passwordSchema, PRIVACY_VERSION, TERMS_VERSION } from "@verae/contracts";
import { actor, requireActor } from "../auth/guards.js";
import { auth, authPool } from "../auth/auth.js";
import { withActor } from "../db/pools.js";

type SetupProfile = {
  role: string;
  setup_completed_at: Date | null;
  password_set_at: Date | null;
  email_verified_at: Date | null;
};

// Members complete first-login setup via requireActor (pending accounts pass);
// all other member APIs stay blocked by requireRoles until account_status flips
// to 'active' at the end of setup.
async function loadSetupProfile(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<SetupProfile | null> {
  const current = actor(request);
  if (current.role !== "member") {
    await reply.code(403).send({ error: "Members only", code: "FORBIDDEN", requestId: request.id });
    return null;
  }
  const result = await authPool.query<SetupProfile>(
    `select role, setup_completed_at, password_set_at, email_verified_at
       from app.profiles where id = $1`,
    [current.userId],
  );
  const profile = result.rows[0];
  if (!profile) {
    await reply.code(404).send({ error: "Profile missing", code: "NOT_FOUND", requestId: request.id });
    return null;
  }
  if (profile.setup_completed_at != null) {
    await reply.code(409).send({ error: "Setup already complete", code: "SETUP_ALREADY_COMPLETE", requestId: request.id });
    return null;
  }
  return profile;
}

export async function setupRoutes(app: FastifyInstance): Promise<void> {
  // Step A (email+password path): set the member's own password, replacing the
  // admin-issued temporary one.
  app.post("/v1/member/setup/password", { preHandler: requireActor }, async (request, reply) => {
    const profile = await loadSetupProfile(request, reply);
    if (!profile) return;
    const current = actor(request);
    const { newPassword } = z.object({ newPassword: passwordSchema }).parse(request.body);

    const hashed = await hashPassword(newPassword);
    await authPool.query(
      `update identity.account set password = $1, "updatedAt" = now() where "userId" = $2 and "providerId" = 'credential'`,
      [hashed, current.userId],
    );
    await authPool.query(
      `update app.profiles set password_set_at = now(), temp_password_expires_at = null, updated_at = now() where id = $1`,
      [current.userId],
    );
    // Invalidate any other sessions opened with the temp password.
    await auth.api.revokeOtherSessions({ headers: fromNodeHeaders(request.headers) });
    return reply.send({ ok: true });
  });

  // Step C: record all three versioned legal acknowledgements and complete setup.
  app.post("/v1/member/setup/consent", { preHandler: requireActor }, async (request, reply) => {
    const profile = await loadSetupProfile(request, reply);
    if (!profile) return;
    const current = actor(request);
    const body = z
      .object({
        signatureName: z.string().trim().min(2).max(200),
        acceptTerms: z.literal(true),
        acknowledgePrivacy: z.literal(true),
        acceptHealthConsent: z.literal(true),
      })
      .parse(request.body);

    // Prerequisite gates: an auth method chosen (password set OR Google linked)
    // and email verified via OTP.
    const google = await authPool.query(
      `select 1 from identity.account where "userId" = $1 and "providerId" = 'google' limit 1`,
      [current.userId],
    );
    const hasGoogle = (google.rowCount ?? 0) > 0;
    const authMethodDone = profile.password_set_at != null || hasGoogle;
    if (!authMethodDone || profile.email_verified_at == null) {
      return reply.code(403).send({ error: "Setup steps incomplete", code: "SETUP_STEP_INCOMPLETE", requestId: request.id });
    }

    await withActor(current, async (client) => {
      await client.query(
        `insert into app.member_consents (member_id, terms_version, privacy_version, consent_version, signature_name)
         values ($1, $2, $3, $4, $5)`,
        [current.userId, TERMS_VERSION, PRIVACY_VERSION, CONSENT_VERSION, body.signatureName],
      );
    });

    // Finish setup: activate the account and, for Google-only members, drop the
    // now-unused temporary credential.
    await authPool.query(
      `update app.profiles set setup_completed_at = now(), account_status = 'active', updated_at = now() where id = $1`,
      [current.userId],
    );
    if (profile.password_set_at == null && hasGoogle) {
      await authPool.query(
        `delete from identity.account where "userId" = $1 and "providerId" = 'credential'`,
        [current.userId],
      );
    }

    return reply.send({ ok: true });
  });
}
