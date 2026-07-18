-- Teleconsult scheduling. The consult was previously only a journey stage
-- (member_profiles.current_stage = 'consult_upcoming') with no date, doctor
-- link, or join URL. This table gives the admin a real appointment to schedule
-- and drives the member/doctor portals plus reminder emails.

create table app.appointments (
  id uuid primary key default gen_random_uuid(),
  member_id text not null references app.profiles(id) on delete cascade,
  doctor_id text not null references app.profiles(id) on delete restrict,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 30 check (duration_minutes between 5 and 240),
  meeting_url text check (meeting_url is null or meeting_url ~ '^https://meet\.google\.com/'),
  status text not null default 'scheduled' check (status in ('scheduled', 'cancelled', 'completed')),
  cancelled_at timestamptz,
  created_by text references app.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Mirrors one_active_doctor_per_member: at most one live consult per member.
create unique index one_scheduled_appointment_per_member on app.appointments (member_id) where status = 'scheduled';
create index appointments_doctor_upcoming_idx on app.appointments (doctor_id, scheduled_at) where status = 'scheduled';

create trigger appointments_updated_at before update on app.appointments
  for each row execute function app.set_updated_at();
create trigger appointments_audit after insert or update or delete on app.appointments
  for each row execute function audit.capture_mutation();

alter table app.appointments enable row level security;
create policy appointments_select on app.appointments for select
  using (member_id = app.current_user_id() or doctor_id = app.current_user_id() or app.is_admin());
create policy appointments_admin_write on app.appointments for all
  using (app.is_admin()) with check (app.is_admin());
-- The reminder worker re-reads the appointment before sending each email.
create policy appointments_worker_select on app.appointments for select to verae_worker using (true);

grant select, insert, update, delete on app.appointments to verae_app;
grant select on app.appointments to verae_worker;

-- The reminder worker also needs member/doctor emails and names. verae_worker
-- had no access to app.profiles before now (0001 only grants it lab/member
-- tables), so add both a grant and a permissive select policy.
grant select on app.profiles to verae_worker;
create policy worker_profiles_select on app.profiles for select to verae_worker using (true);
