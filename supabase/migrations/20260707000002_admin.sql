-- Migration 009 — admin operations console.
--
-- Until now admins had NO in-app path: every policy is member-own or
-- is_doctor_of, and admins worked through the Supabase dashboard (service role,
-- bypasses RLS). This migration adds a deliberate, ADDITIVE admin authorization
-- layer so the internal admin panel can run the member workflow from signup to
-- care-plan release without touching Supabase directly.
--
-- Design:
--   * private.is_admin() — security-definer role check (mirrors is_doctor_of).
--   * Admin SELECT policies on every member table (drafts included — unlike
--     members/doctors who only ever see released rows).
--   * Admin WRITE on results + documents via additive policies + column grants;
--     members/doctors have no write policy on these tables, so they stay locked.
--   * Sensitive/atomic transitions (release results, assign doctor, promote,
--     stage correction, doctor activation) go through security-definer RPCs,
--     each guarded by is_admin() — defense in depth even if a name leaks.
--   * profiles.role stays frozen for clients; role/is_active change only via RPC.
-- Nothing existing is weakened: all policies below are OR-branches.

-- ---------------------------------------------------------------------------
-- profiles.is_active — lets admins deactivate a doctor (hidden from the assign
-- picker) without deleting them. Written only via admin_set_doctor_active.
-- ---------------------------------------------------------------------------
alter table public.profiles add column is_active boolean not null default true;

-- ---------------------------------------------------------------------------
-- Authorization helper. SECURITY DEFINER so it bypasses RLS on profiles and
-- can't recurse when referenced from a profiles policy (same pattern as
-- private.is_doctor_of).
-- ---------------------------------------------------------------------------
create or replace function private.is_admin()
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function private.is_admin() to authenticated;

-- ---------------------------------------------------------------------------
-- Admin SELECT policies (additive). Admins see ALL members and ALL rows,
-- including drafts — no status filter, unlike the member/doctor policies.
-- Base SELECT grants already exist on every table below (earlier migrations);
-- lab_reports keeps its column-scoped grant so admin_notes stays service-only.
-- ---------------------------------------------------------------------------
create policy "profiles_select_admin"
  on public.profiles for select to authenticated
  using (private.is_admin());

create policy "member_profiles_select_admin"
  on public.member_profiles for select to authenticated
  using (private.is_admin());

create policy "onboarding_responses_select_admin"
  on public.onboarding_responses for select to authenticated
  using (private.is_admin());

create policy "health_documents_select_admin"
  on public.health_documents for select to authenticated
  using (private.is_admin());

create policy "lab_reports_select_admin"
  on public.lab_reports for select to authenticated
  using (private.is_admin());

create policy "biomarker_results_select_admin"
  on public.biomarker_results for select to authenticated
  using (private.is_admin());

create policy "care_plans_select_admin"
  on public.care_plans for select to authenticated
  using (private.is_admin());

create policy "care_plan_sections_select_admin"
  on public.care_plan_sections for select to authenticated
  using (private.is_admin());

create policy "doctor_assignments_select_admin"
  on public.doctor_assignments for select to authenticated
  using (private.is_admin());

create policy "workflow_events_select_admin"
  on public.workflow_events for select to authenticated
  using (private.is_admin());

-- ---------------------------------------------------------------------------
-- Admin WRITE: lab reports + biomarker results (the core admin job).
-- Members/doctors have no INSERT/UPDATE/DELETE policy on these tables, so the
-- table-wide grants below are gated entirely by these admin policies. Column-
-- scoped grants on lab_reports keep admin_notes out of client reach (it stays
-- a dashboard/service-role-only field in v1).
-- Releasing is done via admin_release_lab_report (atomic) — not by flipping
-- status here — but the update policy still permits corrections.
-- ---------------------------------------------------------------------------
create policy "lab_reports_admin_write"
  on public.lab_reports for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant insert (member_id, document_id, lab_name, panel_name, collected_at,
              status, released_at, created_by),
      update (member_id, document_id, lab_name, panel_name, collected_at,
              status, released_at),
      delete
  on public.lab_reports to authenticated;

create policy "biomarker_results_admin_write"
  on public.biomarker_results for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

grant insert, update, delete on public.biomarker_results to authenticated;

-- ---------------------------------------------------------------------------
-- Admin WRITE: documents on behalf of a member. member_id is the target
-- member; uploaded_by is the admin (so the "uploader" column is truthful).
-- Existing grants (select/insert/delete) already cover these.
-- ---------------------------------------------------------------------------
create policy "health_documents_insert_admin"
  on public.health_documents for insert to authenticated
  with check (private.is_admin() and uploaded_by = auth.uid());

