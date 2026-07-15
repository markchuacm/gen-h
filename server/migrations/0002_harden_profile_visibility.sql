-- Members must not gain access to staff profiles through an assignment.
-- Doctor-facing queries may still read an actively assigned member profile.
create or replace function app.can_view_profile(target_id text) returns boolean
language sql stable security definer set search_path = app, pg_temp as $$
  select app.is_admin()
    or target_id = app.current_user_id()
    or exists (
      select 1 from app.doctor_assignments
      where status = 'active'
        and doctor_id = app.current_user_id()
        and member_id = target_id
    )
$$;
