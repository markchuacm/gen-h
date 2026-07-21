# Gen-H Supabase backend

Vite React talks directly to Supabase (Auth + Postgres + Storage). All
authorization is enforced in the database via Row Level Security; the frontend
is untrusted. There is no middle-tier server. Admin work happens in the Supabase
dashboard (service role), which bypasses RLS.

## Layout

- `migrations/` — schema, RLS, functions, triggers. Applied with `supabase db push`.
- `admin-snippets.sql` — copy/paste SQL for the admin workflow (entering & releasing lab results, promoting users, assigning doctors).
- `biomarker-codes.md` — valid `biomarker_code` values (generated from `server/seeds/biomarker-catalog.json`).
- `tests/rls_checks.sql` — runnable assertions for the RLS guarantees.

## Environment

Frontend `.env` (gitignored) — the only two values the app needs:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

Never put the service role key, DB password, or any private key in the repo or
in a `VITE_`-prefixed variable. The OpenRouter keys used by `server/` stay
server-side (not `VITE_`).

## Applying migrations

```
supabase link --project-ref <ref>   # once
supabase db push                    # apply pending migrations to the linked project
supabase migration list             # verify local == remote
```

Migrations run under a dedicated CLI login role, so Supabase's default
privilege grants do **not** apply automatically. **Every table migration must
include explicit `grant` statements** matching its policy matrix — a policy
without the base grant fails with "permission denied for table".

## Roles

`profiles.role` is one of `member | doctor | admin`, default `member`. Members
and doctors can never change any role (column grant + `BEFORE UPDATE` freeze
trigger). Admins promote/demote **between member and doctor** in-app (the
`admin_set_role` RPC, capped so admins can't mint other admins). Create the
first admin — and any further admins — via the dashboard SQL editor:

```sql
update public.profiles set role = 'admin' where email = '<email>';
```

## Admin panel

Since migration `009_admin.sql`, admins run the member workflow from the in-app
ops console (`src/admin/`, served at `member.html` for `role = 'admin'`) instead
of the dashboard. It is authorized by `private.is_admin()`: additive SELECT
policies on every member table (drafts included), admin write policies + column
grants on results/documents, admin storage policies, and security-definer RPCs
for the sensitive transitions — `admin_case_overview`, `admin_doctor_overview`,
`admin_release_lab_report`, `admin_assign_doctor`, `admin_deactivate_assignment`,
`admin_set_role`, `admin_set_doctor_active`, `admin_set_stage`. Each RPC re-checks
`is_admin()` internally. `admin_notes` on `lab_reports` stays service-role-only
(never granted to clients). The dashboard SQL path below still works as a fallback.

### Manual workflow (fallback)

See `admin-snippets.sql`. In short: create a draft `lab_reports` row → insert
`biomarker_results` rows (codes from `biomarker-codes.md`, status one of
`optimal | at_risk | needs_attention`) → release (flips status + advances the
member's `current_stage` to `results_ready`). Draft reports are invisible to
members and doctors.

## Doctor assignment

```sql
insert into public.doctor_assignments (doctor_id, member_id) values ('<doctor>', '<member>');
```

Doctors see only assigned members' data (profile, onboarding, documents,
released results) and author care plans in-app. Setting an assignment's
`status` to `inactive` revokes access immediately.

## Care plan release

Doctors release via the app, which calls the `release_care_plan(plan_id)` RPC
(verifies the caller is the assigned doctor, flips status, advances the stage,
logs a workflow event — all atomically). It is the only way to release a plan.

## Audit & telemetry

- `workflow_events` — append-only journey log (readable by the member/assigned doctor).
- `audit_logs` — full OLD/NEW row snapshots for every change to the sensitive
  tables, written by a trigger. Dashboard-only (no client access): read it in
  Table Editor → `audit_logs`.

## Storage

One private bucket `health-documents`, path `{member_id}/{uuid}.{ext}`, 10MB
cap, six allowed types (PDF/JPG/PNG/CSV/DOC/DOCX) enforced by the bucket.
Viewing always uses short-lived signed URLs. Deleting an auth user cascades DB
rows but **not** storage objects — clear the member's folder in Storage first.

## Running the RLS tests

Fill the four ids at the top of `tests/rls_checks.sql` (member A, member B,
doctor assigned to A, and an admin), then run it in the SQL editor (or
`psql "$DATABASE_URL" -f supabase/tests/rls_checks.sql`). It raises on the first
failed assertion; a clean run prints `ALL RLS CHECKS PASSED`.

## What is intentionally not built (MVP)

OCR / automated biomarker extraction, automated status computation, lab
ordering, payments, admin-authored care plans (doctor-owned), Edge Functions,
realtime, email/push, care-plan version history, and a biomarker lookup table
(the catalog stays in the frontend).
