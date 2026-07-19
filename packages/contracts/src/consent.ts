// Versioned identifiers for the terms and health-data consent a member accepts
// during first-login setup. Stored in app.member_consents alongside a timestamp
// and the member's typed signature. Bump the relevant version string whenever the
// corresponding copy in the setup wizard (src/auth/setup/consentContent.ts)
// changes, so historical acceptances stay tied to the text that was shown.
export const TERMS_VERSION = "verae-terms-2026-07-v1";
export const CONSENT_VERSION = "verae-health-consent-2026-07-v1";
