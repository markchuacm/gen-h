import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { env } from "../config.js";
import { systemPool } from "../db/pools.js";
import { getBoss } from "../jobs/boss.js";
import { decryptPartnerSecret } from "../services/partner-secrets.js";
import { labSignatureMatches } from "../integrations/hmac.js";

function header(request: { headers: Record<string, unknown> }, name: string): string | null {
  const value = request.headers[name.toLowerCase()];
  return typeof value === "string" ? value : null;
}

export async function labRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { partner: string } }>(
    "/v1/labs/:partner/results",
    {
      config: { rawBody: true, rateLimit: { max: 120, timeWindow: "1 minute" } },
      schema: {
        tags: ["Laboratory integrations"],
        params: { type: "object", required: ["partner"], properties: { partner: { type: "string" } } },
        response: { 202: { type: "object", properties: { receipt_id: { type: "string" }, event_id: { type: "string" }, status: { type: "string" }, received_at: { type: "string" } } } },
      },
    },
    async (request, reply) => {
      const eventId = header(request, "x-verae-event-id");
      const timestamp = header(request, "x-verae-timestamp");
      const suppliedSignature = header(request, "x-verae-signature");
      if (!eventId || !timestamp || !suppliedSignature) {
        return reply.code(401).send({ error: "Missing integration authentication headers", code: "AUTH_HEADERS_REQUIRED" });
      }
      const requestTime = Date.parse(timestamp);
      if (!Number.isFinite(requestTime) || Math.abs(Date.now() - requestTime) > env.LAB_TIMESTAMP_TOLERANCE_SECONDS * 1000) {
        return reply.code(401).send({ error: "Request timestamp is outside the accepted window", code: "STALE_REQUEST" });
      }
      const rawValue = request.rawBody;
      if (!rawValue?.length) return reply.code(400).send({ error: "Request body is required", code: "EMPTY_BODY" });
      const raw = Buffer.isBuffer(rawValue) ? rawValue : Buffer.from(rawValue);
      if (raw.length > env.LAB_MAX_BODY_BYTES) return reply.code(413).send({ error: "Payload is too large", code: "PAYLOAD_TOO_LARGE" });

      const partnerResult = await systemPool.query<{
        id: string;
        status: string;
        adapter_type: string;
        secret_ciphertext: string;
      }>(
        `select p.id, p.status, p.adapter_type, c.secret_ciphertext
         from integration.lab_partners p
         join integration.partner_credentials c on c.partner_id = p.id
         where p.slug = $1 and p.status <> 'disabled' and c.revoked_at is null
           and c.active_from <= now() and (c.expires_at is null or c.expires_at > now())`,
        [request.params.partner],
      );
      const authenticated = partnerResult.rows.find((row) => {
        try {
          return labSignatureMatches(decryptPartnerSecret(row.secret_ciphertext), timestamp, raw, suppliedSignature);
        } catch {
          return false;
        }
      });
      if (!authenticated) return reply.code(401).send({ error: "Invalid integration signature", code: "INVALID_SIGNATURE" });

      const checksum = createHash("sha256").update(raw).digest("hex");
      const contentType = request.headers["content-type"]?.split(";", 1)[0] ?? "application/octet-stream";
      const client = await systemPool.connect();
      let receipt: { id: string; received_at: Date; payload_sha256: string; processing_status: string };
      try {
        await client.query("begin");
        const inserted = await client.query<typeof receipt>(
          `insert into integration.inbound_events
            (partner_id, partner_event_id, content_type, raw_payload, payload_sha256, request_timestamp)
           values ($1,$2,$3,$4,$5,$6)
           on conflict (partner_id, partner_event_id) do nothing
           returning id, received_at, payload_sha256, processing_status`,
          [authenticated.id, eventId, contentType, raw, checksum, new Date(requestTime)],
        );
        if (inserted.rows[0]) receipt = inserted.rows[0];
        else {
          const existing = await client.query<typeof receipt>(
            `select id, received_at, payload_sha256, processing_status from integration.inbound_events
             where partner_id=$1 and partner_event_id=$2 for update`,
            [authenticated.id, eventId],
          );
          receipt = existing.rows[0]!;
          if (receipt.payload_sha256 !== checksum) {
            await client.query(
              `insert into integration.processing_issues (inbound_event_id, issue_code, message)
               values ($1,'EVENT_ID_CONFLICT','The partner reused an event ID with different content')`,
              [receipt.id],
            );
            await client.query("commit");
            return reply.code(409).send({ error: "Event ID already exists with different content", code: "EVENT_ID_CONFLICT", receipt_id: receipt.id });
          }
        }
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      } finally {
        client.release();
      }

      if (receipt.processing_status === "received") {
        const boss = await getBoss();
        await boss.send("process-lab-event", { eventId: receipt.id }, { singletonKey: receipt.id });
      }
      return reply.code(202).send({
        receipt_id: receipt.id,
        event_id: eventId,
        status: "accepted",
        received_at: receipt.received_at.toISOString(),
      });
    },
  );
}
