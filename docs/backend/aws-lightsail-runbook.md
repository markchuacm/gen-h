# AWS Lightsail runbook (production + staging)

Operator checklist for the Verae Health backend on AWS Lightsail in the
Malaysia region (`ap-southeast-5`). This replaces the IPServerOne runbook
(`ipserverone-production-runbook.md`, kept for reference until decommission).

## Architecture at a glance

| Resource | Name | Notes |
|---|---|---|
| Production instance | `verae-prod` | Ubuntu 24.04, 2 GB RAM bundle, static IP, runs Caddy + API + worker + ClamAV via Docker Compose (`infra/aws/compose.production.yml`) |
| Production database | `verae-prod-db` | Lightsail managed PostgreSQL, 1 GB bundle, public mode OFF (private endpoint only), automated daily backups + point-in-time restore |
| Staging instance | `verae-staging` | Same bundle; also runs PostgreSQL as a container (invented data only) via `infra/aws/compose.staging.yml` |
| Buckets | see `server/.env.*` on each instance | Lightsail buckets (S3-compatible), separate access keys per environment |
| DNS | Porkbun | `api.veraehealth.com` → prod static IP, `api-uat.veraehealth.com` → staging static IP |

Hard rules:

- Real member data lives ONLY in production. Staging uses invented data.
- The managed database keeps public mode OFF. Only Lightsail instances in
  this account/region can reach it.
- No pgBackRest/systemd backup timers on AWS — the managed database owns
  backups. The `infra/docker` + `infra/systemd` trees apply to the old
  IPServerOne setup only.
- Only the profile-gated `tools` compose service receives
  `DATABASE_ADMIN_URL`; the long-running API and worker do not.
- Port 22 is restricted to approved operator/VPN CIDRs in the Lightsail
  firewall for both IPv4 and IPv6. It is never open to the world.
- Production database URLs use `sslmode=verify-full` with the AWS RDS CA
  bundle mounted by Compose. `sslmode=no-verify` is prohibited.
- Document buckets are private and object versioning remains enabled. Enabling
  account-level S3 public-access blocking requires an account-wide review
  because it also affects buckets unrelated to Verae.

## Deploying a change

From a checked-out repo on the operator machine:

Environment files are DELIBERATELY excluded — the authoritative secrets
(`server/.env.*`, `infra/aws/.env.*`) live only on the servers, never in the
deploy. A deploy must never overwrite them. Secrets are set on the server
(e.g. the Resend key via `infra/scripts/set-resend-smtp.sh`) and, where
recoverable, regenerated from the source (Resend dashboard, AWS console).

```sh
rsync -az --delete \
  --exclude node_modules --exclude .git --exclude dist \
  --exclude '.env.production' --exclude '**/.env.production' \
  --exclude '.env.staging' --exclude '**/.env.staging' \
  ./ ubuntu@<INSTANCE_IP>:/opt/verae/

ssh ubuntu@<INSTANCE_IP>
cd /opt/verae
docker compose --env-file infra/aws/.env.production -f infra/aws/compose.production.yml build api worker
docker compose --env-file infra/aws/.env.production -f infra/aws/compose.production.yml --profile tools run --rm tools   # migrations
docker compose --env-file infra/aws/.env.production -f infra/aws/compose.production.yml up -d
```

(For staging substitute `.env.staging` / `compose.staging.yml`.)

Verify `https://api.veraehealth.com/health/live`, `/health/ready`, `/docs`.

Before deploying the verified-TLS configuration to an existing instance,
rerun `sudo bash infra/aws/setup-instance.sh` (or download the AWS RDS global
CA bundle to `/etc/verae/aws-rds-global-bundle.pem`) and replace
`sslmode=no-verify` in every production database URL with:

```text
sslmode=verify-full&sslrootcert=/etc/ssl/certs/aws-rds-global-bundle.pem
```

## First-time environment bring-up

1. `sudo bash infra/aws/setup-instance.sh` on the fresh instance (swap,
   Docker, unattended upgrades, SSH hardening, AWS RDS CA bundle).
2. Copy `infra/aws/env.<env>.example` → `infra/aws/.env.<env>` and
   `infra/aws/server.env.<env>.example` → `server/.env.<env>`; fill in
   secrets (`openssl rand -base64 32`), `chmod 600` both.
3. Build, run migrations (`tools`), then
   `node server/dist/scripts/provision-logins.js` via the `tools` service to
   set the four least-privilege login passwords.
4. `docker compose ... up -d`, then run the one-time admin bootstrap per the
   original runbook §5.7 (Turnstile off → bootstrap → secrets removed →
   Turnstile on → TOTP enrolled → `REQUIRE_STAFF_MFA=true`).
5. In the Lightsail console, restrict SSH to approved operator/VPN CIDRs,
   enable versioning on both document buckets, enable account-level S3 block
   public access, enable automatic instance snapshots, and create metric
   alarms before any real data is accepted.

## Recurring operations (MSP)

- **Monitoring:** Lightsail instance + database metric alarms (CPU, disk,
  burst capacity) and an external HTTPS check on `/health/ready` for both
  domains. Alert on failure.
- **Logs:** ship Caddy and application logs to a centralized, access-controlled
  destination. Docker's local rotating JSON logs are only a short buffer.
- **Patching:** Ubuntu security updates are unattended; run
  `apt full-upgrade` + container image refresh (`docker compose pull/build`)
  monthly. The managed database patches itself in its maintenance window.
- **Backups:** managed-database automated backups are on (7-day point-in-time
  window). Take a manual database snapshot before every migration deploy.
  Quarterly: restore the latest snapshot to a temporary managed database,
  verify row counts, delete it, and record measured RPO/RTO.
- **Instance snapshots** are for the app disk only — never treat them as the
  database backup.
- **Documents:** bucket versioning is the minimum recovery control. Test a
  deleted-object restoration quarterly and record the result alongside the
  database restore exercise.
- **Access:** SSH is key-only, restricted in the Lightsail firewall to
  operator IPs, with the `lightsail-connect` alias retained as an emergency
  browser-SSH path. If the operator's public IPv4 address changes, run
  `infra/scripts/update-lightsail-ssh-allowlist.sh`; it detects the new address,
  preserves the other firewall rules, and updates production and staging.
  AWS console access for the MSP goes through an IAM identity with least
  privilege — never share the root user.
- **Review quarterly:** firewall rules, staff access, lab credentials, audit
  events, quarantine, disk use, TLS expiry, malware definitions.

## Incident basics

- API down: `docker compose ... ps` / `logs api` on the instance.
- Database issues: Lightsail console → database → metrics/logs; the
  emergency restore path is "create database from snapshot", then update the
  four URLs in `server/.env.production` and `infra/aws/.env.production`.
- Compromise suspected: detach the static IP (takes the API offline),
  preserve the instance for forensics, restore from a clean snapshot to a
  fresh instance, rotate every secret, and follow the PDPA breach-notification
  process (Commissioner as soon as practicable; affected individuals if
  significant harm is likely).
