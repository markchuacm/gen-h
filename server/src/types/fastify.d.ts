import type { Actor } from "../db/pools.js";

declare module "fastify" {
  interface FastifyRequest {
    actor?: Actor & {
      accountStatus: "pending" | "active" | "suspended";
      twoFactorEnabled: boolean;
    };
    rawBody?: Buffer;
  }
}
