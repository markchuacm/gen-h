# Staging browser journeys

The Playwright suite targets the UAT portal and API by default. It never stores
passwords, MFA seeds, or API tokens in the repository. Public launch-gate tests
run without a session. Role journeys use browser storage-state files generated
from approved synthetic accounts.

1. Install the browsers with `pnpm test:e2e:install`.
2. Sign in interactively, including Turnstile and MFA, and save each role's
   browser state under `.auth/member.json`, `.auth/doctor.json`, and
   `.auth/admin.json`. The whole `.auth` directory is gitignored.
3. Run `pnpm test:e2e`. Override `E2E_APP_URL`, `E2E_API_URL`, or any
   `E2E_<ROLE>_STORAGE` path when validating another isolated environment.

The clinical immutability checks submit only rejected no-op mutations against
released fixtures. Tests that would create invitations, orders, reports, or
care-plan drafts remain manual unless a disposable fixture-provisioning job has
been run for that test execution.
