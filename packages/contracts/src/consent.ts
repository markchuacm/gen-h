// Versioned identifiers for the three legal documents a member accepts or
// acknowledges during first-login setup. Stored in app.member_consents alongside
// a timestamp and the member's typed signature. Bump the relevant version when
// its matching file in src/legal/content changes so acceptance stays reproducible.
export const TERMS_VERSION = "verae-terms-2026-07-v4";
export const PRIVACY_VERSION = "verae-privacy-2026-07-v5";
export const CONSENT_VERSION = "verae-informed-consent-2026-07-v5";
