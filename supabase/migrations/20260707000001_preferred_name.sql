-- Adds preferred_name, captured on the first onboarding step and used for
-- the Home screen greeting instead of the auth provider's full_name.
alter table public.member_profiles add column preferred_name text;
-- No new grant needed: member_profiles already has table-level select/insert/
-- update granted to authenticated (migration 003), which covers new columns.
