-- Self-healing profile bootstrap. The signup trigger only fires on new
-- auth.users inserts; if a profiles row is ever removed manually (dashboard
-- table edits are the MVP admin path), the app can call this to restore it
-- for the signed-in user. Idempotent, scoped to auth.uid().
create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  select
    u.id,
    u.email,
    coalesce(
      u.raw_user_meta_data ->> 'full_name',
      u.raw_user_meta_data ->> 'name'
    ),
    u.raw_user_meta_data ->> 'avatar_url'
  from auth.users u
  where u.id = auth.uid()
  on conflict (id) do nothing;

  insert into public.member_profiles (member_id)
  select p.id
  from public.profiles p
  where p.id = auth.uid() and p.role = 'member'
  on conflict (member_id) do nothing;
end;
$$;

revoke execute on function public.ensure_profile() from public, anon;
grant execute on function public.ensure_profile() to authenticated;
