# Verae Health

Verae consists of a Vite portal/landing frontend and a Fastify backend hosted on AWS Lightsail in the Malaysia region. The browser talks only to the typed HTTP API; it has no direct PostgreSQL, object-storage, or Supabase access.

## Repository map

- `src/` — landing page and member, doctor, and admin portals.
- `server/` — Fastify, Better Auth, PostgreSQL services, workers, and migrations.
- `packages/contracts/` — shared laboratory and API contracts.
- `infra/aws/` — AWS Lightsail production and staging deployment.
- `infra/docker/` — local dependencies and the retired IPServerOne deployment retained for reference.
- `infra/scripts/` — backup checks.
- `docs/backend/` — operator and laboratory handoff runbooks.
- `supabase/` — retained prototype history only; not used by production code.

Start with [local development](docs/backend/local-development.md), then follow the [AWS Lightsail runbook](docs/backend/aws-lightsail-runbook.md). The IPServerOne runbook is historical only.
