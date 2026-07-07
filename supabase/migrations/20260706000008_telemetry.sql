-- Migration 008 — telemetry: append-only workflow_events + audit_logs.
-- Neither is client-writable; workflow_events is client-readable (own/assigned),
-- audit_logs is dashboard-only.

-- ---------------------------------------------------------------------------
-- workflow_events: journey log. Written by definer functions + service role.
-- ---------------------------------------------------------------------------
create table public.workflow_events (
  id         uuid primary key default gen_random_uuid(),
  member_id  uuid not null references public.profiles (id) on delete cascade,
  event_type text not null,
  payload    jsonb not null default '{}',
  actor_id   uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index workflow_events_member_id_idx on public.workflow_events (member_id);

alter table public.workflow_events enable row level security;

-- Read-only for clients; no insert/update/delete policies (definer fns + the
-- service role bypass RLS to write).
create policy "workflow_events_select_own"
  on public.workflow_events for select
  to authenticated
  using (member_id = auth.uid());

create policy "workflow_events_select_doctor"
  on public.workflow_events for select
  to authenticated
  using (private.is_doctor_of(member_id));

grant select on public.workflow_events to authenticated;

-- ---------------------------------------------------------------------------
-- audit_logs: forensic trail. No client access at all.
-- ---------------------------------------------------------------------------
create table public.audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid,               -- auth.uid(); null for dashboard/service-role
  action     text not null,      -- INSERT | UPDATE | DELETE
  table_name text not null,
  record_id  uuid,
  member_id  uuid,               -- whose data was touched, when derivable
  old_row    jsonb,
  new_row    jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_member_id_idx on public.audit_logs (member_id);
create index audit_logs_table_record_idx on public.audit_logs (table_name, record_id);

alter table public.audit_logs enable row level security;
-- No policies, no grants: only owner/service role (dashboard) can read/write.

-- ---------------------------------------------------------------------------
-- Generic audit trigger. Full OLD/NEW rows (no computed diffs); member_id is
-- read from whichever row is present.
-- ---------------------------------------------------------------------------
create or replace function private.write_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old   jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) else null end;
  v_new   jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) else null end;
  v_row   jsonb := coalesce(v_new, v_old);
begin
  insert into public.audit_logs
    (actor_id, action, table_name, record_id, member_id, old_row, new_row)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    (v_row ->> 'id')::uuid,
    (v_row ->> 'member_id')::uuid,
    v_old,
    v_new
  );
  return null; -- AFTER trigger; return value ignored
end;
$$;

create trigger audit_lab_reports
  after insert or update or delete on public.lab_reports
  for each row execute function private.write_audit();

create trigger audit_biomarker_results
  after insert or update or delete on public.biomarker_results
  for each row execute function private.write_audit();

create trigger audit_care_plans
  after insert or update or delete on public.care_plans
  for each row execute function private.write_audit();

create trigger audit_care_plan_sections
  after insert or update or delete on public.care_plan_sections
  for each row execute function private.write_audit();

create trigger audit_doctor_assignments
  after insert or update or delete on public.doctor_assignments
  for each row execute function private.write_audit();

create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function private.write_audit();

-- ---------------------------------------------------------------------------
-- Fold workflow logging into the definer functions.
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

  insert into public.workflow_events (member_id, event_type, payload, actor_id)
  values (v_member, 'care_plan_released', jsonb_build_object('care_plan_id', plan_id), auth.uid());
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name'
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.member_profiles (member_id)
  values (new.id)
  on conflict (member_id) do nothing;

  insert into public.workflow_events (member_id, event_type, actor_id)
  values (new.id, 'signed_up', new.id);

  return new;
end;
$$;
