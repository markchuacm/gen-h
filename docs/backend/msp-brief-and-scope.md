# Verae Health — Backend Infrastructure Brief & Managed Services Scope of Works

**Prepared for:** prospective Managed Service Providers (MSPs)
**Purpose:** solicit quotes for ongoing operation and maintenance of the Verae
Health backend
**Status:** Request for Quotation (RFQ) — commercial-in-confidence

---

## 1. Engagement summary

Verae Health operates a small healthcare web application. The **application
code is built and owned in-house**; we are seeking an MSP to **operate and
maintain the production infrastructure** on AWS — patching, monitoring,
backups, incident response, and security/compliance upkeep.

Please read the priorities below before quoting — they shape the whole
engagement:

| Priority | Guidance for bidders |
|---|---|
| **Security & regulatory compliance** | **Non-negotiable.** We handle personal health data under Malaysia's PDPA. Do not propose anything that weakens the controls in §4 or moves data out of Malaysia. |
| **Lowest total cost** | We want a lean managed service. Quote for what a small, low-traffic system genuinely needs — not an enterprise 24/7 NOC. |
| **Low management overhead** | Favour automation and low-touch operations. The smaller and simpler the ongoing effort, the better. |
| **Scalability (low priority for now)** | Very few users, infrequent usage. Do **not** price for autoscaling, high-availability clustering, or multi-region. We will revisit if usage grows. |

This is deliberately a **modest footprint**. We would rather pay for a
right-sized retainer than an oversized platform.

---

## 2. Solution architecture

### 2.1 High-level topology

```
                          Internet (members, clinicians, lab partners)
                                        │
              ┌─────────────────────────┼──────────────────────────┐
              │ (static frontend)       │ (API/backend)             │
              ▼                         ▼                           │
   ┌────────────────────┐    ┌──────────────────────────────────┐  │
   │  Vercel (managed)  │    │  AWS Lightsail — Malaysia          │  │
   │  Landing page      │    │  region ap-southeast-5             │  │
   │  Member portal     │    │                                    │  │
   │  veraehealth.com   │    │  ┌──────────────────────────────┐  │  │
   │  app.veraehealth   │    │  │ verae-prod (Ubuntu 24.04,    │  │  │
   │       .com         │    │  │ 2 GB, static IP)             │  │  │
   └─────────┬──────────┘    │  │  Docker Compose:             │  │  │
             │ HTTPS         │  │   • Caddy (TLS reverse proxy)│  │  │
             └──────────────►│  │   • API (Node.js/Fastify)    │  │  │
                             │  │   • Worker (background jobs) │  │  │
                             │  │   • ClamAV (malware scan)    │  │  │
                             │  └───────────┬──────────────────┘  │  │
                             │              │ private, TLS         │  │
                             │  ┌───────────▼──────────────────┐  │  │
                             │  │ verae-prod-db                │  │  │
                             │  │ Lightsail managed PostgreSQL │  │  │
                             │  │ (private endpoint, backups + │  │  │
                             │  │  point-in-time recovery)     │  │  │
                             │  └──────────────────────────────┘  │  │
                             │  ┌──────────────────────────────┐  │  │
                             │  │ Lightsail buckets (S3-compat)│  │  │
                             │  │  • documents (private, ver-  │  │  │
                             │  │    sioned) • backups         │  │  │
                             │  └──────────────────────────────┘  │  │
                             │                                    │  │
                             │  verae-staging (mirror; invented   │  │
                             │  test data only, container DB)     │  │
                             └────────────────────────────────────┘  │
                                                                      │
   DNS: Porkbun ────────────────────────────────────────────────────┘
   Email: Resend (transactional SMTP)
```

### 2.2 Environments

| Environment | Instance | Public hostname | Database | Data |
|---|---|---|---|---|
| **Production** | `verae-prod` | `api.veraehealth.com` | Lightsail **managed** PostgreSQL (`verae-prod-db`) | **Real patient data (PHI)** |
| **Staging / UAT** | `verae-staging` | `api-uat.veraehealth.com` | PostgreSQL **container** on the instance | Invented test data only — **never** real data |

