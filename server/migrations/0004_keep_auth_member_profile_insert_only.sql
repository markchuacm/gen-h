-- Auth creates one member profile in the user-create hook. It does not need
-- table read access once that hook uses a plain insert.
revoke select on app.member_profiles from verae_auth;
