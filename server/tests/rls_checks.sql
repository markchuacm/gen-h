\set ON_ERROR_STOP on

begin;

insert into identity."user" (id,name,email,"emailVerified","createdAt","updatedAt") values
  ('rls-member-a','RLS A','rls-a@example.test',true,now(),now()),
  ('rls-member-b','RLS B','rls-b@example.test',true,now(),now()),
  ('rls-doctor','RLS Doctor','rls-doctor@example.test',true,now(),now());
insert into app.profiles (id,email,full_name,role,account_status) values
  ('rls-member-a','rls-a@example.test','RLS A','member','active'),
  ('rls-member-b','rls-b@example.test','RLS B','member','active'),
  ('rls-doctor','rls-doctor@example.test','RLS Doctor','doctor','active');
insert into app.member_profiles (member_id,onboarding_status) values
  ('rls-member-a','completed'), ('rls-member-b','completed');
insert into app.doctor_assignments (member_id,doctor_id,assigned_by)
values ('rls-member-a','rls-doctor','rls-doctor');
insert into app.health_documents (id,member_id,object_key,file_name,mime_type,size_bytes,uploaded_by)
values ('00000000-0000-4000-8000-000000000010','rls-member-a','documents/rls-worker-test','rls-worker-test.pdf','application/pdf',100,'rls-member-a');
insert into app.lab_reports (id,member_id,external_report_id,status,source_status,source_version) values
  ('00000000-0000-4000-8000-000000000001','rls-member-a','released-a','released','final',1),
  ('00000000-0000-4000-8000-000000000002','rls-member-a','draft-a','draft','final',1),
  ('00000000-0000-4000-8000-000000000003','rls-member-b','released-b','released','final',1);
insert into app.biomarker_results
  (id,lab_report_id,member_id,source_code,biomarker_code,source_value,value_numeric,status)
values
  ('00000000-0000-4000-8000-000000000020','00000000-0000-4000-8000-000000000002',
   'rls-member-a','RLS','RLS','1',1,'optimal');
update app.lab_reports set status='released',released_at=now()
where id='00000000-0000-4000-8000-000000000002';
insert into app.care_plans (id,member_id,doctor_id,title,status,version)
values ('00000000-0000-4000-8000-000000000030','rls-member-a','rls-doctor','RLS plan','draft',1);
insert into app.care_plan_sections (id,care_plan_id,sort_order,title)
values ('00000000-0000-4000-8000-000000000031','00000000-0000-4000-8000-000000000030',0,'RLS section');
update app.care_plans set status='released',released_at=now()
where id='00000000-0000-4000-8000-000000000030';

set local role verae_app;
select set_config('app.user_id','rls-member-a',true);
select set_config('app.user_role','member',true);
select set_config('app.request_id','rls-test-member',true);

do $$
begin
  if (select count(*) from app.profiles) <> 1 then
    raise exception 'member profile isolation failed';
  end if;
  if (select count(*) from app.member_profiles) <> 1 then
    raise exception 'member record isolation failed';
  end if;
  if (select count(*) from app.lab_reports) <> 2 then
    raise exception 'member draft/report isolation failed';
  end if;
end $$;

reset role;
set local role verae_app;
select set_config('app.user_id','rls-doctor',true);
select set_config('app.user_role','doctor',true);
select set_config('app.request_id','rls-test-doctor',true);

do $$
begin
  if (select count(*) from app.member_profiles) <> 1 then
    raise exception 'doctor assignment isolation failed';
  end if;
  if (select count(*) from app.lab_reports) <> 2 then
    raise exception 'doctor released-report isolation failed';
  end if;
  begin
    update app.care_plans set title='must fail'
    where id='00000000-0000-4000-8000-000000000030';
    raise exception 'released care plan mutation unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'RELEASED_IMMUTABLE' then raise; end if;
  end;
  begin
    update app.care_plan_sections set title='must fail'
    where id='00000000-0000-4000-8000-000000000031';
    raise exception 'released care plan section mutation unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'RELEASED_IMMUTABLE' then raise; end if;
  end;
end $$;

reset role;

