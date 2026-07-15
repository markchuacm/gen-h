import type { FastifyReply, FastifyRequest } from "fastify";
import { fromNodeHeaders } from "better-auth/node";
import { auth, authPool } from "./auth.js";
import { env } from "../config.js";

type Role = "member" | "doctor" | "admin";

export async function requireActor(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
  if (!session) {
    await reply.code(401).send({ error: "Authentication required", code: "UNAUTHENTICATED", requestId: request.id });
    return;
  }
  const result = await authPool.query<{
    role: Role;
    account_status: "pending" | "active" | "suspended";
  }>("select role, account_status from app.profiles where id = $1", [session.user.id]);
  const profile = result.rows[0];
  if (!profile || profile.account_status === "suspended") {
    await reply.code(403).send({ error: "Account is not available", code: "ACCOUNT_UNAVAILABLE", requestId: request.id });
    return;
  }
  const twoFactorEnabled = Boolean("twoFactorEnabled" in session.user && session.user.twoFactorEnabled);
  request.actor = {
    userId: session.user.id,
    role: profile.role,
    accountStatus: profile.account_status,
    emailVerified: session.user.emailVerified,
    twoFactorEnabled,
    requestId: request.id,
  };
}

export function requireRoles(...roles: Role[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await requireActor(request, reply);
    if (reply.sent) return;
    if (!request.actor || !roles.includes(request.actor.role)) {
      await reply.code(403).send({ error: "Insufficient access", code: "FORBIDDEN", requestId: request.id });
      return;
    }
    if (request.actor.accountStatus !== "active") {
      await reply.code(403).send({ error: "Account activation is pending", code: "ACCOUNT_PENDING", requestId: request.id });
      return;
    }
    if (env.REQUIRE_STAFF_MFA && request.actor.role !== "member" && !request.actor.twoFactorEnabled) {
      await reply.code(403).send({ error: "Staff MFA setup is required", code: "MFA_SETUP_REQUIRED", requestId: request.id });
    }
  };
}

export function actor(request: FastifyRequest) {
  if (!request.actor) throw new Error("Authenticated actor missing");
  return request.actor;
}
