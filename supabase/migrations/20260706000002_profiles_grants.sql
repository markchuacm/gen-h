-- Fix: CLI migrations run under a dedicated login role, so Supabase's default
-- privileges (which auto-grant to the API roles) never applied to profiles.
-- Grants must be explicit in every table migration from here on.
grant select on public.profiles to authenticated;
