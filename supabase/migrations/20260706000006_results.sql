-- Migration 006 — results: lab_reports (release unit) + biomarker_results
-- (line items). Admin writes happen via the dashboard/service role only; no
-- client role has any write policy or grant here. Members (and later doctors)
-- see released reports only — the release filter lives inside the policies.

create table public.lab_reports (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.profiles (id) on delete cascade,
  document_id  uuid references public.health_documents (id) on delete set null,
  lab_name     text,
  panel_name   text,
  collected_at date,
  status       text not null default 'draft' check (status in ('draft', 'released')),
  released_at  timestamptz,
  admin_notes  text, -- internal; excluded from the member-facing column grant below
  created_by   uuid references public.profiles (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index lab_reports_member_id_idx on public.lab_reports (member_id);

create trigger set_updated_at
  before update on public.lab_reports
  for each row execute function private.set_updated_at();

alter table public.lab_reports enable row level security;

create policy "lab_reports_select_own_released"
  on public.lab_reports for select
  to authenticated
  using (member_id = auth.uid() and status = 'released');

-- Column-level grant keeps admin_notes invisible even on released rows.
grant select (id, member_id, document_id, lab_name, panel_name, collected_at,
              status, released_at, created_at, updated_at)
  on public.lab_reports to authenticated;

-- ---------------------------------------------------------------------------

create table public.biomarker_results (
  id             uuid primary key default gen_random_uuid(),
  lab_report_id  uuid not null references public.lab_reports (id) on delete cascade,
  member_id      uuid not null references public.profiles (id) on delete cascade,
  biomarker_code text not null, -- must match a catalog id in biomarkerData.ts
  biomarker_name text,          -- display fallback for codes not in the catalog
  category       text,
  value_numeric  numeric,
  value_text     text,
  unit           text,
  ref_low        numeric,
  ref_high       numeric,
  optimal_low    numeric,
  optimal_high   numeric,
  status         text not null check (status in ('optimal', 'at_risk', 'needs_attention')),
  notes          text,
  created_by     uuid references public.profiles (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (value_numeric is not null or value_text is not null)
);

create index biomarker_results_member_id_idx on public.biomarker_results (member_id);
create index biomarker_results_lab_report_id_idx on public.biomarker_results (lab_report_id);

create trigger set_updated_at
  before update on public.biomarker_results
  for each row execute function private.set_updated_at();

-- member_id is denormalized so the RLS check on this (hottest) table is a
-- plain column compare; keep it consistent with the parent report.
create or replace function private.enforce_biomarker_member()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.member_id is distinct from
     (select member_id from public.lab_reports where id = new.lab_report_id) then
    raise exception 'biomarker_results.member_id must match the parent lab_report';
  end if;
  return new;
end;
$$;

create trigger enforce_member
  before insert or update on public.biomarker_results
  for each row execute function private.enforce_biomarker_member();

alter table public.biomarker_results enable row level security;

create policy "biomarker_results_select_own_released"
  on public.biomarker_results for select
  to authenticated
  using (
    member_id = auth.uid()
    and exists (
      select 1 from public.lab_reports r
      where r.id = lab_report_id and r.status = 'released'
    )
  );

grant select on public.biomarker_results to authenticated;
