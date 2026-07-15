# IPServerOne production runbook

This is an operator checklist for the single permanent Malaysia VM. Do not place real health data on the VM until the location, storage, backup, and encryption confirmations are recorded.

## 1. Organisation account and written confirmations

1. Register the company-owned account at [IPServerOne Customer Portal](https://portal.ipserverone.com/). Use a role mailbox, not a founder's personal email.
2. Enable MFA, add a second authorised owner, complete verification, and top up Cloud Points.
3. Ask IPServerOne support to confirm in writing:
   - the instance, attached production volume, snapshots, object-storage buckets, replicas, and backup copies remain in Malaysia;
   - encryption at rest and key-management arrangements for each service;
   - deletion/retention behaviour, support access, incident notification, and subcontractors;
   - which certifications and reports apply to these exact services.
4. Store the response with the vendor/security register. IPServerOne publishes that CJ1 is in Cyberjaya and that NovaCloud can be deployed by region, but the project still needs service-specific written confirmation: [CJ1 location](https://www.ipserverone.com/data-center-malaysia/), [NovaCloud](https://www.ipserverone.com/novacloud/).

## 2. Create the Malaysian resources

1. In `NovaCloud → Instances`, select the Malaysia region. Region selection is permanent, so check it before proceeding.
2. Choose `Create Instance from Image`, the C2 plan (2 vCPU / 7.5 GB RAM), and Ubuntu 24.04 LTS.
3. Name it `verae-prod-01`, attach/import an organisation-controlled SSH public key, and enable the public network.
4. Create and attach a separate 100 GB persistent SSD production volume. Mount it at `/srv/verae` and place the PostgreSQL Docker volume there.
5. Create a security group with:
   - TCP 22 only from the fixed administrator/VPN IP;
   - TCP 80 and 443 from anywhere;
   - no public rule for 4000, 5432, 3310, or 9000.
6. Record the static public IP. IPServerOne's current launch and firewall workflows are documented in its [instance guide](https://kb.ipserverone.com/knowledge-base/how-to-launch-nova-gpu-cloud-instance-from-image/) and [security-group guide](https://kb.ipserverone.com/knowledge-base/novacloud-security-group/).
7. Create two private S3-compatible buckets in the confirmed Malaysia region: `verae-documents` and `verae-backups`. Enable versioning/object retention appropriate to the retention policy. Use different access keys for application documents and database backups.
8. Keep both buckets private. Browser uploads go through the authenticated Malaysian API, so the documents bucket does not need a CORS policy. Apply provider-supported default server-side encryption and verify it on an uploaded test object before launch.

## 3. DNS and Vercel

At the authoritative DNS provider for `veraehealth.com`:

- keep the current apex redirect and `www` Vercel records;
- create `api.veraehealth.com` as an A record to the NovaCloud static IP;
- add `app.veraehealth.com` to the existing Vercel project and follow the exact CNAME/A record Vercel displays;
- create `api-uat.veraehealth.com` only while a temporary UAT VM exists.

In Vercel, set `VITE_API_URL=https://api.veraehealth.com` and, when enabled, `VITE_TURNSTILE_SITE_KEY`. Never add database, S3-secret, HMAC-secret, or admin credentials to Vercel.

## 4. Prepare Ubuntu

Sign in with the SSH key, create a named non-root operator with sudo, disable password/root SSH, enable unattended security upgrades, set timezone UTC, and install Docker Engine plus the Compose plugin from Docker's Ubuntu repository. Clone the private repository to `/opt/verae`.

Create the external production volume before Compose starts:

```sh
sudo install -d -o 999 -g 999 -m 700 /srv/verae/postgres
docker volume create --driver local \
  --opt type=none --opt o=bind --opt device=/srv/verae/postgres \
  verae_postgres_data
```

Copy `infra/docker/.env.production.example` to `infra/docker/.env.production` and `server/.env.production.example` to `server/.env.production`. Restrict both to the operator (`chmod 600`). Generate every secret independently; URL-encode database passwords inside connection URLs.

## 5. First database and application deployment

1. Start PostgreSQL and ClamAV only:

   ```sh
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/compose.production.yml up -d postgres clamav
   ```

2. Build the API image and run migrations with the owner URL:

   ```sh
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/compose.production.yml build api worker
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/compose.production.yml --profile tools run --rm tools \
     node server/dist/db/migrate.js
   ```

3. Enable the four least-privilege database logins from the dedicated URLs:

   ```sh
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/compose.production.yml --profile tools run --rm tools \
     node server/dist/scripts/provision-logins.js
   ```

4. Initialise backup archiving and take the first full backup:

   ```sh
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/compose.production.yml exec --user postgres postgres \
     pgbackrest --stanza=verae stanza-create
   infra/scripts/backup.sh full
   infra/scripts/check_backup.sh
   ```

5. Start the API, worker, and Caddy:

   ```sh
   docker compose --env-file infra/docker/.env.production \
     -f infra/docker/compose.production.yml up -d
   ```

6. Verify `https://api.veraehealth.com/health/live`, `/health/ready`, and `/docs`.
7. With Turnstile temporarily unset, run the one-time administrator bootstrap using the `tools` service plus temporary `BOOTSTRAP_ADMIN_*` values. Remove those values immediately afterward, enable Turnstile, restart, and enrol the admin in TOTP before setting `REQUIRE_STAFF_MFA=true`.
8. Create/rotate a lab credential only through the one-off `partner:credential` script with `PARTNER_SLUG`, `PARTNER_KEY_ID`, and a separately delivered random `PARTNER_SHARED_SECRET`; never store the plaintext secret in the repository.

## 6. Recurring operations

- Schedule `backup.sh incr` hourly, `backup.sh diff` daily, and `backup.sh full` weekly using a root-owned systemd timer.
- Confirm `check_backup.sh` daily and alert on failure.
- Take production-volume snapshots, but do not treat snapshots as the database backup.
- Apply Ubuntu and container security updates monthly; urgent security patches sooner.
- Run a quarterly restore into a temporary isolated Malaysia VM and record measured RPO/RTO.
- Review SSH/firewall rules, staff access, lab credentials, audit events, quarantine, disk use, TLS expiry, and malware definitions.
- Deploy with `docker compose build`, run migrations through the profile-gated `tools` service, then `docker compose up -d`. Only that one-off service receives `DATABASE_ADMIN_URL`; the long-running API and worker do not.

## 7. Temporary UAT

Create a separate pay-as-you-go Malaysia C1/C2, separate database, buckets, secrets, and `api-uat` DNS record. Use invented data. Delete the VM, volumes, snapshots, DNS, credentials, and buckets after partner acceptance. Never run UAT services on the production VM.
