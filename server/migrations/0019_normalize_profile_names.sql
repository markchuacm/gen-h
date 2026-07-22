-- Keep names readable everywhere they are surfaced from app.profiles.
-- initcap handles space- and hyphen-separated names, while the trigger keeps
-- this invariant true for member edits, admin invites, and auth profile syncs.

create or replace function app.normalize_profile_full_name()
returns trigger
language plpgsql
set search_path = pg_catalog, app, pg_temp
as $$
begin
  if new.full_name is not null then
    new.full_name := nullif(initcap(btrim(new.full_name)), '');
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_normalize_full_name on app.profiles;
create trigger profiles_normalize_full_name
before insert or update of full_name on app.profiles
for each row execute function app.normalize_profile_full_name();

-- Bring existing doctor/admin/member records into the same canonical format.
update app.profiles
   set full_name = nullif(initcap(btrim(full_name)), '')
 where full_name is not null
   and full_name is distinct from nullif(initcap(btrim(full_name)), '');
