-- Members should see their assigned doctor's name before a teleconsult slot
-- has been scheduled. Keep appointment fields nullable until admin booking.
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
  select a.id,
         da.doctor_id,
         d.full_name,
         a.scheduled_at,
         a.duration_minutes,
         a.meeting_url,
         a.status
  from app.doctor_assignments da
  join app.profiles d on d.id = da.doctor_id
  left join lateral (
    select ap.id, ap.scheduled_at, ap.duration_minutes, ap.meeting_url, ap.status
    from app.appointments ap
    where ap.member_id = target_member_id
      and ap.doctor_id = da.doctor_id
      and ap.status = 'scheduled'
    order by ap.scheduled_at asc
    limit 1
  ) a on true
  where da.member_id = target_member_id
    and da.status = 'active'
    and (target_member_id = app.current_user_id() or app.is_doctor_of(target_member_id) or app.is_admin())
  limit 1
$$;

grant execute on function app.member_consult(text) to verae_app;
