-- Clinical coverage areas for the doctor blood-panel builder. These are
-- intentionally distinct from laboratory/body-system categories: one marker
-- can contribute to several preventive-care risk areas.
--
-- Advanced Baseline is deliberately not persisted as a mapped area. It is a
-- complete-active-catalog shortcut in the doctor UI, so it cannot silently
-- become incomplete when a new biomarker is added.

create table app.biomarker_risk_areas (
  id text primary key,
  name text not null unique,
  description text not null default '',
  display_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.biomarker_risk_area_members (
  biomarker_id text not null references app.biomarkers(id) on delete cascade,
  risk_area_id text not null references app.biomarker_risk_areas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (biomarker_id, risk_area_id)
);
create index biomarker_risk_area_members_area_idx
  on app.biomarker_risk_area_members (risk_area_id, biomarker_id);

create trigger biomarker_risk_areas_updated_at before update on app.biomarker_risk_areas
  for each row execute function app.set_updated_at();
create trigger biomarker_risk_areas_audit after insert or update or delete on app.biomarker_risk_areas
  for each row execute function audit.capture_mutation();

-- Risk areas are reference data, visible wherever the active catalog is
-- visible. Membership visibility follows its active marker and risk area.
alter table app.biomarker_risk_areas enable row level security;
create policy biomarker_risk_areas_select on app.biomarker_risk_areas
  for select using (is_active or app.is_admin());
create policy biomarker_risk_areas_admin_write on app.biomarker_risk_areas
  for all using (app.is_admin()) with check (app.is_admin());
create policy biomarker_risk_areas_worker_select on app.biomarker_risk_areas
  for select to verae_worker using (true);

alter table app.biomarker_risk_area_members enable row level security;
create policy biomarker_risk_area_members_select on app.biomarker_risk_area_members
  for select using (
    exists (select 1 from app.biomarkers b where b.id = biomarker_id)
    and exists (select 1 from app.biomarker_risk_areas r where r.id = risk_area_id)
  );
create policy biomarker_risk_area_members_admin_write on app.biomarker_risk_area_members
  for all using (app.is_admin()) with check (app.is_admin());
create policy biomarker_risk_area_members_worker_select on app.biomarker_risk_area_members
  for select to verae_worker using (true);

grant select, insert, update, delete
  on app.biomarker_risk_areas, app.biomarker_risk_area_members to verae_app;
grant select
  on app.biomarker_risk_areas, app.biomarker_risk_area_members to verae_worker;
