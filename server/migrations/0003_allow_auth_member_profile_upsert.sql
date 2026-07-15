-- The Better Auth create hook uses INSERT ... ON CONFLICT DO NOTHING.
-- PostgreSQL requires read permission to evaluate the conflict target.
grant select on app.member_profiles to verae_auth;
