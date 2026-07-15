create extension if not exists pgcrypto;

create schema if not exists identity;
create schema if not exists app;
create schema if not exists integration;
create schema if not exists audit;

do $$ begin
  create role verae_app nologin;
exception when duplicate_object then null;
end $$;

do $$ begin
  create role verae_worker nologin;
exception when duplicate_object then null;
end $$;

do $$ begin
  create role verae_auth nologin;
exception when duplicate_object then null;
end $$;

do $$ begin
  create role verae_api_login nologin;
exception when duplicate_object then null;
end $$;
do $$ begin
  create role verae_auth_login nologin;
exception when duplicate_object then null;
end $$;
do $$ begin
  create role verae_worker_login nologin;
exception when duplicate_object then null;
end $$;
do $$ begin
  create role verae_jobs_login nologin;
exception when duplicate_object then null;
end $$;

grant verae_app to verae_api_login;
grant verae_auth to verae_auth_login;
grant verae_worker to verae_worker_login;
grant verae_app, verae_auth, verae_worker, verae_api_login, verae_auth_login, verae_worker_login, verae_jobs_login to current_user;
create schema if not exists pgboss authorization verae_jobs_login;

-- Better Auth v1.6 core + two-factor + database rate-limit schema.
create table identity."user" (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "twoFactorEnabled" boolean not null default false
);

create table identity.session (
  id text primary key,
  "expiresAt" timestamptz not null,
  token text not null unique,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references identity."user"(id) on delete cascade
);
create index session_user_id_idx on identity.session ("userId");

create table identity.account (
  id text primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references identity."user"(id) on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  password text,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null,
  unique ("providerId", "accountId")
);
create index account_user_id_idx on identity.account ("userId");

create table identity.verification (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz not null,
  "updatedAt" timestamptz not null
);
create index verification_identifier_idx on identity.verification (identifier);

create table identity."twoFactor" (
  id text primary key,
  secret text not null,
  "backupCodes" text not null,
  "userId" text not null references identity."user"(id) on delete cascade,
  verified boolean not null default true,
  "failedVerificationCount" integer not null default 0,
  "lockedUntil" timestamptz
);
create index two_factor_secret_idx on identity."twoFactor" (secret);
create index two_factor_user_id_idx on identity."twoFactor" ("userId");

create table identity."rateLimit" (
  id text primary key,
  key text not null unique,
  count integer not null,
  "lastRequest" bigint not null
);

create table app.profiles (
  id text primary key references identity."user"(id) on delete cascade,
  role text not null default 'member' check (role in ('member', 'doctor', 'admin')),
  account_status text not null default 'pending' check (account_status in ('pending', 'active', 'suspended')),
  email text not null,
  full_name text,
  avatar_url text,
  doctor_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.member_profiles (
  member_id text primary key references app.profiles(id) on delete cascade,
  preferred_name text,
  age integer check (age between 0 and 130),
  sex text,
  height_cm numeric(6,2) check (height_cm is null or height_cm > 0),
  weight_kg numeric(7,2) check (weight_kg is null or weight_kg > 0),
  goals text[],
  medications text,
  conditions text,
  onboarding_status text not null default 'not_started' check (onboarding_status in ('not_started', 'in_progress', 'completed')),
  current_stage text not null default 'profile_incomplete' check (current_stage in ('profile_incomplete', 'consult_upcoming', 'blood_form_ready', 'results_pending', 'results_ready', 'care_plan_ready')),
  profile_confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.onboarding_responses (
  member_id text not null references app.profiles(id) on delete cascade,
  question_key text not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (member_id, question_key)
);

create table app.health_documents (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references app.profiles(id) on delete cascade,
  object_key text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  checksum_sha256 text,
  doc_type text,
  scan_status text not null default 'pending' check (scan_status in ('pending', 'clean', 'infected', 'failed')),
  uploaded_by text references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index health_documents_member_idx on app.health_documents (member_id, created_at desc);

create table integration.lab_partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name text not null,
  status text not null default 'uat' check (status in ('disabled', 'uat', 'active')),
  transport text not null default 'https_json',
  adapter_type text not null default 'canonical_json',
  source_system text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table integration.partner_credentials (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references integration.lab_partners(id) on delete cascade,
  key_id text not null,
  secret_ciphertext text not null,
  active_from timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (partner_id, key_id)
);

create table app.lab_orders (
  id uuid primary key default gen_random_uuid(),
  client_order_id text not null unique default encode(gen_random_bytes(18), 'hex'),
  member_id text not null references app.profiles(id) on delete cascade,
  partner_id uuid references integration.lab_partners(id) on delete set null,
  external_order_id text,
  accession_number text,
  biomarker_codes text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'ordered', 'collected', 'completed', 'cancelled')),
  ordered_at timestamptz,
  created_by text references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lab_orders_member_idx on app.lab_orders (member_id, created_at desc);

create table app.lab_reports (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references app.profiles(id) on delete cascade,
  lab_order_id uuid references app.lab_orders(id) on delete set null,
  partner_id uuid references integration.lab_partners(id) on delete set null,
  external_report_id text,
  source_version integer not null default 1 check (source_version > 0),
  source_status text not null default 'final' check (source_status in ('preliminary', 'final', 'amended', 'corrected', 'cancelled', 'entered_in_error')),
  supersedes_report_id uuid references app.lab_reports(id) on delete set null,
  lab_name text,
  panel_name text,
  collected_at timestamptz,
  issued_at timestamptz,
  received_at timestamptz not null default now(),
  document_id uuid references app.health_documents(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'quarantined', 'review_pending', 'released', 'rejected')),
  released_at timestamptz,
  created_by text references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (partner_id, external_report_id, source_version)
);
create index lab_reports_member_idx on app.lab_reports (member_id, collected_at desc);

create table app.biomarker_results (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null references app.lab_reports(id) on delete cascade,
  member_id text not null references app.profiles(id) on delete cascade,
  source_code text not null,
  source_system text not null default 'VERAE',
  biomarker_code text not null,
  biomarker_name text,
  category text,
  source_value text not null,
  value_numeric numeric,
  value_text text,
  source_unit text,
  unit text,
  source_reference_range text,
  ref_low numeric,
  ref_high numeric,
  optimal_low numeric,
  optimal_high numeric,
  source_flag text,
  source_status text,
  status text not null check (status in ('optimal', 'at_risk', 'needs_attention')),
  mapping_version integer,
  notes text,
  observed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index biomarker_results_report_idx on app.biomarker_results (lab_report_id);
create index biomarker_results_member_idx on app.biomarker_results (member_id);

create table app.doctor_assignments (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references app.profiles(id) on delete cascade,
  doctor_id text not null references app.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'inactive')),
  assigned_by text references app.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz
);
create unique index one_active_doctor_per_member on app.doctor_assignments (member_id) where status = 'active';
create index doctor_assignments_doctor_idx on app.doctor_assignments (doctor_id) where status = 'active';