insert into identity."user" (id,name,email,"emailVerified","createdAt","updatedAt")
values ('rls-auth-member','RLS Auth Member','rls-auth@example.test',true,now(),now());
set local role verae_auth;
insert into app.profiles (id,email,full_name,role,account_status)
values ('rls-auth-member','rls-auth@example.test','RLS Auth Member','member','pending');
insert into app.member_profiles (member_id) values ('rls-auth-member');
reset role;

set local role verae_worker;
do $$
begin
  if (select count(*) from app.health_documents where id='00000000-0000-4000-8000-000000000010') <> 1 then
    raise exception 'worker document read isolation failed';
  end if;
  begin
    update app.lab_reports set panel_name='must fail'
    where id='00000000-0000-4000-8000-000000000002';
    raise exception 'released report mutation unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'RELEASED_IMMUTABLE' then raise; end if;
  end;
  begin
    update app.biomarker_results set value_numeric=2
    where id='00000000-0000-4000-8000-000000000020';
    raise exception 'released biomarker mutation unexpectedly succeeded';
  exception when sqlstate 'P0001' then
    if sqlerrm <> 'RELEASED_IMMUTABLE' then raise; end if;
  end;
end $$;
update app.health_documents set scan_status='clean'
where id='00000000-0000-4000-8000-000000000010';
reset role;

-- Biomarker catalog: retired markers must be invisible to everyone but admins,
-- because "deactivated" has to hold even if a screen forgets to filter.
insert into app.biomarker_categories (id,name,description,display_order) values
  ('rls-cat','RLS Category','',900);
insert into app.biomarkers (id,name,display_name,scoring_mode,directionality) values
  ('rls-active','RLS Active','RLS Active','THREE_TIER','range_based'),
  ('rls-retired','RLS Retired','RLS Retired','THREE_TIER','range_based');
update app.biomarkers set is_active=false, deactivated_at=now() where id='rls-retired';
insert into app.biomarker_category_members (biomarker_id,category_id,is_primary) values
  ('rls-active','rls-cat',true), ('rls-retired','rls-cat',true);

do $$
begin
  begin
    insert into app.biomarkers (id,name,display_name,scoring_mode)
    values ('rls-bad-mode','Bad','Bad','FOUR_TIER');
    raise exception 'invalid scoring_mode unexpectedly accepted';
  exception when check_violation then null; end;
  begin
    insert into app.biomarkers (id,name,display_name,context_requirements)
    values ('rls-bad-ctx','Bad','Bad','{menstrual}');
    raise exception 'invalid context_requirement unexpectedly accepted';
  exception when check_violation then null; end;
  -- A two-tier marker must not carry a middle band: presenting a lab reference
  -- interval as a wellness target is exactly what this mode exists to prevent.
  begin
    insert into app.biomarkers (id,name,display_name,scoring_mode,suboptimal_range_label)
    values ('rls-bad-band','Bad','Bad','TWO_TIER','1-2');
    raise exception 'TWO_TIER marker with a sub-optimal band unexpectedly accepted';
  exception when check_violation then null; end;
  begin
    insert into app.biomarker_category_members (biomarker_id,category_id,is_primary)
    values ('rls-active','rls-cat',true);
    raise exception 'second primary category unexpectedly accepted';
  exception when unique_violation then null; end;
end $$;

set local role verae_app;
select set_config('app.user_id','rls-member-a',true);
select set_config('app.user_role','member',true);
do $$
begin
  if (select count(*) from app.biomarkers where id like 'rls-%') <> 1 then
    raise exception 'member saw a retired biomarker';
  end if;
  if (select count(*) from app.biomarker_category_members where biomarker_id like 'rls-%') <> 1 then
    raise exception 'member saw a retired biomarker category membership';
  end if;
  begin
    update app.biomarkers set is_active=false where id='rls-active';
    if found then raise exception 'member mutated the biomarker catalog'; end if;
  exception when insufficient_privilege then null; end;
end $$;

select set_config('app.user_role','admin',true);
do $$
begin
  if (select count(*) from app.biomarkers where id like 'rls-%') <> 2 then
    raise exception 'admin could not see retired biomarkers to reactivate them';
  end if;
  update app.biomarkers set is_active=true, deactivated_at=null where id='rls-retired';
end $$;
reset role;

rollback;

\echo 'RLS checks passed'