Frontend (marketing site + member portal) is hosted on **Vercel** and is **out
of scope** for the MSP (see §8). Production portal: `app.veraehealth.com`;
staging portal: `app-uat.veraehealth.com`.

### 2.3 Compute footprint (per environment)

Each instance is a single **2 GB RAM / Ubuntu 24.04** Lightsail VM running a
Docker Compose stack:

| Container | Role |
|---|---|
| **Caddy** | Reverse proxy; automatic Let's Encrypt TLS; security headers (HSTS) |
| **API** | Node.js 24 / Fastify HTTP API |
| **Worker** | Background job processor (lab-result ingestion, document malware scanning) |
| **ClamAV** | On-instance antivirus engine scanning every uploaded document |
| **PostgreSQL** | Staging only (production uses the managed database) |

The application stack is orchestrated by Docker Compose and defined entirely in
our source repository. A one-command deploy script ships a reviewed build,
runs database migrations, and restarts the services.

### 2.4 Key technologies

- **Runtime:** Node.js 24 (Fastify 5), TypeScript, packaged as a Docker image.
- **Authentication:** Better Auth — email/password with verification, Google
  OAuth, TOTP two-factor for staff, Cloudflare Turnstile CAPTCHA, account
  lockout, database-backed sessions.
- **Database:** PostgreSQL with **four separate least-privilege application
  logins** (api / auth / worker / jobs) plus a restricted admin login used only
  for migrations. Row-level security enforces per-user data isolation.
- **Background jobs:** pg-boss (PostgreSQL-backed queue).
- **Object storage:** Lightsail S3-compatible buckets — one for member
  documents (private, versioned), one for backups; separate access keys per
  environment.
- **Email:** Resend (transactional SMTP) for verification and password-reset
  mail.
- **Lab integrations:** signed (HMAC) inbound webhooks from lab partners,
  processed idempotently by the worker.
- **TLS everywhere:** public HTTPS via Caddy/Let's Encrypt; database
  connections use `sslmode=verify-full` against the AWS RDS CA bundle.

### 2.5 Indicative AWS resource cost (borne directly by Verae)

For scale context only — **the MSP does not pay these; they are billed to our
AWS account.** Approximate: 2× Lightsail instances, 1× managed database, 2×
bucket sets, snapshots, and CloudWatch logs total roughly **US$45–55 / month**.
This figure signals how small the estate is; please size your service
accordingly.

---

## 3. What is already in place (baseline the MSP inherits)

The infrastructure has been built and security-hardened prior to handover. The
MSP is taking over a working, documented system — **not** building from scratch.

- Production and staging fully separated (instances, databases, buckets,
  credentials); real data exists only in production.
- Managed database with automated daily backups and point-in-time recovery;
  public network access disabled (private endpoint only).
- SSH is key-only, root login disabled, and restricted by firewall to approved
  operator IP addresses (IPv4 and IPv6); never open to the world.
- Unattended security updates enabled on both instances.
- Document buckets private and versioned; account-level S3 public-access
  blocking enabled.
- Malware scanning (ClamAV) on every document upload.
- Centralised logging and instance disk/memory/CPU metrics via the CloudWatch
  agent; log retention configured.
- Full operational runbook, deployment tooling, and a launch/compliance
  checklist are provided as part of handover.

A detailed **operations runbook** (deployment, backup/restore, incident
response, quarterly review checklist) will be provided to the selected MSP.

---

## 4. Regulatory & security requirements (mandatory)

These are **conditions of engagement**. Any proposal must comply.

1. **Data residency — Malaysia.** All production data (database, documents,
   backups, snapshots, logs containing any personal data) must remain in the
   AWS `ap-southeast-5` (Malaysia) region. Data must **not** be copied,
   replicated, or restored outside this region, including for testing.
2. **PDPA compliance.** We are subject to Malaysia's Personal Data Protection
   Act. The MSP acts as a **data processor** and must sign a Data Processing
   Agreement. Personal/health data may only be accessed to the minimum extent
   necessary to operate the service.
3. **Breach notification.** Any suspected security incident or data breach must
   be reported to Verae **without undue delay (target: within 24 hours of
   detection)** so we can meet our regulatory notification obligations.