create table app.care_plans (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references app.profiles(id) on delete cascade,
  doctor_id text not null references app.profiles(id) on delete restrict,
  title text,
  summary text,
  status text not null default 'draft' check (status in ('draft', 'released', 'archived')),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index care_plans_member_idx on app.care_plans (member_id, created_at desc);

create table app.care_plan_sections (
  id uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references app.care_plans(id) on delete cascade,
  sort_order integer not null,
  title text,
  summary text,
  markers text[] not null default '{}',
  doctor_note text,
  image_key text,
  actions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (care_plan_id, sort_order)
);

create table integration.inbound_events (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references integration.lab_partners(id) on delete restrict,
  partner_event_id text not null,
  content_type text not null,
  raw_payload bytea not null,
  payload_sha256 text not null,
  request_timestamp timestamptz not null,
  received_at timestamptz not null default now(),
  processing_status text not null default 'received' check (processing_status in ('received', 'processing', 'imported', 'quarantined', 'failed')),
  processed_at timestamptz,
  error_code text,
  error_detail text,
  lab_report_id uuid references app.lab_reports(id) on delete set null,
  unique (partner_id, partner_event_id)
);
create index inbound_events_status_idx on integration.inbound_events (processing_status, received_at);

create table integration.code_mappings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references integration.lab_partners(id) on delete cascade,
  source_code text not null,
  source_unit text not null default '',
  biomarker_code text not null,
  normalized_unit text,
  conversion_rule jsonb,
  version integer not null check (version > 0),
  status text not null default 'draft' check (status in ('draft', 'approved', 'retired')),
  approved_by text references app.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (partner_id, source_code, source_unit, version)
);

