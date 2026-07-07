-- Migration 007 — doctors & care plans. Assignments are admin-managed (no
-- client writes). Doctors get read access to assigned members' data and
-- author care plans; members see released plans and their doctor's identity.

-- ---------------------------------------------------------------------------
-- doctor_assignments (admin-managed via dashboard)
-- ---------------------------------------------------------------------------
create table public.doctor_assignments (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references public.profiles (id) on delete cascade,
  member_id   uuid not null references public.profiles (id) on delete cascade,
  status      text not null default 'active' check (status in ('active', 'inactive')),
  assigned_at timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (doctor_id, member_id)
);

create index doctor_assignments_member_id_idx on public.doctor_assignments (member_id);
create index doctor_assignments_doctor_id_idx on public.doctor_assignments (doctor_id);

create trigger set_updated_at
  before update on public.doctor_assignments
  for each row execute function private.set_updated_at();

alter table public.doctor_assignments enable row level security;

-- Doctor sees their own assignments; member sees theirs (to show "your doctor").
create policy "doctor_assignments_select_doctor"
  on public.doctor_assignments for select
  to authenticated
  using (doctor_id = auth.uid());

create policy "doctor_assignments_select_member"
  on public.doctor_assignments for select
  to authenticated
  using (member_id = auth.uid());

grant select on public.doctor_assignments to authenticated;

-- ---------------------------------------------------------------------------
-- Authorization helpers (security definer; bypass RLS to avoid recursion)
-- ---------------------------------------------------------------------------
create or replace function private.is_doctor_of(member uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.doctor_assignments
    where doctor_id = auth.uid() and member_id = member and status = 'active'
  );
$$;

create or replace function private.is_my_doctor(profile uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.doctor_assignments
    where member_id = auth.uid() and doctor_id = profile and status = 'active'
  );
$$;

grant execute on function private.is_doctor_of(uuid) to authenticated;
grant execute on function private.is_my_doctor(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Extend visibility on existing member tables to assigned doctors.
-- Policies are additive (OR), so these grant doctors read access alongside
-- the members' own-row policies.
-- ---------------------------------------------------------------------------

-- profiles: doctor sees assigned members; member sees their doctor.
create policy "profiles_select_assigned_member"
  on public.profiles for select
  to authenticated
  using (private.is_doctor_of(id));

create policy "profiles_select_my_doctor"
  on public.profiles for select
  to authenticated
  using (private.is_my_doctor(id));

create policy "member_profiles_select_doctor"
  on public.member_profiles for select
  to authenticated
  using (private.is_doctor_of(member_id));

create policy "onboarding_responses_select_doctor"
  on public.onboarding_responses for select
  to authenticated
  using (private.is_doctor_of(member_id));

create policy "health_documents_select_doctor"
  on public.health_documents for select
  to authenticated
  using (private.is_doctor_of(member_id));

create policy "lab_reports_select_doctor"
  on public.lab_reports for select
  to authenticated
  using (private.is_doctor_of(member_id) and status = 'released');

create policy "biomarker_results_select_doctor"
  on public.biomarker_results for select
  to authenticated
  using (
    private.is_doctor_of(member_id)
    and exists (
      select 1 from public.lab_reports r
      where r.id = lab_report_id and r.status = 'released'
    )
  );

-- Storage: assigned doctors can read a member's documents (gates signed URLs).
create policy "health_documents_storage_select_doctor"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'health-documents'
    and private.is_doctor_of(((storage.foldername(name))[1])::uuid)
  );

-- ---------------------------------------------------------------------------
-- care_plans + care_plan_sections
-- ---------------------------------------------------------------------------
create table public.care_plans (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references public.profiles (id) on delete cascade,
  doctor_id   uuid not null references public.profiles (id),
  title       text,
  summary     text,
  status      text not null default 'draft' check (status in ('draft', 'released', 'archived')),
  released_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index care_plans_member_id_idx on public.care_plans (member_id);

create trigger set_updated_at
  before update on public.care_plans
  for each row execute function private.set_updated_at();

alter table public.care_plans enable row level security;

-- Member: own released plans only. Doctor: assigned members' plans (any status).
create policy "care_plans_select_member"
  on public.care_plans for select
  to authenticated
  using (member_id = auth.uid() and status = 'released');

create policy "care_plans_select_doctor"
  on public.care_plans for select
  to authenticated
  using (private.is_doctor_of(member_id));

create policy "care_plans_insert_doctor"
  on public.care_plans for insert
  to authenticated
  with check (private.is_doctor_of(member_id) and doctor_id = auth.uid());

create policy "care_plans_update_doctor"
  on public.care_plans for update
  to authenticated
  using (private.is_doctor_of(member_id))
  with check (private.is_doctor_of(member_id));

grant select, insert, update on public.care_plans to authenticated;

-- ---------------------------------------------------------------------------
create table public.care_plan_sections (
  id           uuid primary key default gen_random_uuid(),
  care_plan_id uuid not null references public.care_plans (id) on delete cascade,
  sort_order   int not null default 0,
  title        text,
  summary      text,
  markers      text[] not null default '{}',
  doctor_note  text,
  actions      jsonb not null default '[]',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index care_plan_sections_care_plan_id_idx on public.care_plan_sections (care_plan_id);

create trigger set_updated_at
  before update on public.care_plan_sections
  for each row execute function private.set_updated_at();

alter table public.care_plan_sections enable row level security;

-- Access flows through the parent plan.
create policy "care_plan_sections_select"
  on public.care_plan_sections for select
  to authenticated
  using (
    exists (
      select 1 from public.care_plans p
      where p.id = care_plan_id
        and (
          (p.member_id = auth.uid() and p.status = 'released')
          or private.is_doctor_of(p.member_id)
        )
    )
  );

create policy "care_plan_sections_write_doctor"
  on public.care_plan_sections for all
  to authenticated
  using (
    exists (
      select 1 from public.care_plans p
      where p.id = care_plan_id and private.is_doctor_of(p.member_id)
    )
  )
  with check (
    exists (
      select 1 from public.care_plans p
      where p.id = care_plan_id and private.is_doctor_of(p.member_id)
    )
  );

grant select, insert, update, delete on public.care_plan_sections to authenticated;

-- ---------------------------------------------------------------------------
-- Release RPC: the only way to release a plan. Verifies the caller is the
-- plan's assigned doctor, then flips status + advances the member's stage
-- atomically. (workflow_events insert joins here in Phase 6.)
-- ---------------------------------------------------------------------------
create or replace function public.release_care_plan(plan_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid;
begin
  select member_id into v_member
  from public.care_plans
  where id = plan_id
    and doctor_id = auth.uid()
    and private.is_doctor_of(member_id);

  if v_member is null then
    raise exception 'not authorized to release this care plan';
  end if;

  update public.care_plans
     set status = 'released', released_at = now()
   where id = plan_id;

  update public.member_profiles
     set current_stage = 'care_plan_ready'
   where member_id = v_member;
end;
$$;

revoke execute on function public.release_care_plan(uuid) from public, anon;
grant execute on function public.release_care_plan(uuid) to authenticated;
