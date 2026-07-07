-- RLS guarantee checks. Run in the Supabase SQL editor (service-role context)
-- or via `psql "$DATABASE_URL" -f supabase/tests/rls_checks.sql`.
--
-- Each block impersonates a user by setting the `authenticated` role plus a
-- JWT claims GUC (which auth.uid() reads), runs a query, and asserts the
-- result. Any failed assertion raises an exception and aborts.
--
-- Requires two real member ids, one doctor id assigned to member A, and one
-- admin id. Fill in the four ids below (get them from:
-- select id, email, role from profiles).

\set MEMBER_A  '00000000-0000-0000-0000-000000000000'
\set MEMBER_B  '00000000-0000-0000-0000-000000000000'
\set DOCTOR    '00000000-0000-0000-0000-000000000000'
\set ADMIN     '00000000-0000-0000-0000-000000000000'

-- Helper to become a given auth user for the following statements.
create or replace function pg_temp.become(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end;
$$;

do $$
declare
  member_a uuid := :'MEMBER_A';
  member_b uuid := :'MEMBER_B';
  n int;
begin
  -- 1) Member A cannot change their own role.
  perform pg_temp.become(member_a);
  begin
    update public.profiles set role = 'admin' where id = member_a;
    raise exception 'FAIL: member was able to change role';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  -- 2) Member A cannot see Member B's rows (cross-member isolation).
  perform pg_temp.become(member_a);
  select count(*) into n from public.member_profiles where member_id = member_b;
  if n <> 0 then raise exception 'FAIL: member A saw member B member_profile'; end if;

  select count(*) into n from public.onboarding_responses where member_id = member_b;
  if n <> 0 then raise exception 'FAIL: member A saw member B onboarding'; end if;

  -- 3) Member A cannot write results or care plans.
  perform pg_temp.become(member_a);
  begin
    insert into public.lab_reports (member_id) values (member_a);
    raise exception 'FAIL: member inserted a lab_report';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  raise notice 'role/isolation/write checks passed';
  reset role;
end $$;

-- 4) Member sees only RELEASED reports (draft invisible).
--    Seed a draft + released report for member A, then check visibility.
do $$
declare
  member_a uuid := :'MEMBER_A';
  draft_id uuid;
  rel_id uuid;
  n int;
begin
  insert into public.lab_reports (member_id, status) values (member_a, 'draft') returning id into draft_id;
  insert into public.lab_reports (member_id, status, released_at) values (member_a, 'released', now()) returning id into rel_id;

  perform pg_temp.become(member_a);
  select count(*) into n from public.lab_reports where id = draft_id;
  if n <> 0 then raise exception 'FAIL: member saw a DRAFT report'; end if;
  select count(*) into n from public.lab_reports where id = rel_id;
  if n <> 1 then raise exception 'FAIL: member could not see a RELEASED report'; end if;
  reset role;

  -- cleanup
  delete from public.lab_reports where id in (draft_id, rel_id);
  raise notice 'draft-invisible / released-visible checks passed';
end $$;

-- 5) Doctor sees assigned member, not unassigned; member sees their doctor.
do $$
declare
  member_a uuid := :'MEMBER_A';
  member_b uuid := :'MEMBER_B';
  doctor uuid := :'DOCTOR';
  n int;
begin
  perform pg_temp.become(doctor);
  select count(*) into n from public.member_profiles where member_id = member_a;
  if n <> 1 then raise exception 'FAIL: doctor could not see ASSIGNED member A'; end if;
  select count(*) into n from public.member_profiles where member_id = member_b;
  if n <> 0 then raise exception 'FAIL: doctor saw UNASSIGNED member B'; end if;

  -- member A can read their doctor's profile row (name for care-plan attribution)
  perform pg_temp.become(member_a);
  select count(*) into n from public.profiles where id = doctor;
  if n <> 1 then raise exception 'FAIL: member could not read their assigned doctor profile'; end if;
  reset role;

  raise notice 'doctor-visibility / member-reads-doctor checks passed';
end $$;

-- 6) audit_logs is invisible to clients.
do $$
declare
  member_a uuid := :'MEMBER_A';
begin
  perform pg_temp.become(member_a);
  begin
    perform 1 from public.audit_logs limit 1;
    raise exception 'FAIL: member could read audit_logs';
  exception when insufficient_privilege then
    null; -- expected
  when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  reset role;
  raise notice 'audit-logs-private check passed';
end $$;

-- 7) Admin visibility + admin-only RPC guards.
--    Seed a DRAFT report for member A: admins must see it (members can't, per
--    check 4). Non-admins calling admin RPCs must be rejected.
do $$
declare
  member_a uuid := :'MEMBER_A';
  member_b uuid := :'MEMBER_B';
  admin    uuid := :'ADMIN';
  draft_id uuid;
  n int;
begin
  insert into public.lab_reports (member_id, status) values (member_a, 'draft')
    returning id into draft_id;

  -- Admin sees any member's data, including drafts.
  perform pg_temp.become(admin);
  select count(*) into n from public.member_profiles where member_id = member_b;
  if n <> 1 then raise exception 'FAIL: admin could not see member B profile'; end if;
  select count(*) into n from public.lab_reports where id = draft_id;
  if n <> 1 then raise exception 'FAIL: admin could not see a DRAFT report'; end if;

  -- Admin overview RPC returns rows for the admin.
  select count(*) into n from public.admin_case_overview();
  if n < 1 then raise exception 'FAIL: admin_case_overview returned nothing for admin'; end if;
  reset role;

  -- A member cannot call the admin overview RPC.
  perform pg_temp.become(member_a);
  begin
    perform 1 from public.admin_case_overview();
    raise exception 'FAIL: member called admin_case_overview';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;

  -- A member cannot promote anyone.
  begin
    perform public.admin_set_role(member_b, 'doctor');
    raise exception 'FAIL: member called admin_set_role';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  reset role;

  -- Admin cannot promote to admin (capped to member|doctor).
  perform pg_temp.become(admin);
  begin
    perform public.admin_set_role(member_b, 'admin');
    raise exception 'FAIL: admin_set_role accepted the admin role';
  exception when others then
    if sqlerrm like 'FAIL:%' then raise; end if;
  end;
  reset role;

  -- cleanup
  delete from public.lab_reports where id = draft_id;
  raise notice 'admin-visibility / admin-rpc-guard checks passed';
end $$;

select 'ALL RLS CHECKS PASSED' as result;
