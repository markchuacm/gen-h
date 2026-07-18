-- A document content upload must be claimed before its object can be written.
-- This prevents a second PUT from replacing an object while the first version
-- is being scanned and later inheriting that version's clean result.
alter table app.health_documents
  drop constraint if exists health_documents_scan_status_check;

alter table app.health_documents
  add constraint health_documents_scan_status_check
  check (scan_status in ('pending', 'scanning', 'clean', 'infected', 'failed'));
