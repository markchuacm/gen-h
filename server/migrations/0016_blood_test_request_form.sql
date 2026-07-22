-- Blood-test request-form flow. Two additions:
--
-- 1. Identity fields the Innoquest request form marks mandatory (IC/passport,
--    date of birth, address) that we did not previously collect. Age is still
--    stored separately because some members complete their profile before the
--    request form exists; the form derives age from date_of_birth when present
--    and falls back to the stored age otherwise.
--
-- 2. A release gate on the lab order. The doctor submitting a panel no longer
--    advances the member to the blood-draw stage; instead an admin confirms the
--    appointment and payment off-platform and then releases the form, which is
--    what flips the member's stage and emails them the dashboard link.

alter table app.member_profiles
  add column if not exists date_of_birth date,
  add column if not exists ic_passport_no text,
  add column if not exists address text;

alter table app.lab_orders
  add column if not exists form_released_at timestamptz,
  add column if not exists form_released_by text references app.profiles(id) on delete set null;

-- Members own their identity details, but the profiles table only allows admins
-- to update rows (profiles_admin_update in 0001) so that role/account_status can
-- never be self-edited. Rather than open a broad self-update policy, expose a
-- narrow security-definer function that touches only the identity columns for
-- the caller's own rows. Mirrors app.member_consult (0008).
create or replace function app.update_own_member_identity(
  new_full_name text,
  new_date_of_birth date,
  new_ic_passport_no text,
  new_address text,
  new_phone text
) returns void
language plpgsql security definer set search_path = app, pg_temp as $$
declare
  uid text := app.current_user_id();
begin
  if uid is null then
    raise exception 'no authenticated user';
  end if;

  -- A null argument means "leave this field unchanged" so a partial update
  -- (e.g. correcting only the name) can never blank the other identity fields.
  update app.profiles
    set full_name = coalesce(nullif(btrim(new_full_name), ''), full_name)
    where id = uid and role = 'member';

  update app.member_profiles
    set date_of_birth = coalesce(new_date_of_birth, date_of_birth),
        ic_passport_no = coalesce(nullif(btrim(new_ic_passport_no), ''), ic_passport_no),
        address = coalesce(nullif(btrim(new_address), ''), address),
        phone = coalesce(nullif(btrim(new_phone), ''), phone)
    where member_id = uid;
end $$;

grant execute on function app.update_own_member_identity(text, date, text, text, text) to verae_app;