4. **Least-privilege, auditable access.** MSP personnel access AWS through
   individual, named IAM identities (never our root account), each with
   multi-factor authentication and scoped permissions. Access must be
   logged/auditable and promptly revoked on personnel changes.
5. **No weakening of controls.** The security posture in §3 must be maintained.
   Any proposed change that reduces it (e.g. opening database public access,
   relaxing SSH restrictions, disabling TLS verification) is prohibited without
   our written approval.
6. **Personnel.** Staff with access to production should be identifiable and,
   where practical, based within a jurisdiction compatible with our data-
   protection obligations. State in your proposal where your operational staff
   are located.

---

## 5. Scope of Works — recurring managed services

Please quote against the following service catalogue. Cadence shown is our
expected minimum; propose alternatives if you can meet the outcome more
efficiently.

### 5.1 Monitoring & alerting
- Maintain metric alarms on both instances and the managed database (CPU, disk
  usage, memory, burst capacity, database storage/connections).
- Maintain an external uptime check on the API health endpoints
  (`/health/ready`) for both production and staging.
- Receive and triage alerts; acknowledge and act per the service levels in §6.

### 5.2 Logging
- Ensure application and proxy logs continue to reach centralised,
  access-controlled storage (CloudWatch) with the agreed retention.
- Confirm logs remain free of personal data / secrets (redaction is already
  implemented in the app; the MSP verifies the pipeline stays healthy).

### 5.3 Patching & updates
- Verify unattended OS security updates are applying.
- **Monthly:** apply full OS package upgrades, refresh container base images,
  and reboot each instance within an agreed maintenance window (staging first,
  then production).
- Track the managed database's maintenance-window patching.

### 5.4 Backups & disaster recovery
- Confirm managed-database automated backups and point-in-time recovery remain
  enabled.
- Take a **manual database snapshot before every production change/migration**.
- Maintain automatic instance snapshots and document-bucket versioning.
- **Quarterly DR test:** restore the latest database snapshot and a
  deleted-document version into an **isolated temporary environment in the
  Malaysia region**, verify integrity, tear it down, and record measured
  recovery point/time. **Target: RPO ≤ 1 hour, RTO ≤ 4 hours.**

### 5.5 Security operations
- Maintain SSH firewall allow-lists and key-only access.
- **Quarterly:** rotate object-storage access keys; review firewall rules,
  IAM access, staff/user accounts, TLS certificate validity, and malware
  signature freshness.
- Apply urgent security patches out-of-band when a critical vulnerability
  affects our stack.
- Manage TLS certificates (Caddy auto-renews; MSP monitors for renewal
  failures).

### 5.6 Capacity & housekeeping
- Monitor disk usage; run container image/cache cleanup to prevent disk
  exhaustion (the most likely failure mode on a 2 GB instance).
- Advise if the instance/database bundle needs resizing (we approve any change
  that affects cost).

### 5.7 Deployment support (light)
- Application deployments are performed via our provided one-command script and
  are normally run by Verae. The MSP should be **able to execute a deployment
  and run database migrations** using the runbook when we request it, and to
  take the pre-deployment snapshot.
- *(Optional line item — please price separately if offered:)* run our
  deployments on our behalf on request.

### 5.8 Incident response
- First response and diagnosis for production incidents per §6.
- Execute documented recovery procedures (service restart, restore from
  snapshot, credential rotation).
- Lead technical containment for suspected compromise and support our PDPA
  breach process, including the documented "detach static IP / preserve for
  forensics / restore clean / rotate secrets" playbook.

### 5.9 Reporting
- Monthly summary: patching status, alerts/incidents, backup verification,
  and any risks.
- Quarterly: DR test results and security-review outcomes.

### 5.10 Responsibility matrix

| Activity | Verae | MSP |
|---|---|---|
| Application code, features, bug fixes | ● | |
| Frontend / Vercel hosting | ● | |
| Building the deployment artifact (CI) | ● | |
| Approving infrastructure/cost changes | ● | |
| OS & container patching, reboots | | ● |
| Monitoring, alerting, on-call triage | | ● |
| Backups, snapshots, DR testing | | ● |
| Security ops, key rotation, firewall | | ● |
| Incident response & recovery execution | | ● |
| TLS/certificate health | | ● |
| Running deployments on request | ○ (default) | ○ (optional) |
| PDPA breach *notification to authorities* | ● | (supports) |

