-- A member may see their own scheduled consult, but migration 0002 deliberately
-- blocks members from reading staff profile rows — so a plain join to
-- app.profiles for the doctor's name returns nothing under the member's RLS.
-- This security-definer function exposes only the doctor's display name (never
-- email/role/other columns) for a consult the caller is authorised to see:
-- the member themselves, their active doctor, or an admin.
create or replace function app.member_consult(target_member_id text)
returns table (
  id uuid,
  doctor_id text,
  doctor_name text,
  scheduled_at timestamptz,
  duration_minutes int,
  meeting_url text,
  status text
)
language sql stable security definer set search_path = app, pg_temp as $$
  select a.id, a.doctor_id, d.full_name, a.scheduled_at, a.duration_minutes, a.meeting_url, a.status
  from app.appointments a
  join app.profiles d on d.id = a.doctor_id
  where a.member_id = target_member_id
    and a.status = 'scheduled'
    and (target_member_id = app.current_user_id() or app.is_doctor_of(target_member_id) or app.is_admin())
  limit 1
$$;

grant execute on function app.member_consult(text) to verae_app;
