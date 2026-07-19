-- Admin-invite onboarding. Members are no longer self-signup: an admin creates
-- the account with a temporary password (7-day expiry) and the member completes
-- a first-login setup wizard (auth method -> email OTP -> consent). These columns
-- track invite issuance and setup progress. They live on app.profiles (not
-- member_profiles) because the better-auth hooks connect as verae_auth, which can
-- update app.profiles but only insert into app.member_profiles (see 0001 grants).

alter table app.profiles
  add column invited_by text references app.profiles(id) on delete set null,
  add column invited_at timestamptz,
  add column temp_password_expires_at timestamptz,
  add column password_set_at timestamptz,
  add column email_verified_at timestamptz,
  add column setup_completed_at timestamptz;

-- Phone was captured at invite time but had no home; member-facing detail only.
alter table app.member_profiles add column phone text;

-- Versioned record of terms + health-data/telehealth consent accepted during
-- setup. The typed signature_name is the member's electronic signature.
create table app.member_consents (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references app.profiles(id) on delete cascade,
  terms_version text not null,
  consent_version text not null,
  signature_name text not null,
  accepted_at timestamptz not null default now()
);
create index member_consents_member_idx on app.member_consents (member_id);

alter table app.member_consents enable row level security;
create policy member_consents_select on app.member_consents for select
  using (member_id = app.current_user_id() or app.is_admin());
create policy member_consents_insert on app.member_consents for insert
  with check (member_id = app.current_user_id());

-- New table: verae_app's schema-wide grant in 0001 only covers tables that
-- existed then, so grant explicitly.
grant select, insert on app.member_consents to verae_app;

-- Everyone already active (existing members and all staff) has finished setup and
-- must never be dropped into the wizard.
update app.profiles set setup_completed_at = now() where account_status = 'active';