*(● = owner, ○ = either per agreement)*

---

## 6. Service levels (proposed — bidders may counter-propose)

Given low usage and cost priority, we expect **business-hours support with
best-effort after-hours cover for critical production issues** — not a
full 24/7 staffed desk. Propose what you can offer at what price; tiered
options are welcome.

| Severity | Definition | Target response | Target resolution/workaround |
|---|---|---|---|
| **P1 — Critical** | Production API down, data loss, or active security incident | 1 hour (incl. after-hours best-effort) | 4 hours |
| **P2 — High** | Major degradation; backups failing; no redundancy for a key function | 4 business hours | 1 business day |
| **P3 — Normal** | Minor issue, single alarm, non-urgent request | 1 business day | 5 business days |
| **P4 — Scheduled** | Patching, reviews, planned changes | Per calendar | Per calendar |

- **Maintenance window:** to be agreed (suggest a low-traffic weekly/monthly
  slot); production changes always follow a successful staging change.
- **Change control:** any change affecting security posture or monthly cost
  requires Verae's prior approval.

---

## 7. Access & handover model

- **AWS:** MSP staff use named IAM users (MFA enforced, least-privilege
  policies). Root account remains with Verae and is not shared.
- **Servers:** SSH by individual keys, added to the firewall allow-list;
  Lightsail browser-SSH retained as emergency fallback.
- **Secrets:** production secrets live only on the servers (never in the code
  repository). The MSP manages them in place; Verae holds the master copies.
- **Offboarding:** on personnel change or contract end, all MSP credentials,
  keys, and IAM users are revoked and secrets rotated. Please describe your
  offboarding process.
- **Documentation provided at handover:** operations runbook, deployment
  tooling, environment inventory, and this architecture brief.

---

## 8. Explicitly out of scope

- Application/feature development, code changes, and bug fixes (Verae's team).
- Frontend hosting and the Vercel account.
- DNS registrar administration (Porkbun) beyond advising on required records.
- Third-party SaaS accounts (Resend, Cloudflare Turnstile, Google OAuth) beyond
  advising on configuration.
- Product/clinical decisions, and PDPA *legal* obligations (the MSP supports
  the technical response but Verae remains the data controller).
- Autoscaling / high-availability / multi-region architecture (not required at
  current scale).

---

## 9. Assumptions & constraints

- Very low traffic and infrequent usage; a single instance per environment is
  sufficient and there is **no high-availability requirement** at present.
- A short, scheduled maintenance-window outage is acceptable.
- The estate is intentionally small; we are optimising for **low recurring
  cost and low operational overhead**, not headroom.
- The application is already built, hardened, and documented; this is an
  **operate-and-maintain** engagement, not a build.
- All work must preserve Malaysia data residency and the §4 controls.

---

## 10. What we would like in your quotation

Please structure your response to include:

1. **One-time onboarding / takeover fee** — access setup, familiarisation,
   verification of the current state, and any remediation you recommend.
2. **Recurring monthly managed-service fee** — covering §5. Break down by
   service area where possible, and state clearly what is included vs
   metered/extra.
3. **Support model & SLA options** — your proposed severity response times and
   coverage hours (see §6), with pricing per tier if you offer choices.
4. **Incident / out-of-hours handling** — how P1s are covered after hours and
   any associated cost.
5. **Optional line items** — e.g. running deployments on our behalf (§5.7),
   deeper security services, penetration testing.
6. **Compliance statements** — confirmation of §4 (data residency, DPA
   willingness, breach-notification commitment, staff location, access model).
7. **Assumptions & exclusions** in your pricing.
8. **References** — comparable small healthcare/regulated workloads you operate,
   ideally in the Malaysia/APAC region.

We are comparing on **value at our scale**: the right-sized, compliant, low-
overhead option — not the largest capability or the lowest headline number.

---

*Prepared by Verae Health. A detailed technical operations runbook is available
to shortlisted bidders under NDA.*
