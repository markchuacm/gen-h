# Supabase prototype retirement

Run this only after `app.veraehealth.com` is verified against the Malaysia API and the production-boundary test passes.

1. If wanted for personal reference, export the owner's test report as PDF/CSV and store it in an appropriate private location.
2. Do not dump or import Supabase Auth, password hashes, sessions, UUIDs, storage metadata, database rows, or service configuration.
3. Confirm the Vercel production environment has `VITE_API_URL=https://api.veraehealth.com` and no Supabase variables.
4. Confirm Google OAuth has only the new callback `https://api.veraehealth.com/api/auth/callback/google` plus explicitly required local development callbacks.
5. Search deployed frontend assets and network traffic for Supabase hosts.
6. Delete personal health rows and objects from the Supabase prototype.
7. Revoke service-role/anon keys and remove old OAuth callback URLs.
8. Delete the Supabase project only after a final portal smoke test and an agreed short observation period.
9. Record the deletion date and evidence in the data/vendor register.

The `supabase/` folder in this repository is historical schema/test reference only. It is excluded from the production image by `.dockerignore` and no production package imports the Supabase SDK.
