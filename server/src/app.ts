import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import sensible from "@fastify/sensible";
import swagger from "@fastify/swagger";
import apiReference from "@scalar/fastify-api-reference";
import rawBody from "fastify-raw-body";
import { fromNodeHeaders } from "better-auth/node";
import { ZodError } from "zod";
import { auth } from "./auth/auth.js";
import { env } from "./config.js";
import { databaseReady } from "./db/pools.js";
import { storageReady } from "./services/storage.js";
import { adminRoutes } from "./routes/admin.js";
import { documentRoutes } from "./routes/documents.js";
import { doctorRoutes } from "./routes/doctor.js";
import { labRoutes } from "./routes/labs.js";
import { memberRoutes } from "./routes/member.js";
import { clamAvReady } from "./workers/document-scanner.js";

export async function buildApp() {
  const app = Fastify({
    logger: { level: env.LOG_LEVEL, redact: ["req.headers.authorization", "req.headers.cookie", "res.headers['set-cookie']", "body", "rawBody"] },
    trustProxy: true,
    bodyLimit: env.LAB_MAX_BODY_BYTES,
    requestIdHeader: "x-request-id",
  });

  await app.register(cors, {
    origin: [env.APP_ORIGIN],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "X-Requested-With", "X-Captcha-Response", "X-Verae-Event-ID", "X-Verae-Timestamp", "X-Verae-Signature"],
    maxAge: 86_400,
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  await app.register(rateLimit, { max: 300, timeWindow: "1 minute" });
  await app.register(sensible);
  await app.register(swagger, {
    openapi: {
      info: { title: "Verae Health API", version: "0.1.0" },
      servers: [{ url: env.BETTER_AUTH_URL }],
    },
  });
  await app.register(rawBody, { field: "rawBody", global: false, encoding: false, runFirst: true });

  app.route({
    method: ["GET", "POST"],
    url: "/api/auth/*",
    async handler(request, reply) {
      const url = new URL(request.url, env.BETTER_AUTH_URL);
      const req = new Request(url, {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });
      const response = await auth.handler(req);
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      return reply.send(response.body ? await response.text() : null);
    },
  });

  app.get("/health/live", { config: { rateLimit: false } }, async () => ({ status: "ok" }));
  app.get("/health/ready", { config: { rateLimit: false } }, async (_request, reply) => {
    const [database, storage, malwareScanner] = await Promise.all([databaseReady(), storageReady(), clamAvReady()]);
    if (!database || !storage || !malwareScanner) return reply.code(503).send({ status: "not_ready", database, storage, malwareScanner });
    return { status: "ready", database, storage, malwareScanner };
  });

  await app.register(memberRoutes);
  await app.register(documentRoutes);
  await app.register(doctorRoutes);
  await app.register(adminRoutes);
  await app.register(labRoutes);

  app.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error, requestId: request.id }, "request failed");
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "Request validation failed",
        code: "VALIDATION_ERROR",
        requestId: request.id,
        issues: error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      });
    }
    const status = typeof error.statusCode === "number" && error.statusCode >= 400 ? error.statusCode : 500;
    reply.code(status).send({
      error: status >= 500 ? "Internal server error" : error.message,
      code: status >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
      requestId: request.id,
    });
  });

  await app.register(apiReference, { routePrefix: "/docs", configuration: { spec: { content: () => app.swagger() } } });
  return app;
}