create table integration.processing_issues (
  id uuid primary key default gen_random_uuid(),
  inbound_event_id uuid not null references integration.inbound_events(id) on delete cascade,
  issue_code text not null,
  message text not null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open', 'resolved', 'ignored')),
  resolved_by text references app.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit.events (
  id bigserial primary key,
  occurred_at timestamptz not null default now(),
  actor_id text,
  actor_role text,
  request_id text,
  schema_name text not null,
  table_name text not null,
  action text not null,
  record_id text,
  changed_fields text[] not null default '{}'
);
create index audit_events_actor_idx on audit.events (actor_id, occurred_at desc);
create index audit_events_record_idx on audit.events (schema_name, table_name, record_id, occurred_at desc);

create or replace function app.current_user_id() returns text
language sql stable as $$ select nullif(current_setting('app.user_id', true), '') $$;

create or replace function app.current_user_role() returns text
language sql stable as $$ select nullif(current_setting('app.user_role', true), '') $$;

create or replace function app.is_admin() returns boolean
language sql stable as $$ select coalesce(app.current_user_role() = 'admin', false) $$;

create or replace function app.is_doctor_of(target_member_id text) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select exists (
    select 1 from app.doctor_assignments
    where member_id = target_member_id
      and doctor_id = app.current_user_id()
      and status = 'active'
  )
$$;

create or replace function app.can_view_profile(target_id text) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select app.is_admin()
    or target_id = app.current_user_id()
    or exists (
      select 1 from app.doctor_assignments
      where status = 'active'
        and doctor_id = app.current_user_id()
        and member_id = target_id
    )
$$;

create or replace function app.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function audit.capture_mutation() returns trigger
language plpgsql security definer set search_path = audit, app, pg_temp as $$
declare
  old_json jsonb := case when tg_op = 'INSERT' then '{}'::jsonb else to_jsonb(old) end;
  new_json jsonb := case when tg_op = 'DELETE' then '{}'::jsonb else to_jsonb(new) end;
  target_json jsonb := case when tg_op = 'DELETE' then old_json else new_json end;
  changed text[];
begin
  select coalesce(array_agg(key order by key), '{}') into changed
  from (select key from jsonb_each(old_json || new_json) where old_json -> key is distinct from new_json -> key) fields;
  insert into audit.events (actor_id, actor_role, request_id, schema_name, table_name, action, record_id, changed_fields)
  values (
    app.current_user_id(), app.current_user_role(), nullif(current_setting('app.request_id', true), ''),
    tg_table_schema, tg_table_name, tg_op,
    coalesce(target_json->>'id', target_json->>'member_id'), changed
  );
  return case when tg_op = 'DELETE' then old else new end;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','member_profiles','onboarding_responses','health_documents','lab_orders','lab_reports','biomarker_results','doctor_assignments','care_plans','care_plan_sections']
  loop
    execute format('create trigger %I_updated_at before update on app.%I for each row execute function app.set_updated_at()', table_name, table_name);
    execute format('create trigger %I_audit after insert or update or delete on app.%I for each row execute function audit.capture_mutation()', table_name, table_name);
  end loop;
end $$;

-- RLS policies use the transaction-local actor set by the API.
alter table app.profiles enable row level security;
create policy profiles_select on app.profiles for select using (app.can_view_profile(id));
create policy profiles_admin_update on app.profiles for update using (app.is_admin()) with check (app.is_admin());
create policy profiles_auth_insert on app.profiles for insert to verae_auth with check (true);
create policy profiles_auth_select on app.profiles for select to verae_auth using (true);
create policy profiles_auth_update on app.profiles for update to verae_auth using (true) with check (true);

alter table app.member_profiles enable row level security;
create policy member_profiles_select on app.member_profiles for select using (member_id = app.current_user_id() or app.is_doctor_of(member_id) or app.is_admin());
create policy member_profiles_write on app.member_profiles for all using (member_id = app.current_user_id() or app.is_admin()) with check (member_id = app.current_user_id() or app.is_admin());
create policy member_profiles_auth_insert on app.member_profiles for insert to verae_auth with check (true);

alter table app.onboarding_responses enable row level security;
create policy onboarding_select on app.onboarding_responses for select using (member_id = app.current_user_id() or app.is_doctor_of(member_id) or app.is_admin());
create policy onboarding_write on app.onboarding_responses for all using (member_id = app.current_user_id() or app.is_admin()) with check (member_id = app.current_user_id() or app.is_admin());

alter table app.health_documents enable row level security;
create policy documents_select on app.health_documents for select using (member_id = app.current_user_id() or app.is_doctor_of(member_id) or app.is_admin());
create policy documents_insert on app.health_documents for insert with check (member_id = app.current_user_id() or app.is_admin());
create policy documents_update on app.health_documents for update using (member_id = app.current_user_id() or app.is_admin()) with check (member_id = app.current_user_id() or app.is_admin());
create policy documents_delete on app.health_documents for delete using (member_id = app.current_user_id() or app.is_admin());

alter table app.lab_orders enable row level security;
create policy orders_select on app.lab_orders for select using (member_id = app.current_user_id() or app.is_doctor_of(member_id) or app.is_admin());
create policy orders_write on app.lab_orders for all using (app.is_doctor_of(member_id) or app.is_admin()) with check (app.is_doctor_of(member_id) or app.is_admin());

alter table app.lab_reports enable row level security;
create policy reports_select on app.lab_reports for select using (app.is_admin() or ((member_id = app.current_user_id() or app.is_doctor_of(member_id)) and status = 'released'));
create policy reports_admin_write on app.lab_reports for all using (app.is_admin()) with check (app.is_admin());

alter table app.biomarker_results enable row level security;
create policy biomarkers_select on app.biomarker_results for select using (
  exists (select 1 from app.lab_reports r where r.id = lab_report_id)
);
create policy biomarkers_admin_write on app.biomarker_results for all using (app.is_admin()) with check (app.is_admin());

alter table app.doctor_assignments enable row level security;
create policy assignments_select on app.doctor_assignments for select using (member_id = app.current_user_id() or doctor_id = app.current_user_id() or app.is_admin());
create policy assignments_admin_write on app.doctor_assignments for all using (app.is_admin()) with check (app.is_admin());

alter table app.care_plans enable row level security;
create policy plans_select on app.care_plans for select using (app.is_admin() or (member_id = app.current_user_id() and status = 'released') or (doctor_id = app.current_user_id() and app.is_doctor_of(member_id)));
create policy plans_doctor_write on app.care_plans for all using (app.is_admin() or (doctor_id = app.current_user_id() and app.is_doctor_of(member_id))) with check (app.is_admin() or (doctor_id = app.current_user_id() and app.is_doctor_of(member_id)));

alter table app.care_plan_sections enable row level security;
create policy sections_select on app.care_plan_sections for select using (exists (select 1 from app.care_plans p where p.id = care_plan_id));
create policy sections_write on app.care_plan_sections for all using (exists (select 1 from app.care_plans p where p.id = care_plan_id and (app.is_admin() or p.doctor_id = app.current_user_id()))) with check (exists (select 1 from app.care_plans p where p.id = care_plan_id and (app.is_admin() or p.doctor_id = app.current_user_id())));

grant usage on schema app to verae_app;
grant select, insert, update, delete on all tables in schema app to verae_app;
grant usage, select on all sequences in schema app to verae_app;
grant execute on all functions in schema app to verae_app;
grant usage on schema audit to verae_app;
grant insert on audit.events to verae_app;
grant usage, select on all sequences in schema audit to verae_app;
grant usage on schema integration to verae_app;
grant select on integration.lab_partners, integration.partner_credentials, integration.inbound_events to verae_app;
grant insert on integration.inbound_events, integration.processing_issues to verae_app;
grant select, insert, update on integration.code_mappings, integration.processing_issues to verae_app;

grant usage on schema identity to verae_auth;
grant select, insert, update, delete on all tables in schema identity to verae_auth;
grant usage, select on all sequences in schema identity to verae_auth;
grant usage on schema app to verae_auth;
grant select, insert, update on app.profiles to verae_auth;
grant insert on app.member_profiles to verae_auth;

grant usage on schema app, integration, audit to verae_worker;
grant select, insert, update on all tables in schema integration to verae_worker;
grant select, insert, update on app.lab_orders, app.lab_reports, app.biomarker_results, app.member_profiles, app.health_documents to verae_worker;
grant usage, select on all sequences in schema audit to verae_worker;
grant insert on audit.events to verae_worker;

alter table integration.inbound_events enable row level security;
create policy inbound_api on integration.inbound_events for select to verae_app using (true);
create policy inbound_api_insert on integration.inbound_events for insert to verae_app with check (true);
create policy inbound_worker on integration.inbound_events for all to verae_worker using (true) with check (true);

alter table integration.code_mappings enable row level security;
create policy mappings_admin on integration.code_mappings for all to verae_app using (app.is_admin()) with check (app.is_admin());
create policy mappings_worker on integration.code_mappings for select to verae_worker using (true);

alter table integration.processing_issues enable row level security;
create policy issues_api_insert on integration.processing_issues for insert to verae_app with check (true);
create policy issues_admin on integration.processing_issues for select to verae_app using (app.is_admin());
create policy issues_admin_update on integration.processing_issues for update to verae_app using (app.is_admin()) with check (app.is_admin());
create policy issues_worker on integration.processing_issues for all to verae_worker using (true) with check (true);

create policy worker_orders on app.lab_orders for all to verae_worker using (true) with check (true);
create policy worker_reports on app.lab_reports for all to verae_worker using (true) with check (true);
create policy worker_biomarkers on app.biomarker_results for all to verae_worker using (true) with check (true);
create policy worker_member_profiles on app.member_profiles for update to verae_worker using (true) with check (true);
create policy worker_documents_select on app.health_documents for select to verae_worker using (true);
create policy worker_documents on app.health_documents for update to verae_worker using (true) with check (true);

revoke update, delete on audit.events from public, verae_app, verae_worker;

insert into integration.lab_partners (slug, name, status, adapter_type, source_system)
values ('innoquest', 'Innoquest', 'uat', 'canonical_json', 'INNOQUEST')
on conflict (slug) do nothing;
