-- Released clinical artifacts are immutable. Corrections are authored as new
-- versions so members never observe a half-edited report or care plan.

alter table app.care_plans
  add column version integer,
  add column supersedes_plan_id uuid references app.care_plans(id) on delete restrict;

with numbered as (
  select id, row_number() over (partition by member_id order by created_at, id)::integer as version
  from app.care_plans
)
update app.care_plans p set version = numbered.version
from numbered where numbered.id = p.id;

alter table app.care_plans alter column version set not null;
alter table app.care_plans alter column version set default 1;
create unique index care_plans_member_version_uidx on app.care_plans (member_id, version);

-- Preserve all existing rows while resolving historical duplicate working
-- records before adding the active-record invariants.
with ranked as (
  select id, row_number() over (partition by member_id order by created_at desc, id desc) as rank
  from app.lab_orders
  where status in ('draft', 'ordered', 'collected')
)
update app.lab_orders o set status = 'cancelled', updated_at = now()
from ranked where ranked.id = o.id and ranked.rank > 1;

create unique index one_active_lab_order_per_member
  on app.lab_orders (member_id)
  where status in ('draft', 'ordered', 'collected');

with ranked as (
  select id, row_number() over (partition by member_id order by created_at desc, id desc) as rank
  from app.care_plans where status = 'draft'
)
update app.care_plans p set status = 'archived', updated_at = now()
from ranked where ranked.id = p.id and ranked.rank > 1;

create unique index one_draft_care_plan_per_member
  on app.care_plans (member_id)
  where status = 'draft';

create unique index one_open_report_correction
  on app.lab_reports (supersedes_report_id)
  where supersedes_report_id is not null and status in ('draft', 'quarantined', 'review_pending');

create unique index one_released_report_replacement
  on app.lab_reports (supersedes_report_id)
  where supersedes_report_id is not null and status = 'released';

create or replace function app.reject_released_lab_report_mutation()
returns trigger language plpgsql as $$
begin
  if old.status = 'released' then
    raise exception using
      errcode = 'P0001',
      message = 'RELEASED_IMMUTABLE',
      detail = 'Released lab reports must be corrected with a new version.';
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger lab_reports_released_immutable
before update or delete on app.lab_reports
for each row execute function app.reject_released_lab_report_mutation();

create or replace function app.reject_released_biomarker_mutation()
returns trigger language plpgsql as $$
declare
  parent_status text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select status into parent_status from app.lab_reports
    where id = old.lab_report_id for share;
    if parent_status = 'released' then
      raise exception using errcode = 'P0001', message = 'RELEASED_IMMUTABLE',
        detail = 'Biomarkers belonging to a released report are immutable.';
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    select status into parent_status from app.lab_reports
    where id = new.lab_report_id for share;
    if parent_status = 'released' then
      raise exception using errcode = 'P0001', message = 'RELEASED_IMMUTABLE',
        detail = 'Biomarkers cannot be added to a released report.';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger biomarker_results_released_immutable
before insert or update or delete on app.biomarker_results
for each row execute function app.reject_released_biomarker_mutation();

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
      and new.supersedes_plan_id is not distinct from old.supersedes_plan_id then
      return new;
    end if;
    raise exception using errcode = 'P0001', message = 'RELEASED_IMMUTABLE',
      detail = 'Released care plans must be edited as a new version.';
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger care_plans_released_immutable
before update or delete on app.care_plans
for each row execute function app.reject_released_care_plan_mutation();

create or replace function app.reject_released_care_plan_section_mutation()
returns trigger language plpgsql as $$
declare
  parent_status text;
begin
  if tg_op in ('UPDATE', 'DELETE') then
    select status into parent_status from app.care_plans
    where id = old.care_plan_id for share;
    if parent_status in ('released', 'archived') then
      raise exception using errcode = 'P0001', message = 'RELEASED_IMMUTABLE',
        detail = 'Sections belonging to a released care plan are immutable.';
    end if;
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    select status into parent_status from app.care_plans
    where id = new.care_plan_id for share;
    if parent_status in ('released', 'archived') then
      raise exception using errcode = 'P0001', message = 'RELEASED_IMMUTABLE',
        detail = 'Sections cannot be added to a released care plan.';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger care_plan_sections_released_immutable
before insert or update or delete on app.care_plan_sections
for each row execute function app.reject_released_care_plan_section_mutation();
