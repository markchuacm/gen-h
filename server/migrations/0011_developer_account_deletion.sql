-- Developer-mode account deletion is verified by the API before this function
-- is called. The database function keeps the multi-table hard delete atomic and
-- still independently requires an administrator actor.
create or replace function app.delete_account(target_user_id text) returns text
language plpgsql
security definer
set search_path = app, identity, pg_temp
as $$
declare
  target_role text;
begin
  if not app.is_admin() then
    raise exception 'administrator required' using errcode = '42501';
  end if;
  if target_user_id = app.current_user_id() then
    raise exception 'cannot delete own account' using errcode = '22023';
  end if;

  select role into target_role from app.profiles where id = target_user_id for update;
  if target_role is null then return null; end if;
  if target_role not in ('member', 'doctor') then
    raise exception 'only member and doctor accounts may be deleted' using errcode = '22023';
  end if;

  if target_role = 'doctor' then
    -- These two tables intentionally restrict doctor deletion. Hard deletion in
    -- developer mode removes the doctor's scheduled consults and authored plans.
    delete from app.appointments where doctor_id = target_user_id;
    delete from app.care_plans where doctor_id = target_user_id;
  end if;

  delete from identity."user" where id = target_user_id;
  return target_role;
end
$$;

revoke all on function app.delete_account(text) from public;
grant execute on function app.delete_account(text) to verae_app;
