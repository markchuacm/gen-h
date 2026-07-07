-- Migration 003 — member data: member_profiles + onboarding_responses.
-- Doctor-visibility policies for these tables arrive with doctor_assignments
-- (migration 005); until then access is strictly member-own.

-- ---------------------------------------------------------------------------
-- member_profiles: member-only health/demographic data + journey stage.
-- One row per member, created at signup (see handle_new_user below).
-- ---------------------------------------------------------------------------
create table public.member_profiles (
  id                   uuid primary key default gen_random_uuid(),
  member_id            uuid not null unique references public.profiles (id) on delete cascade,
  -- Basics as the onboarding flow collects them (age, not DOB, for now).
  age                  int,
  sex                  text,
  height_cm            numeric,
  weight_kg            numeric,
  goals                text[],
  medications          text,
  conditions           text,
  onboarding_status    text not null default 'not_started'
                       check (onboarding_status in ('not_started', 'in_progress', 'completed')),
  current_stage        text not null default 'profile_incomplete'
                       check (current_stage in (
                         'profile_incomplete', 'consult_upcoming', 'blood_form_ready',
                         'results_pending', 'results_ready', 'care_plan_ready'
                       )),
  profile_confirmed_at timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.member_profiles
  for each row execute function private.set_updated_at();

alter table public.member_profiles enable row level security;

create policy "member_profiles_select_own"
  on public.member_profiles for select
  to authenticated
  using (member_id = auth.uid());

create policy "member_profiles_insert_own"
  on public.member_profiles for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "member_profiles_update_own"
  on public.member_profiles for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

-- Explicit grants: CLI migrations don't inherit Supabase's default privileges.
grant select, insert, update on public.member_profiles to authenticated;

-- ---------------------------------------------------------------------------
-- onboarding_responses: one row per section/question key, jsonb payload owned
-- by the frontend.
-- ---------------------------------------------------------------------------
create table public.onboarding_responses (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references public.profiles (id) on delete cascade,
  question_key text not null,
  response     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (member_id, question_key)
);

create trigger set_updated_at
  before update on public.onboarding_responses
  for each row execute function private.set_updated_at();

alter table public.onboarding_responses enable row level security;

create policy "onboarding_responses_select_own"
  on public.onboarding_responses for select
  to authenticated
  using (member_id = auth.uid());

create policy "onboarding_responses_insert_own"
  on public.onboarding_responses for insert
  to authenticated
  with check (member_id = auth.uid());

create policy "onboarding_responses_update_own"
  on public.onboarding_responses for update
  to authenticated
  using (member_id = auth.uid())
  with check (member_id = auth.uid());

grant select, insert, update on public.onboarding_responses to authenticated;

-- ---------------------------------------------------------------------------
-- Every signup is a member, so create the member_profiles row up front — the
-- home screen reads current_stage unconditionally. Stray rows on later
-- doctor/admin promotions are harmless.
-- ---------------------------------------------------------------------------
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

  return new;
end;
$$;

-- Backfill member_profiles for users who signed up before this migration.
insert into public.member_profiles (member_id)
select p.id from public.profiles p
where p.role = 'member'
on conflict (member_id) do nothing;
