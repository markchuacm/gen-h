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
- `/docs` (the Scalar API reference and OpenAPI spec) is served only where
  `EXPOSE_API_DOCS=true`. Staging enables it for partner integration work;
  production leaves it unset so the route map is not publicly enumerable.

### Accepted risk: staging shares the account/region with production

Lightsail's managed-database "public mode OFF" restricts access to instances in
the **same AWS account and region** — it is not a per-instance ACL. The
`verae-staging` instance therefore has a *network* path to the production
database endpoint; the only barrier is credentials. Mitigations, which the MSP
must uphold:

- The production DB login passwords are unique, strong, and are **never** set
  in any staging env file. Staging uses its own container Postgres.
- Treat a staging-instance compromise as potential exposure of the prod DB
  endpoint and rotate production DB credentials as part of incident response.

True network isolation would require RDS-in-a-VPC with security groups (more
cost and more MSP scope). Deferred deliberately; revisit if a second app or
tenant lands in the account.

## Deploying a change

From a checked-out repo on the operator machine, take a manual database
snapshot (see Backups), then run:

```sh
infra/scripts/deploy.sh production ubuntu@<PROD_INSTANCE_IP>
# staging:
infra/scripts/deploy.sh staging ubuntu@<STAGING_INSTANCE_IP>
```

`deploy.sh` ships **only files committed at `HEAD`** (via `git archive`), then
remotely builds `api`/`worker`, runs migrations through the profile-gated
`tools` service, brings the stack up, and prints `ps`. It refuses to run with a
dirty working tree so what ships matches what was reviewed.

Why not a plain `rsync ./`: the working tree contains gitignored material that
must never reach a server — real lab PDFs under `ocr-sample/` (PHI) and
provisioning secrets under `outputs/aws-setup/`. Sourcing the payload from
`git archive` makes leaking them impossible; an rsync exclude list does not
(it silently ships any newly added gitignored path).

The authoritative secrets (`server/.env.*`, `infra/aws/.env.*`) live only on
the servers, never in the deploy, and `deploy.sh` will not overwrite or delete
them. Secrets are set on the server (e.g. the Resend key via
`infra/scripts/set-resend-smtp.sh`) and, where recoverable, regenerated from
the source (Resend dashboard, AWS console).

Verify `https://api.veraehealth.com/health/live` and `/health/ready` (both
should be `ok`/`ready`). `/docs` is only served where `EXPOSE_API_DOCS=true`
(staging), so on production it correctly returns 404.

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
   alarms before any real data is accepted. Install the CloudWatch agent
   (see Recurring operations → Logs) and add the `disk_used_percent` alarm —
   filesystem usage is not a native Lightsail metric.

## Recurring operations (MSP)

- **Monitoring:** Lightsail instance + database metric alarms (CPU, burst
  capacity) and an external HTTPS check on `/health/ready` for both domains.
  **Disk usage is not a native Lightsail metric** — the CloudWatch agent (see
  Logs) publishes `Verae/disk_used_percent`; put a CloudWatch alarm on it at
  >= 85% per host. Alert on failure.
- **Logs + disk/mem metrics (CloudWatch):** the Amazon CloudWatch agent ships
  every container's JSON logs to log group `/verae/<env>/docker` (30-day
  retention) and publishes disk/memory usage as custom metrics. Docker's local
  rotating JSON logs remain for fast `docker compose logs` during incidents.
  Bring-up, per instance:
  1. Create one IAM user `verae-cloudwatch-<env>` with only this policy, and
     generate an access key:
     ```json
     {
       "Version": "2012-10-17",
       "Statement": [
         { "Effect": "Allow",
           "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents", "logs:PutRetentionPolicy", "logs:DescribeLogStreams", "cloudwatch:PutMetricData"],
           "Resource": "*" }
       ]
     }
     ```
  2. On the instance, write the key to `/root/.aws/credentials` under a
     `[cloudwatch]` profile (`chmod 600`).
  3. `sudo VERAE_ENV=<env> infra/scripts/setup-cloudwatch-logs.sh`.
  The agent is covered by unattended-upgrades; no extra patching scope.
- **Patching:** Ubuntu security updates are unattended; run
  `apt full-upgrade` + container image refresh (`docker compose pull/build`)
  monthly. The managed database patches itself in its maintenance window.
  Unattended-upgrades does not reboot on its own, so kernel/libc updates land at
  the next reboot — the monthly `apt full-upgrade` visit must reboot (or drain +
  reboot) each instance.
- **Disk (2 GB instances):** images are built on-box, so Docker's build cache
  and dangling images grow unbounded and are the most likely cause of a
  disk-full outage. Run `docker system prune -af` monthly alongside patching,
  and confirm the Lightsail disk-usage alarm from bring-up step 5 actually
  fires (test it once).
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
- **Credential rotation:** the Lightsail bucket access keys
  (`S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY`) are long-lived and are the only
  unrotated credential class. Rotate them quarterly: create a new bucket access
  key, update `server/.env.<env>` via `infra/scripts/set-storage-credentials.sh`,
  restart the stack, verify `/health/ready`, then delete the old key.
- **Review quarterly:** firewall rules, staff access, lab credentials, S3 bucket
  access keys, audit events, quarantine, disk use, TLS expiry, malware
  definitions.

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
