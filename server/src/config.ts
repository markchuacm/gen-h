import "dotenv/config";
import { z } from "zod";

const boolFromString = (defaultValue: "true" | "false" = "false") => z
  .enum(["true", "false"])
  .default(defaultValue)
  .transform((value) => value === "true");

export function databaseTlsIssues(urlValue: string): string[] {
  try {
    const url = new URL(urlValue);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) return ["must be a PostgreSQL URL"];
    const localDatabase = ["localhost", "127.0.0.1", "postgres"].includes(url.hostname);
    if (localDatabase) return [];
    const issues: string[] = [];
    if (url.searchParams.get("sslmode") !== "verify-full") issues.push("must use sslmode=verify-full");
    if (!url.searchParams.get("sslrootcert")) issues.push("must provide sslrootcert");
    return issues;
  } catch {
    return ["must be a valid PostgreSQL URL"];
  }
}

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    HOST: z.string().default("0.0.0.0"),
    PORT: z.coerce.number().int().positive().default(4000),
    DATABASE_URL: z.string().min(1).default("postgres://verae:verae@localhost:5432/verae"),
    WORKER_DATABASE_URL: z.string().optional(),
    PROCESS_ROLE: z.enum(["api", "worker"]).default("api"),
    DATABASE_ADMIN_URL: z.string().optional(),
    AUTH_DATABASE_URL: z.string().optional(),
    JOBS_DATABASE_URL: z.string().optional(),
    BETTER_AUTH_SECRET: z.string().min(32).default("development-only-change-me-32-characters"),
    BETTER_AUTH_URL: z.url().default("http://localhost:4000"),
    APP_ORIGIN: z.url().default("http://localhost:5173"),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    SMTP_URL: z.string().optional(),
    EMAIL_FROM: z.string().default("Verae Health <noreply@veraehealth.com>"),
    TURNSTILE_SECRET_KEY: z.string().optional(),
    REQUIRE_TURNSTILE: boolFromString(),
    S3_ENDPOINT: z.url().default("http://localhost:9000"),
    S3_REGION: z.string().default("my-1"),
    S3_ACCESS_KEY_ID: z.string().default("verae-local"),
    S3_SECRET_ACCESS_KEY: z.string().default("verae-local-secret"),
    S3_DOCUMENTS_BUCKET: z.string().default("verae-documents"),
    S3_BACKUPS_BUCKET: z.string().default("verae-backups"),
    // Local MinIO requires path-style bucket URLs. AWS environments set this
    // explicitly to false in their server environment files.
    S3_FORCE_PATH_STYLE: boolFromString("true"),
    CLAMAV_HOST: z.string().optional(),
    CLAMAV_PORT: z.coerce.number().int().positive().default(3310),
    PARTNER_CREDENTIAL_ENCRYPTION_KEY: z.string().optional(),
    REQUIRE_STAFF_MFA: boolFromString(),
    // Serves the Scalar API reference + OpenAPI spec at /docs. Off by default:
    // the full route map is recon material, so production keeps it closed and
    // only staging (which also runs NODE_ENV=production) opts in.
    EXPOSE_API_DOCS: boolFromString(),
    LAB_TIMESTAMP_TOLERANCE_SECONDS: z.coerce.number().int().positive().default(300),
    LAB_MAX_BODY_BYTES: z.coerce.number().int().positive().default(5 * 1024 * 1024),
    BOOTSTRAP_ADMIN_TOKEN: z.string().min(32).optional(),
    // Hash only: generate interactively with `pnpm --filter @verae/api developer:password`.
    // When omitted, developer mode remains unavailable.
    DEVELOPER_MODE_PASSWORD_HASH: z.string().regex(/^[a-f0-9]+:[a-f0-9]+$/).optional(),
    LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  })
  .superRefine((value, ctx) => {
    if ((value.GOOGLE_CLIENT_ID && !value.GOOGLE_CLIENT_SECRET) || (!value.GOOGLE_CLIENT_ID && value.GOOGLE_CLIENT_SECRET)) {
      ctx.addIssue({ code: "custom", path: ["GOOGLE_CLIENT_ID"], message: "Google OAuth requires both client ID and secret" });
    }
    if (value.REQUIRE_TURNSTILE && !value.TURNSTILE_SECRET_KEY) {
      ctx.addIssue({ code: "custom", path: ["TURNSTILE_SECRET_KEY"], message: "TURNSTILE_SECRET_KEY is required when REQUIRE_TURNSTILE=true" });
    }
    if (value.NODE_ENV === "production") {
      if (!value.SMTP_URL) ctx.addIssue({ code: "custom", path: ["SMTP_URL"], message: "SMTP_URL is required in production" });
      if (!value.WORKER_DATABASE_URL) ctx.addIssue({ code: "custom", path: ["WORKER_DATABASE_URL"], message: "WORKER_DATABASE_URL must use the dedicated worker login in production" });
      if (!value.AUTH_DATABASE_URL) ctx.addIssue({ code: "custom", path: ["AUTH_DATABASE_URL"], message: "AUTH_DATABASE_URL must use the dedicated auth login in production" });
      if (!value.JOBS_DATABASE_URL) ctx.addIssue({ code: "custom", path: ["JOBS_DATABASE_URL"], message: "JOBS_DATABASE_URL must use the dedicated jobs login in production" });
      if (!value.CLAMAV_HOST) ctx.addIssue({ code: "custom", path: ["CLAMAV_HOST"], message: "CLAMAV_HOST is required in production" });
      if (!value.PARTNER_CREDENTIAL_ENCRYPTION_KEY) ctx.addIssue({ code: "custom", path: ["PARTNER_CREDENTIAL_ENCRYPTION_KEY"], message: "Partner credential encryption key is required in production" });
      if (value.BETTER_AUTH_SECRET.includes("development-only")) {
        ctx.addIssue({ code: "custom", path: ["BETTER_AUTH_SECRET"], message: "Set a production Better Auth secret" });
      }

      const databaseUrls = [
        ["DATABASE_URL", value.DATABASE_URL],
        ["AUTH_DATABASE_URL", value.AUTH_DATABASE_URL],
        ["WORKER_DATABASE_URL", value.WORKER_DATABASE_URL],
        ["JOBS_DATABASE_URL", value.JOBS_DATABASE_URL],
        ["DATABASE_ADMIN_URL", value.DATABASE_ADMIN_URL],
      ] as const;
      for (const [key, urlValue] of databaseUrls) {
        if (!urlValue) continue;
        for (const issue of databaseTlsIssues(urlValue)) {
          ctx.addIssue({ code: "custom", path: [key], message: `${key} ${issue}` });
        }
      }
    }
  });

export const env = envSchema.parse(process.env);

export function authDatabaseUrl(): string {
  // Better Auth queries its tables unqualified, so the auth connection must
  // resolve them in the `identity` schema. Apply the search_path whether the
  // URL comes from AUTH_DATABASE_URL (production) or the DATABASE_URL fallback,
  // unless the caller already set connection options explicitly.
  const url = new URL(env.AUTH_DATABASE_URL ?? env.DATABASE_URL);
  if (!url.searchParams.has("options")) {
    url.searchParams.set("options", "-c search_path=identity");
  }
  return url.toString();
}

export function jobsDatabaseUrl(): string {
  return env.JOBS_DATABASE_URL ?? env.DATABASE_URL;
}

export function adminDatabaseUrl(): string {
  return env.DATABASE_ADMIN_URL ?? env.DATABASE_URL;
}
