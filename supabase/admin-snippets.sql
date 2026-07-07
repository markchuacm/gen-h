-- Gen-H admin snippets — run in Supabase Dashboard → SQL Editor.
-- The dashboard uses the service role, which bypasses RLS: these writes are
-- the MVP admin workflow for entering and releasing lab results.
--
-- Valid biomarker codes: see supabase/biomarker-codes.md. Statuses are
-- exactly: optimal | at_risk | needs_attention.
-- Every change to lab_reports / biomarker_results is captured by the audit
-- log (once migration 007 lands).

-- ============================================================================
-- 0) Look up a member (you need their id for everything below)
-- ============================================================================
select id, email, full_name, role from public.profiles order by created_at desc;

-- ============================================================================
-- 1) Create a lab report (draft — invisible to the member until released)
--    Returns the new report id; use it in step 2.
-- ============================================================================
insert into public.lab_reports (member_id, lab_name, panel_name, collected_at, created_by)
values (
  '<MEMBER_ID>',
  '<LAB NAME e.g. Innoquest>',
  '<PANEL e.g. Advanced Blood Baseline>',
  '<YYYY-MM-DD test/draw date>',
  auth.uid() -- null when run from the SQL editor; fine
)
returning id;

-- Optional: link the source PDF (upload it first via Storage UI into
-- health-documents/<MEMBER_ID>/..., insert a health_documents row, then):
-- update public.lab_reports set document_id = '<DOCUMENT_ID>' where id = '<REPORT_ID>';

-- ============================================================================
-- 2) Enter biomarker values (repeat rows as needed)
--    value_numeric for numbers (enables trend charts); value_text for
--    '<0.5', 'Positive', 'Non-reactive'. Leave ranges null to use the app's
--    catalog defaults; fill them when the lab's ranges differ.
-- ============================================================================
insert into public.biomarker_results
  (lab_report_id, member_id, biomarker_code, biomarker_name, category,
   value_numeric, value_text, unit, ref_low, ref_high, optimal_low, optimal_high,
   status, notes)
values
  ('<REPORT_ID>', '<MEMBER_ID>', 'ldl-cholesterol', 'LDL Cholesterol', 'Heart',
   3.1, null, 'mmol/L', null, 3.4, null, 2.6,
   'at_risk', null),
  ('<REPORT_ID>', '<MEMBER_ID>', 'vitamin-d', 'Vitamin D', 'Nutrients',
   52, null, 'nmol/L', 50, 250, 100, 150,
   'at_risk', 'Repletion recommended')
;

-- ============================================================================
-- 3) Review as the member would: draft reports return nothing to members.
-- ============================================================================
select r.panel_name, r.status, b.biomarker_code, b.value_numeric, b.value_text, b.status
from public.lab_reports r
join public.biomarker_results b on b.lab_report_id = r.id
where r.id = '<REPORT_ID>';

-- ============================================================================
-- 4) RELEASE — one transaction: report visible + journey stage advanced.
--    (workflow_events insert joins this snippet once migration 007 lands.)
-- ============================================================================
begin;
  update public.lab_reports
     set status = 'released', released_at = now()
   where id = '<REPORT_ID>';

  update public.member_profiles
     set current_stage = 'results_ready'
   where member_id = '<MEMBER_ID>'
     and current_stage in ('results_pending', 'blood_form_ready', 'consult_upcoming');
commit;

-- ============================================================================
-- 5) Corrections after release: edit values in place (audit log records it).
-- ============================================================================
-- update public.biomarker_results
--    set value_numeric = <NEW VALUE>, status = '<optimal|at_risk|needs_attention>'
--  where id = '<BIOMARKER_RESULT_ID>';

-- ============================================================================
-- 6) Assign a doctor to a member (once migration 007 adds doctor_assignments)
-- ============================================================================
-- insert into public.doctor_assignments (doctor_id, member_id) values ('<DOCTOR_ID>', '<MEMBER_ID>');

-- ============================================================================
-- 7) Promote a user (role changes are impossible from the app by design)
-- ============================================================================
-- update public.profiles set role = 'doctor' where email = '<EMAIL>';
