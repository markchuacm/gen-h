-- Guided, co-authored care plans. Existing rows remain valid: all new plan
-- metadata is nullable/defaulted, and legacy sections continue to use markers
-- plus actions exactly as before.

alter table app.care_plans
  add column ruleset_version text,
  add column generation_mode text check (generation_mode in ('results', 'prevention', 'manual')),
  add column generation_status text not null default 'ready'
    check (generation_status in ('pending', 'ready', 'failed', 'stale')),
  add column source_report_ids uuid[] not null default '{}',
  add column review_date date,
  add column evidence_stale boolean not null default false,
  add column draft_revision integer not null default 0,
  add column doctor_edited_at timestamptz;

alter table app.care_plan_sections
  add column template_key text,
  add column basis_type text not null default 'legacy'
    check (basis_type in ('results', 'prevention', 'manual', 'legacy')),
  add column section_state text not null default 'active'
    check (section_state in ('active', 'deferred')),
  add column defer_reason text,
  add column evidence_snapshot jsonb not null default '[]'::jsonb,
  add column profile_basis jsonb not null default '[]'::jsonb,
  add column proposed_actions jsonb not null default '[]'::jsonb;

create table app.care_plan_generation_states (
  member_id text primary key references app.profiles(id) on delete cascade,
  report_id uuid references app.lab_reports(id) on delete set null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  last_error text,
  updated_at timestamptz not null default now()
);

create table app.care_plan_action_progress (
  care_plan_id uuid not null references app.care_plans(id) on delete cascade,
  member_id text not null references app.profiles(id) on delete cascade,
  action_id text not null,
  completed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (care_plan_id, action_id)
);

alter table app.care_plan_generation_states enable row level security;
create policy care_plan_generation_states_staff_select
  on app.care_plan_generation_states for select to verae_app
  using (app.is_admin() or app.is_doctor_of(member_id));

alter table app.care_plan_action_progress enable row level security;
create policy care_plan_action_progress_select
  on app.care_plan_action_progress for select to verae_app
  using (
    member_id = app.current_user_id()
    or app.is_doctor_of(member_id)
    or app.is_admin()
  );
create policy care_plan_action_progress_member_write
  on app.care_plan_action_progress for all to verae_app
  using (member_id = app.current_user_id())
  with check (
    member_id = app.current_user_id()
    and exists (
      select 1 from app.care_plans p
      where p.id = care_plan_id
        and p.member_id = member_id
        and p.status = 'released'
    )
  );

-- The generation worker needs the same clinical inputs the doctor can read,
-- plus write access to drafts and generation state.
grant select on app.doctor_assignments, app.onboarding_responses, app.profiles to verae_worker;
grant select, insert, update on app.care_plans, app.care_plan_generation_states to verae_worker;
grant select, insert, update, delete on app.care_plan_sections to verae_worker;
grant select on app.care_plan_action_progress to verae_worker;
grant select, insert, update, delete on app.care_plan_action_progress to verae_app;
grant select, insert, update on app.care_plan_generation_states to verae_app;

create policy care_plan_generation_states_worker
  on app.care_plan_generation_states for all to verae_worker
  using (true) with check (true);
create policy doctor_assignments_worker_select
  on app.doctor_assignments for select to verae_worker using (true);
create policy onboarding_responses_worker_select
  on app.onboarding_responses for select to verae_worker using (true);
create policy care_plans_worker
  on app.care_plans for all to verae_worker using (true) with check (true);
create policy care_plan_sections_worker
  on app.care_plan_sections for all to verae_worker using (true) with check (true);

-- Extend the released-plan immutability exception so archiving a released
-- version remains legal after adding metadata columns.
create or replace function app.reject_released_care_plan_mutation()
returns trigger language plpgsql as $$
begin
  if old.status = 'archived' then
    raise exception using errcode = 'P0001', message = 'RELEASED_IMMUTABLE',
      detail = 'Archived care plans are immutable.';
  end if;

  if old.status = 'released' then
    if tg_op = 'UPDATE'
      and new.status = 'archived'
      and new.member_id is not distinct from old.member_id
      and new.doctor_id is not distinct from old.doctor_id
      and new.title is not distinct from old.title
      and new.summary is not distinct from old.summary
      and new.released_at is not distinct from old.released_at
      and new.version is not distinct from old.version
      and new.supersedes_plan_id is not distinct from old.supersedes_plan_id
      and new.ruleset_version is not distinct from old.ruleset_version
      and new.generation_mode is not distinct from old.generation_mode
      and new.generation_status is not distinct from old.generation_status
      and new.source_report_ids is not distinct from old.source_report_ids
      and new.review_date is not distinct from old.review_date
      and new.evidence_stale is not distinct from old.evidence_stale
      and new.draft_revision is not distinct from old.draft_revision
      and new.doctor_edited_at is not distinct from old.doctor_edited_at then
      return new;
    end if;
    raise exception using errcode = 'P0001', message = 'RELEASED_IMMUTABLE',
      detail = 'Released care plans must be edited as a new version.';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
