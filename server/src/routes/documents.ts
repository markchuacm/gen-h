import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { actor, requireActor } from "../auth/guards.js";
import { env } from "../config.js";
import { withActor } from "../db/pools.js";
import { getBoss } from "../jobs/boss.js";
import { DOCUMENT_MIME_TYPES, MAX_DOCUMENT_UPLOAD_BYTES, validateDocumentContent } from "../services/document-upload.js";
import { deleteDocumentObject, putDocumentObject, signDocumentDownload } from "../services/storage.js";

const prepareSchema = z.object({
  memberId: z.string().min(1).optional(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(150),
  sizeBytes: z.number().int().positive().max(MAX_DOCUMENT_UPLOAD_BYTES),
  docType: z.string().max(100),
});

export async function documentRoutes(app: FastifyInstance): Promise<void> {
  for (const mimeType of DOCUMENT_MIME_TYPES) {
    app.addContentTypeParser(mimeType, { parseAs: "buffer" }, (_request, body, done) => done(null, body));
  }

  app.get("/v1/member/documents", { preHandler: requireActor }, async (request) => {
    const current = actor(request);
    return withActor(current, async (client) => {
      const result = await client.query(
        `select id, member_id, object_key as storage_path, file_name, mime_type, size_bytes, doc_type, created_at
         from app.health_documents where member_id = $1 order by created_at desc`,
        [current.userId],
      );
      return { data: result.rows };
    });
  });

  app.post("/v1/member/documents/upload", { preHandler: requireActor }, async (request, reply) => {
    const current = actor(request);
    const body = prepareSchema.parse(request.body);
    const memberId = body.memberId ?? current.userId;
    if (body.memberId && current.role !== "admin") return reply.code(403).send({ error: "Admin access required", code: "FORBIDDEN" });
    if (!DOCUMENT_MIME_TYPES.has(body.mimeType)) return reply.code(415).send({ error: "Unsupported document type", code: "UNSUPPORTED_MEDIA_TYPE" });
    const id = randomUUID();
    const objectKey = `documents/${id}`;
    const row = await withActor(current, async (client) => {
      const result = await client.query(
        `insert into app.health_documents
          (id, member_id, object_key, file_name, mime_type, size_bytes, doc_type, uploaded_by)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning id, member_id, object_key as storage_path, file_name, mime_type, size_bytes, doc_type, created_at`,
        [id, memberId, objectKey, body.fileName, body.mimeType, body.sizeBytes, body.docType, current.userId],
      );
      return result.rows[0];
    });
    return reply.code(201).send({ data: row });
  });

  app.put<{ Params: { id: string } }>(
    "/v1/member/documents/:id/content",
    { preHandler: requireActor, bodyLimit: MAX_DOCUMENT_UPLOAD_BYTES },
    async (request, reply) => {
      const current = actor(request);
      const document = await withActor(current, async (client) => {
        const result = await client.query(
          "select id, object_key, mime_type, size_bytes, scan_status from app.health_documents where id = $1",
          [request.params.id],
        );
        return result.rows[0] as {
          id: string;
          object_key: string;
          mime_type: string;
          size_bytes: string;
          scan_status: string;
        } | undefined;
      });
      if (!document) return reply.code(404).send({ error: "Document not found", code: "NOT_FOUND" });
      if (document.scan_status !== "pending") {
        return reply.code(409).send({ error: "Document upload is no longer pending", code: "UPLOAD_NOT_PENDING" });
      }
      const validation = validateDocumentContent(
        request.body,
        request.headers["content-type"],
        document.mime_type,
        Number(document.size_bytes),
      );
      if (!validation.ok) return reply.code(validation.statusCode).send({ error: validation.error, code: validation.code });
      await putDocumentObject(document.object_key, document.mime_type, validation.bytes);
      const boss = await getBoss();
      await boss.send("scan-document", { documentId: document.id }, { singletonKey: document.id });
      return reply.code(202).send({ status: "scanning" });
    },
  );

  app.get<{ Params: { id: string } }>("/v1/member/documents/:id/download", { preHandler: requireActor }, async (request, reply) => {
    const current = actor(request);
    const document = await withActor(current, async (client) => {
      const result = await client.query(
        "select object_key, file_name, scan_status from app.health_documents where id = $1",
        [request.params.id],
      );
      return result.rows[0] as { object_key: string; file_name: string; scan_status: string } | undefined;
    });
    if (!document) return reply.code(404).send({ error: "Document not found", code: "NOT_FOUND" });
    if (document.scan_status !== "clean") return reply.code(409).send({ error: "Document is not available", code: "SCAN_PENDING" });
    return { url: await signDocumentDownload(document.object_key, document.file_name), expiresIn: 300 };
  });

  app.get<{ Querystring: { objectKey: string } }>("/v1/member/documents/download", { preHandler: requireActor }, async (request, reply) => {
    const current = actor(request);
    const objectKey = z.string().min(1).max(500).parse(request.query.objectKey);
    const document = await withActor(current, async (client) => {
      const result = await client.query(
        "select object_key, file_name, scan_status from app.health_documents where object_key = $1",
        [objectKey],
      );
      return result.rows[0] as { object_key: string; file_name: string; scan_status: string } | undefined;
    });
    if (!document) return reply.code(404).send({ error: "Document not found", code: "NOT_FOUND" });
    if (document.scan_status !== "clean") return reply.code(409).send({ error: "Document is not available", code: "SCAN_PENDING" });
    return { url: await signDocumentDownload(document.object_key, document.file_name), expiresIn: 300 };
  });

  app.delete<{ Params: { id: string } }>("/v1/member/documents/:id", { preHandler: requireActor }, async (request, reply) => {
    const current = actor(request);
    const objectKey = await withActor(current, async (client) => {
      const selected = await client.query<{ object_key: string }>("select object_key from app.health_documents where id = $1", [request.params.id]);
      if (!selected.rows[0]) return null;
      await client.query("delete from app.health_documents where id = $1", [request.params.id]);
      return selected.rows[0].object_key;
    });
    if (!objectKey) return reply.code(404).send({ error: "Document not found", code: "NOT_FOUND" });
    await deleteDocumentObject(objectKey);
    return reply.code(204).send();
  });
}