create policy "health_documents_delete_admin"
  on public.health_documents for delete to authenticated
  using (private.is_admin());

-- health_documents wasn't audited; admin now writes on members' behalf, so
-- capture it like the other sensitive tables.
create trigger audit_health_documents
  after insert or update or delete on public.health_documents
  for each row execute function private.write_audit();

-- ---------------------------------------------------------------------------
-- Storage: admins read any member's documents (gates signed URLs) and upload
-- into any member's folder. Scoped to the health-documents bucket.
-- (If this fails with "must be owner of table objects", create these three
-- policies in Dashboard → Storage → Policies instead.)
-- ---------------------------------------------------------------------------
create policy "health_documents_storage_select_admin"
  on storage.objects for select to authenticated
  using (bucket_id = 'health-documents' and private.is_admin());

create policy "health_documents_storage_insert_admin"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'health-documents' and private.is_admin());

create policy "health_documents_storage_delete_admin"
  on storage.objects for delete to authenticated
  using (bucket_id = 'health-documents' and private.is_admin());

-- ===========================================================================
-- Admin RPCs. All: SECURITY DEFINER + set search_path='' + is_admin() guard on
-- the first line, revoked from public/anon, granted to authenticated.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- admin_case_overview() — one fully-derived row per member for the Cases List.
-- Computes documents_count, results/care-plan status, the assigned doctor, and
-- the next-action state machine centrally so the list is a single round trip
-- and every surface agrees on "what's next".
-- ---------------------------------------------------------------------------
create or replace function public.admin_case_overview()
returns table (
  member_id         uuid,
  full_name         text,
  email             text,
  age               int,
  sex               text,
  current_stage     text,
  onboarding_status text,
  doctor_id         uuid,
  doctor_name       text,
  documents_count   bigint,
  results_status    text,
  care_plan_status  text,
  next_action       text,
  next_owner        text,
  updated_at        timestamptz
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  return query
  with base as (
    select
      p.id           as member_id,
      p.full_name,
      p.email,
      mp.age,
      mp.sex,
      mp.current_stage,
      mp.onboarding_status,
      mp.updated_at,
      (select da.doctor_id
         from public.doctor_assignments da
        where da.member_id = p.id and da.status = 'active'
        order by da.assigned_at desc
        limit 1) as doctor_id,
      (select count(*)
         from public.health_documents hd
        where hd.member_id = p.id) as documents_count,
      (select case
                when bool_or(lr.status = 'released') then 'released'
                when count(*) > 0 then 'draft'
                else 'none'
              end
         from public.lab_reports lr
        where lr.member_id = p.id) as results_status,
      (select case
                when bool_or(cp.status = 'released') then 'released'
                when count(*) > 0 then 'draft'
                else 'none'
              end
         from public.care_plans cp
        where cp.member_id = p.id) as care_plan_status
    from public.profiles p
    join public.member_profiles mp on mp.member_id = p.id
    where p.role = 'member'
  )
  select
    b.member_id,
    b.full_name,
    b.email,
    b.age,
    b.sex,
    b.current_stage,
    b.onboarding_status,
    b.doctor_id,
    dp.full_name as doctor_name,
    b.documents_count,
    b.results_status,
    b.care_plan_status,
    case
      when b.doctor_id is null then 'Assign doctor'
      when b.onboarding_status is distinct from 'completed' then 'Wait for onboarding'
      when b.results_status <> 'released' then
        case b.current_stage
          when 'consult_upcoming' then 'Awaiting consult'
          when 'blood_form_ready' then 'Awaiting blood draw'
          else 'Enter lab results'
        end
      when b.care_plan_status = 'none' then 'Doctor to draft care plan'
      when b.care_plan_status = 'draft' then 'Doctor to release care plan'
      else 'Completed'
    end as next_action,
    case
      when b.doctor_id is null then 'admin'
      when b.onboarding_status is distinct from 'completed' then 'member'
      when b.results_status <> 'released' then 'admin'
      when b.care_plan_status in ('none', 'draft') then 'doctor'
      else 'done'
    end as next_owner,
    b.updated_at
  from base b
  left join public.profiles dp on dp.id = b.doctor_id
  order by b.updated_at desc;
end;
$$;

revoke execute on function public.admin_case_overview() from public, anon;
grant execute on function public.admin_case_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- admin_doctor_overview() — doctors + their active case load.
-- ---------------------------------------------------------------------------
create or replace function public.admin_doctor_overview()
returns table (
  doctor_id      uuid,
  full_name      text,
  email          text,
  is_active      boolean,
  assigned_count bigint
)
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.is_active,
    (select count(*)
       from public.doctor_assignments da
      where da.doctor_id = p.id and da.status = 'active')
  from public.profiles p
  where p.role = 'doctor'
  order by p.full_name nulls last;
end;
$$;

revoke execute on function public.admin_doctor_overview() from public, anon;
grant execute on function public.admin_doctor_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- admin_release_lab_report(report_id) — the only admin release path. Flips the
-- report to released, advances the member's stage (guarding against downgrade),
-- and logs a workflow event. Mirrors release_care_plan.
-- ---------------------------------------------------------------------------
create or replace function public.admin_release_lab_report(report_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid;
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  select member_id into v_member from public.lab_reports where id = report_id;
  if v_member is null then
    raise exception 'lab report not found';
  end if;

  update public.lab_reports
     set status = 'released', released_at = coalesce(released_at, now())
   where id = report_id;

  update public.member_profiles
     set current_stage = 'results_ready'
   where member_id = v_member
     and current_stage in ('consult_upcoming', 'blood_form_ready', 'results_pending');

  insert into public.workflow_events (member_id, event_type, payload, actor_id)
  values (v_member, 'results_released',
          jsonb_build_object('lab_report_id', report_id), auth.uid());
end;
$$;

revoke execute on function public.admin_release_lab_report(uuid) from public, anon;
grant execute on function public.admin_release_lab_report(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_assign_doctor(member_id, doctor_id) — enforce one active primary:
-- deactivate any other active assignment, then activate/insert this one.
-- ---------------------------------------------------------------------------
create or replace function public.admin_assign_doctor(p_member_id uuid, p_doctor_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_doctor_id and role = 'doctor' and is_active
  ) then
    raise exception 'target is not an active doctor';
  end if;

  update public.doctor_assignments
     set status = 'inactive'
   where member_id = p_member_id
     and status = 'active'
     and doctor_id <> p_doctor_id;

  insert into public.doctor_assignments (doctor_id, member_id, status, assigned_at)
  values (p_doctor_id, p_member_id, 'active', now())
  on conflict (doctor_id, member_id)
    do update set status = 'active', assigned_at = now();

  insert into public.workflow_events (member_id, event_type, payload, actor_id)
  values (p_member_id, 'doctor_assigned',
          jsonb_build_object('doctor_id', p_doctor_id), auth.uid());
end;
$$;

revoke execute on function public.admin_assign_doctor(uuid, uuid) from public, anon;
grant execute on function public.admin_assign_doctor(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_deactivate_assignment(member_id) — clear the active assignment.
-- ---------------------------------------------------------------------------
create or replace function public.admin_deactivate_assignment(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  update public.doctor_assignments
     set status = 'inactive'
   where member_id = p_member_id and status = 'active';

  insert into public.workflow_events (member_id, event_type, actor_id)
  values (p_member_id, 'doctor_unassigned', auth.uid());
end;
$$;

revoke execute on function public.admin_deactivate_assignment(uuid) from public, anon;
grant execute on function public.admin_deactivate_assignment(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_role(user_id, role) — promote/demote between member and doctor.
-- Capped to member|doctor: admins can NOT create admins from the app (that
-- stays dashboard/service-role only), so there is no client self-elevation
-- path. Runs as owner, so it bypasses the freeze_role trigger legitimately.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;
  if p_role not in ('member', 'doctor') then
    raise exception 'role must be member or doctor';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'cannot change your own role';
  end if;

  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

revoke execute on function public.admin_set_role(uuid, text) from public, anon;
grant execute on function public.admin_set_role(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_doctor_active(user_id, active) — activate/deactivate a doctor.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_doctor_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;

  update public.profiles
     set is_active = p_active
   where id = p_user_id and role = 'doctor';
end;
$$;

revoke execute on function public.admin_set_doctor_active(uuid, boolean) from public, anon;
grant execute on function public.admin_set_doctor_active(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- admin_set_stage(member_id, stage) — controlled stage correction. Constrains
-- to the member_profiles.current_stage enum and logs the change.
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_stage(p_member_id uuid, p_stage text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin only';
  end if;
  if p_stage not in ('profile_incomplete', 'consult_upcoming', 'blood_form_ready',
                     'results_pending', 'results_ready', 'care_plan_ready') then
    raise exception 'invalid stage';
  end if;

  update public.member_profiles
     set current_stage = p_stage
   where member_id = p_member_id;

  insert into public.workflow_events (member_id, event_type, payload, actor_id)
  values (p_member_id, 'stage_corrected',
          jsonb_build_object('stage', p_stage), auth.uid());
end;
$$;

revoke execute on function public.admin_set_stage(uuid, text) from public, anon;
grant execute on function public.admin_set_stage(uuid, text) to authenticated;
