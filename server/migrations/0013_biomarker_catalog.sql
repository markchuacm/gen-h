-- The biomarker catalog moves out of the frontend and into the database.
-- Until now src/member-v2/screens/results/biomarkerData.ts was the source of
-- truth for every marker's name, category, unit, ranges and explanatory copy,
-- which meant changing the panel required a code deploy and retiring a marker
-- meant deleting it. These tables let the panel be revised by re-seeding, and
-- let an admin retire or reintroduce a marker with a toggle.
--
-- Catalog data itself is NOT seeded here: migrations apply once, so the catalog
-- could never be refreshed without a new migration per revision. The data lives
-- in server/seeds/biomarker-catalog.json, loaded by the re-runnable
-- `catalog:seed` script.

create table app.biomarker_categories (
  -- Slug-style text id ('immune-regulation'). Named `id` so
  -- audit.capture_mutation() records it (it reads target_json->>'id').
  id text primary key,
  name text not null unique,
  description text not null default '',
  display_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table app.biomarkers (
  -- Matches the catalog id already stored in app.biomarker_results.biomarker_code
  -- and app.lab_orders.biomarker_codes ('apolipoprotein-b-apob').
  id text primary key,
  name text not null,
  display_name text not null,
  -- Lab-report name variants, used to match OCR'd result rows to this marker.
  aliases text[] not null default '{}',
  description text not null default '',
  what_it_measures text not null default '',
  why_it_matters text not null default '',
  unit text not null default '',

  -- How the member-facing dashboard is allowed to present a result. Replaces
  -- the old free-text `ruleType`, which conflated presentation with context
  -- and was only ever read for four substring tests.
  --   THREE_TIER    optimal / at-risk / out-of-range gauge
  --   TWO_TIER      in-range vs out-of-range only; no invented middle band
  --   QUALITATIVE   non-numeric result matched against the range labels
  --   INFORMATIONAL value and reference only, never a traffic light. Required
  --                 for screening assays and tumour markers, where a red gauge
  --                 would imply a diagnosis the test cannot support.
  scoring_mode text not null default 'THREE_TIER'
    check (scoring_mode in ('THREE_TIER', 'TWO_TIER', 'QUALITATIVE', 'INFORMATIONAL')),

  -- Patient context this marker's ranges depend on. Drives the "for a
  -- 42-year-old female" caption and which range branch is selected.
  context_requirements text[] not null default '{}'
    check (context_requirements <@ array['sex', 'age', 'cycle_phase', 'sample_timing']::text[]),

  -- Range expressions in the dashboard's branch syntax, e.g.
  -- 'M:0.9-1.3; F:0.7-1.1' or 'AM:193-690; PM:55-386' or '<0.8'.
  optimal_range_label text not null default '',
  suboptimal_range_label text not null default '',
  out_of_range_label text not null default '',

  -- Flattened bounds, used when a label cannot be parsed for the given context.
  lower_optimal numeric,
  upper_optimal numeric,
  lower_reference numeric,
  upper_reference numeric,

  directionality text not null default 'range_based'
    check (directionality in ('higher_is_better', 'lower_is_better', 'range_based', 'qualitative')),

  is_active boolean not null default true,
  deactivated_at timestamptz,
  deactivated_by text references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A two-tier marker has no defensible middle band; inventing one would
  -- present a lab's reference interval as if it were a wellness target.
  constraint biomarkers_two_tier_has_no_middle_band
    check (scoring_mode <> 'TWO_TIER' or suboptimal_range_label = '')
);
create index biomarkers_active_idx on app.biomarkers (is_active) where is_active;

-- Markers can belong to several categories (calcium is nutrient, kidney and
-- electrolyte), so membership is its own table. `is_primary` is the category
-- shown on the marker itself; display_order fixes the order within a category,
-- which the frontend previously got for free from array position.
create table app.biomarker_category_members (
  biomarker_id text not null references app.biomarkers(id) on delete cascade,
  category_id text not null references app.biomarker_categories(id) on delete cascade,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (biomarker_id, category_id)
);
create unique index biomarker_one_primary_category
  on app.biomarker_category_members (biomarker_id) where is_primary;
create index biomarker_category_members_category_idx
  on app.biomarker_category_members (category_id, display_order);

-- Deliberately no foreign key from app.biomarker_results.biomarker_code to
-- app.biomarkers(id): lab ingest commits result rows for codes we do not carry,
-- and the member dashboard renders those under "Other results". An FK would
-- reject them.

create trigger biomarkers_updated_at before update on app.biomarkers
  for each row execute function app.set_updated_at();
create trigger biomarkers_audit after insert or update or delete on app.biomarkers
  for each row execute function audit.capture_mutation();
create trigger biomarker_categories_updated_at before update on app.biomarker_categories
  for each row execute function app.set_updated_at();
create trigger biomarker_categories_audit after insert or update or delete on app.biomarker_categories
  for each row execute function audit.capture_mutation();

-- Reference data, no PHI: every signed-in actor may read it. Retired markers
-- are visible only to admins, so the "deactivated markers are hidden" rule
-- holds even if a screen forgets to filter.
alter table app.biomarker_categories enable row level security;
create policy biomarker_categories_select on app.biomarker_categories for select using (is_active or app.is_admin());
create policy biomarker_categories_admin_write on app.biomarker_categories for all using (app.is_admin()) with check (app.is_admin());
create policy biomarker_categories_worker_select on app.biomarker_categories for select to verae_worker using (true);

alter table app.biomarkers enable row level security;
create policy biomarkers_catalog_select on app.biomarkers for select using (is_active or app.is_admin());
create policy biomarkers_catalog_admin_write on app.biomarkers for all using (app.is_admin()) with check (app.is_admin());
create policy biomarkers_catalog_worker_select on app.biomarkers for select to verae_worker using (true);

-- Membership visibility follows the marker's own policy.
alter table app.biomarker_category_members enable row level security;
create policy biomarker_category_members_select on app.biomarker_category_members for select using (
  exists (select 1 from app.biomarkers b where b.id = biomarker_id)
);
create policy biomarker_category_members_admin_write on app.biomarker_category_members for all using (app.is_admin()) with check (app.is_admin());
create policy biomarker_category_members_worker_select on app.biomarker_category_members for select to verae_worker using (true);

-- The dashboard has to tell "this marker was retired" apart from "this lab sent
-- a code we don't carry": the first is hidden, the second renders under "Other
-- results". Retired rows are invisible to non-admins by design, so expose just
-- their codes (no PHI, no clinical detail) through a security-definer function.
create or replace function app.retired_biomarker_codes() returns text[]
language sql stable security definer set search_path = app, pg_temp as $$
  select coalesce(array_agg(id order by id), '{}') from app.biomarkers where not is_active
$$;

-- New tables and functions: verae_app's schema-wide grant in 0001 only covers
-- objects that existed then, so grant explicitly.
grant execute on function app.retired_biomarker_codes() to verae_app, verae_worker;
grant select, insert, update, delete
  on app.biomarkers, app.biomarker_categories, app.biomarker_category_members to verae_app;
grant select
  on app.biomarkers, app.biomarker_categories, app.biomarker_category_members to verae_worker;
