import { withWorker } from "../db/pools.js";
import {
  buildCarePlanDraft,
  CARE_PLAN_RULESET_VERSION,
  type CarePlanEvidence,
  type ResultStatus,
} from "../services/care-plan-engine.js";

type ResultRow = {
  report_id: string;
  collected_at: Date | null;
  biomarker_code: string;
  display_name: string;
  value_numeric: string | number | null;
  value_text: string | null;
  unit: string | null;
  status: ResultStatus;
  scoring_mode: string | null;
};

function valueOf(row: ResultRow): number | string | null {
  if (row.value_numeric !== null) {
    const parsed = Number(row.value_numeric);
    return Number.isFinite(parsed) ? parsed : String(row.value_numeric);
  }
  return row.value_text;
}

export async function generateCarePlan(memberId: string, reportId: string): Promise<void> {
  await withWorker(`care-plan:${memberId}`, async (client) => {
    await client.query("select pg_advisory_xact_lock(hashtextextended($1, 0))", [`care-plan:${memberId}`]);
    await client.query(
      `insert into app.care_plan_generation_states (member_id, report_id, status, last_error)
       values ($1, $2, 'pending', null)
       on conflict (member_id) do update
         set report_id = excluded.report_id, status = 'pending', last_error = null, updated_at = now()`,
      [memberId, reportId],
    );

    const assignment = await client.query<{ doctor_id: string }>(
      `select doctor_id from app.doctor_assignments
       where member_id = $1 and status = 'active'
       order by assigned_at desc limit 1`,
      [memberId],
    );
    const doctorId = assignment.rows[0]?.doctor_id;
    if (!doctorId) {
      await client.query(
        `update app.care_plan_generation_states
         set last_error = 'No active doctor assignment', updated_at = now()
         where member_id = $1`,
        [memberId],
      );
      throw new Error(`Cannot generate care plan for ${memberId}: no active doctor`);
    }

    const reports = await client.query<ResultRow>(
      `select distinct on (b.biomarker_code)
              r.id as report_id, r.collected_at, b.biomarker_code,
              coalesce(c.display_name, b.biomarker_name, b.biomarker_code) as display_name,
              b.value_numeric, b.value_text, coalesce(b.unit, c.unit) as unit,
              b.status, c.scoring_mode
         from app.lab_reports r
         join app.biomarker_results b on b.lab_report_id = r.id
         left join app.biomarkers c on c.id = b.biomarker_code
        where r.member_id = $1 and r.status = 'released'
          and not exists (
            select 1 from app.lab_reports replacement
             where replacement.supersedes_report_id = r.id
               and replacement.status = 'released'
          )
        order by b.biomarker_code, r.collected_at desc nulls last, r.released_at desc`,
      [memberId],
    );
    const sourceReportIds = [...new Set(reports.rows.map((row) => row.report_id))];

    const responses = await client.query<{ question_key: string; response: unknown }>(
      "select question_key, response from app.onboarding_responses where member_id = $1",
      [memberId],
    );
    const profile = Object.fromEntries(responses.rows.map((row) => [row.question_key, row.response]));
    const biomarkers: CarePlanEvidence[] = reports.rows
      .filter((row) => !["INFORMATIONAL", "QUALITATIVE"].includes(row.scoring_mode ?? ""))
      .map((row) => ({
        biomarkerCode: row.biomarker_code,
        displayName: row.display_name,
        value: valueOf(row),
        unit: row.unit,
        status: row.status,
        reportId: row.report_id,
        collectedAt: row.collected_at?.toISOString() ?? null,
      }));
    const draft = buildCarePlanDraft({ biomarkers, profile });

    const existing = await client.query<{
      id: string;
      doctor_edited_at: Date | null;
      source_report_ids: string[];
    }>(
      `select id, doctor_edited_at, source_report_ids
       from app.care_plans where member_id = $1 and status = 'draft'
       for update`,
      [memberId],
    );

    let planId = existing.rows[0]?.id;
    if (planId && existing.rows[0]?.doctor_edited_at) {
      await client.query(
        `update app.care_plans
         set evidence_stale = true, generation_status = 'stale',
             source_report_ids = $2, updated_at = now()
         where id = $1`,
        [planId, sourceReportIds],
      );
      await client.query(
        `update app.care_plan_generation_states
         set status = 'completed', last_error = null, updated_at = now()
         where member_id = $1`,
        [memberId],
      );
      return;
    }

    if (!planId) {
      const created = await client.query<{ id: string }>(
        `insert into app.care_plans
          (member_id, doctor_id, title, summary, status, version,
           ruleset_version, generation_mode, generation_status,
           source_report_ids, review_date, evidence_stale, supersedes_plan_id)
         values ($1, $2, 'Your plan for the next 12 weeks',
                 'A focused plan prepared from your results, profile and consultation.',
                 'draft',
                 (select coalesce(max(version), 0) + 1 from app.care_plans where member_id = $1),
                 $3, $4, 'ready', $5, current_date + 84, false,
                 (select id from app.care_plans
                   where member_id = $1 and status = 'released'
                   order by version desc limit 1))
         returning id`,
        [memberId, doctorId, CARE_PLAN_RULESET_VERSION, draft.mode, sourceReportIds],
      );
      planId = created.rows[0]!.id;
    } else {
      await client.query("delete from app.care_plan_sections where care_plan_id = $1", [planId]);
      await client.query(
        `update app.care_plans
         set doctor_id = $2, ruleset_version = $3, generation_mode = $4,
             generation_status = 'ready', source_report_ids = $5,
             review_date = coalesce(review_date, current_date + 84),
             evidence_stale = false, updated_at = now()
         where id = $1`,
        [planId, doctorId, CARE_PLAN_RULESET_VERSION, draft.mode, sourceReportIds],
      );
    }

    for (const [index, section] of draft.sections.entries()) {
      await client.query(
        `insert into app.care_plan_sections
          (care_plan_id, sort_order, title, summary, markers, doctor_note,
           image_key, actions, template_key, basis_type, section_state,
           evidence_snapshot, profile_basis, proposed_actions)
         values ($1, $2, $3, $4, $5, $6, $7, '[]'::jsonb,
                 $8, $9, 'active', $10::jsonb, $11::jsonb, $12::jsonb)`,
        [
          planId,
          index,
          section.title,
          section.summary,
          section.evidence.map((item) => item.displayName),
          section.doctorNote,
          section.imageKey,
          section.templateKey,
          section.basisType,
          JSON.stringify(section.evidence),
          JSON.stringify(section.profileBasis),
          JSON.stringify(section.proposedActions),
        ],
      );
    }

    await client.query(
      `update app.care_plan_generation_states
       set status = 'completed', last_error = null, updated_at = now()
       where member_id = $1`,
      [memberId],
    );
  }).catch(async (error: unknown) => {
    // Preserve a readable failure state without masking the error from pg-boss,
    // which still needs to retry the job.
    const noDoctor = error instanceof Error && error.message.includes("no active doctor");
    await withWorker(`care-plan-failed:${memberId}`, async (client) => {
      await client.query(
        `insert into app.care_plan_generation_states (member_id, report_id, status, last_error)
         values ($1, $2, $3, $4)
         on conflict (member_id) do update
           set report_id = excluded.report_id, status = excluded.status,
               last_error = excluded.last_error, updated_at = now()`,
        [
          memberId,
          reportId,
          noDoctor ? "pending" : "failed",
          error instanceof Error ? error.message.slice(0, 500) : "Generation failed",
        ],
      );
    }).catch(() => undefined);
    throw error;
  });
}
