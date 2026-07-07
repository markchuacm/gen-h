-- Migration 001 — foundations: private schema, profiles, role protection,
-- profile bootstrap on signup. See plan §2–§3, §13.

-- ---------------------------------------------------------------------------
-- Private schema for security-definer helpers (not exposed via PostgREST).
-- ---------------------------------------------------------------------------
create schema if not exists private;

grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Shared updated_at trigger.
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles: identity + role, one row per auth user.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  role       text not null default 'member' check (role in ('member', 'doctor', 'admin')),
  email      text,
  full_name  text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

-- Members read their own row. (Doctor/member cross-visibility policies arrive
-- with doctor_assignments in migration 005.)
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- Own-row updates only; writable columns are limited by the column grant
-- below, and role is frozen by the trigger below.
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Column-level write access: clients may only touch display fields. This also
-- keeps email in sync with auth.users (clients cannot edit it here).
revoke insert, update, delete on public.profiles from authenticated, anon;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Role freeze: SECURITY INVOKER on purpose. PostgREST runs SET LOCAL ROLE per
-- request, so app users are `authenticated`; the dashboard runs as `postgres`
-- and the service key as `service_role` — both pass. A definer function would
-- report the owner as current_user and wrongly pass everyone.
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and current_user in ('authenticated', 'anon') then
    raise exception 'role changes require the service role';
  end if;
  return new;
end;
$$;

create trigger freeze_role
  before update on public.profiles
  for each row execute function public.prevent_role_change();

-- ---------------------------------------------------------------------------
-- Profile bootstrap: every new auth user gets a member profile. Runs for both
-- Google and email signups; the client never inserts profiles.
-- SECURITY DEFINER because the inserting role (supabase_auth_admin) has no
-- privileges on public.profiles. Any exception here aborts signup, hence
-- ON CONFLICT DO NOTHING for re-invites/identity relinks.
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
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
