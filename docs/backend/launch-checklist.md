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

- [ ] Written IPServerOne Malaysia location/encryption confirmation is filed for VM, volume, snapshots, documents, and backups.
- [ ] PostgreSQL port 5432 is unreachable from the internet.
- [ ] SSH is key-only and restricted to a fixed IP/VPN.
- [ ] Document keys are opaque; upload, malware scan, download authorisation, and expiry tests pass.
- [ ] Logs, analytics, browser storage, email, and object keys contain no PHI or secrets.
- [ ] Full backup and document restore succeed in an isolated temporary Malaysia environment.
- [ ] Hourly WAL/incremental backup and alerting are observed working.
- [ ] Restore exercise meets one-hour RPO and four-hour RTO.

## Identity and clinical access

- [ ] Email verification, generic sign-in/reset errors, reset, session revocation, Google callback, and CAPTCHA pass.
- [ ] New signup remains pending until admin activation.
- [ ] Admin and doctor TOTP setup/challenge pass; staff MFA enforcement is enabled.
- [ ] Member cannot access another member; doctor cannot access unassigned member; draft reports/plans remain hidden.
- [ ] Every clinical mutation has actor, request ID, action, target, and timestamp in append-only audit history.

## Partner and cutover

- [ ] First lab adapter passes partner UAT for normal, abnormal, duplicate, unknown-code, corrected, and cancelled results.
- [ ] `api.veraehealth.com` TLS, health, OpenAPI, rate limiting, and monitoring pass.
- [ ] `app.veraehealth.com` uses only `https://api.veraehealth.com` with credentialed CORS.
- [ ] Supabase project data/files are exported only if personally wanted, then erased; keys and OAuth callbacks revoked; project deleted.
