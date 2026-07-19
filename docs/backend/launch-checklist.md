# Backend launch gates

## Automated

- [ ] `pnpm test` passes.
- [ ] `pnpm build:all` passes.
- [ ] A blank PostgreSQL database is created entirely from migrations.
- [ ] Member/doctor/admin RLS checks pass using their real login roles.
- [ ] Production frontend source and built assets contain no Supabase URL, key, import, RPC, or storage call.
- [ ] A lab event produces either an imported report or a durable quarantine issue.
- [ ] Duplicate and conflicting event-ID tests pass.

## Infrastructure and privacy

- [ ] Production resources are in AWS `ap-southeast-5`; production and staging use separate instances, databases/data, buckets, and credentials.
- [ ] PostgreSQL port 5432 is unreachable from the internet.
- [ ] SSH is key-only and restricted to approved IPv4 and IPv6 operator/VPN CIDRs; port 22 is not open to the world.
- [ ] Every production PostgreSQL URL uses `sslmode=verify-full` and the mounted AWS RDS CA bundle.
- [ ] Lightsail document buckets are private, public overrides are disabled, account-level S3 block public access is enabled, and versioning is enabled.
- [ ] Document keys are opaque; upload, malware scan, download authorisation, and expiry tests pass.
- [ ] Concurrent/repeated document PUT tests prove that bytes cannot be replaced after scanning starts.
- [ ] Logs, analytics, browser storage, email, and object keys contain no PHI or secrets.
- [ ] Lightsail database point-in-time recovery is enabled and a manual snapshot is taken before every migration.
- [ ] Database and versioned-document restore tests succeed in an isolated temporary Malaysia environment.
- [ ] Instance/database alarms and external `/health/ready` monitoring are observed working.
- [ ] CloudWatch agent installed on both instances: container logs reach `/verae/<env>/docker` and the `disk_used_percent` alarm is armed.
- [ ] Restore exercise meets one-hour RPO and four-hour RTO.

## Identity and clinical access

- [ ] Email verification, generic sign-in/reset errors, reset, session revocation, Google callback, and CAPTCHA pass.
- [ ] `REQUIRE_TURNSTILE=true`; the API secret and matching Vercel site key are both configured, and missing/invalid/reused tokens fail safely.
- [ ] New signup remains pending until admin activation.
- [ ] Admin and doctor TOTP setup/challenge pass; staff MFA enforcement is enabled.
- [ ] Member cannot access another member; doctor cannot access unassigned member; draft reports/plans remain hidden.
- [ ] Every clinical mutation has actor, request ID, action, target, and timestamp in append-only audit history.
- [ ] Released reports and care plans reject in-place mutation; corrections create a draft version and atomically supersede the prior release.

## Partner and cutover

- [ ] First lab adapter passes partner UAT for normal, abnormal, duplicate, unknown-code, corrected, and cancelled results.
- [ ] Lab job redelivery is idempotent and unit-changing mappings either perform a verified conversion or quarantine the event.
- [ ] `api.veraehealth.com` TLS, health, rate limiting, and monitoring pass; `/docs` returns 404 in production (OpenAPI is served only on staging via `EXPOSE_API_DOCS`).
- [ ] `app.veraehealth.com` uses only `https://api.veraehealth.com` with credentialed CORS.
- [ ] Supabase project data/files are exported only if personally wanted, then erased; keys and OAuth callbacks revoked; project deleted.
