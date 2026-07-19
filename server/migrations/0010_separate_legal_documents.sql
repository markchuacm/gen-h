-- The onboarding agreement is now presented as three separately named legal
-- documents. Keep the privacy acknowledgement's version independently so the
-- exact set accepted by each member remains reproducible.
-- Existing rows (and any briefly overlapping older app instance) acknowledged
-- privacy language bundled into the former Terms of Service & Privacy document.
-- The new API always supplies the standalone policy's current version explicitly.
alter table app.member_consents
  add column privacy_version text not null
  default 'verae-privacy-legacy-combined-2026-07-v1';
