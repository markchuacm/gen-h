import type { CanonicalObservation } from "@verae/contracts";
import { withWorker } from "../db/pools.js";
import { parseLabPayload } from "../integrations/adapters/index.js";

function numericValue(value: string): number | null {
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function statusFor(observation: CanonicalObservation, value: number | null): "optimal" | "at_risk" | "needs_attention" {
  const flag = observation.flag?.toUpperCase() ?? "";
  if (["HH", "LL", "CRITICAL", "PANIC"].includes(flag)) return "needs_attention";
  if (flag && flag !== "N" && flag !== "NORMAL") return "at_risk";
  const low = observation.reference_range?.low;
  const high = observation.reference_range?.high;
  if (value !== null && ((low != null && value < low) || (high != null && value > high))) return "at_risk";
  return "optimal";
}

async function quarantine(eventId: string, issues: Array<{ code: string; message: string; details?: unknown }>): Promise<void> {
  await withWorker(eventId, async (client) => {
    for (const issue of issues) {
      await client.query(
        `insert into integration.processing_issues (inbound_event_id, issue_code, message, details)
         values ($1,$2,$3,$4::jsonb)`,
        [eventId, issue.code, issue.message, JSON.stringify(issue.details ?? {})],
      );
    }
    await client.query(
      "update integration.inbound_events set processing_status='quarantined', processed_at=now(), error_code=$2, error_detail=$3 where id=$1",
      [eventId, issues[0]?.code ?? "VALIDATION_FAILED", issues[0]?.message ?? "Event quarantined"],
    );
  });
}

export async function processLabEvent(eventId: string): Promise<void> {
  const source = await withWorker(eventId, async (client) => {
    const result = await client.query<{
      raw_payload: Buffer;
      partner_event_id: string;
      partner_id: string;
      adapter_type: string;
      source_system: string | null;
    }>(
      `select e.raw_payload, e.partner_event_id, e.partner_id, p.adapter_type, p.source_system
       from integration.inbound_events e join integration.lab_partners p on p.id=e.partner_id
       where e.id=$1 for update`,
      [eventId],
    );
    if (result.rows[0]) await client.query("update integration.inbound_events set processing_status='processing' where id=$1", [eventId]);
    return result.rows[0];
  });
  if (!source) return;
  const parsed = parseLabPayload(source.adapter_type, source.raw_payload);
  if (!parsed.ok) {
    await quarantine(eventId, parsed.issues);
    return;
  }
  const event = parsed.event;
  if (event.event_id !== source.partner_event_id) {
    await quarantine(eventId, [{ code: "EVENT_ID_MISMATCH", message: "Header event ID and payload event ID differ" }]);
    return;
  }

  await withWorker(eventId, async (client) => {
    const orderResult = await client.query<{ id: string; member_id: string }>(
      "select id, member_id from app.lab_orders where client_order_id=$1",
      [event.order.client_order_id],
    );
    const order = orderResult.rows[0];
    if (!order) {
      throw Object.assign(new Error("Unknown client order ID"), { quarantine: true, issueCode: "UNKNOWN_ORDER" });
    }

    const mapped: Array<{ observation: CanonicalObservation; biomarkerCode: string; normalizedUnit: string | null; version: number }> = [];
    const issues: Array<{ code: string; message: string; details: unknown }> = [];
    for (const observation of event.report.observations) {
      const mapping = await client.query<{ biomarker_code: string; normalized_unit: string | null; version: number }>(
        `select biomarker_code, normalized_unit, version from integration.code_mappings
         where partner_id=$1 and source_code=$2 and source_unit=$3 and status='approved'
         order by version desc limit 1`,
        [source.partner_id, observation.source_code, observation.unit ?? ""],
      );
      if (!mapping.rows[0]) {
        issues.push({ code: "UNKNOWN_CODE_OR_UNIT", message: `No approved mapping for ${observation.source_code}`, details: { source_code: observation.source_code, unit: observation.unit ?? null } });
      } else {
        mapped.push({ observation, biomarkerCode: mapping.rows[0].biomarker_code, normalizedUnit: mapping.rows[0].normalized_unit, version: mapping.rows[0].version });
      }
    }
    if (issues.length) {
      for (const issue of issues) {
        await client.query(
          "insert into integration.processing_issues (inbound_event_id, issue_code, message, details) values ($1,$2,$3,$4::jsonb)",
          [eventId, issue.code, issue.message, JSON.stringify(issue.details)],
        );
      }
      await client.query("update integration.inbound_events set processing_status='quarantined',processed_at=now(),error_code='UNKNOWN_CODE_OR_UNIT' where id=$1", [eventId]);
      return;
    }

    const latest = await client.query<{ id: string; source_version: number }>(
      `select id, source_version from app.lab_reports where partner_id=$1 and external_report_id=$2
       order by source_version desc limit 1`,
      [source.partner_id, event.report.report_id],
    );
    if (latest.rows[0]?.source_version === event.report.version) {
      await client.query(
        "insert into integration.processing_issues (inbound_event_id,issue_code,message,details) values ($1,'REPORT_VERSION_CONFLICT',$2,$3::jsonb)",
        [eventId, "A different event already uses this report ID and version", JSON.stringify({ report_id: event.report.report_id, version: event.report.version })],
      );
      await client.query("update integration.inbound_events set processing_status='quarantined',processed_at=now(),error_code='REPORT_VERSION_CONFLICT' where id=$1", [eventId]);
      return;
    }
    if (latest.rows[0] && latest.rows[0].source_version > event.report.version) {
      await client.query(
        "insert into integration.processing_issues (inbound_event_id,issue_code,message,details) values ($1,'REGRESSIVE_REPORT_VERSION',$2,$3::jsonb)",
        [eventId, "The incoming report version is older than the latest stored version", JSON.stringify({ report_id: event.report.report_id, incoming_version: event.report.version, latest_version: latest.rows[0].source_version })],
      );
      await client.query("update integration.inbound_events set processing_status='quarantined',processed_at=now(),error_code='REGRESSIVE_REPORT_VERSION' where id=$1", [eventId]);
      return;
    }
    const report = await client.query<{ id: string }>(
      `insert into app.lab_reports
        (member_id, lab_order_id, partner_id, external_report_id, source_version, source_status,
         supersedes_report_id, lab_name, panel_name, collected_at, issued_at, status)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) returning id`,
      [order.member_id, order.id, source.partner_id, event.report.report_id, event.report.version,
        event.report.status, latest.rows[0]?.id ?? null, source.source_system, null, event.occurred_at,
        event.report.issued_at ?? null, event.report.status === "cancelled" || event.report.status === "entered_in_error" ? "rejected" : "review_pending"],
    );
    for (const item of mapped) {
      const value = numericValue(item.observation.value);
      await client.query(
        `insert into app.biomarker_results
          (lab_report_id, member_id, source_code, source_system, biomarker_code, biomarker_name,
           source_value, value_numeric, value_text, source_unit, unit, source_reference_range,
           ref_low, ref_high, source_flag, source_status, status, mapping_version, notes, observed_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [report.rows[0]!.id, order.member_id, item.observation.source_code, item.observation.source_system,
          item.biomarkerCode, item.observation.name, item.observation.value, value,
          value === null ? item.observation.value : null, item.observation.unit ?? null,
          item.normalizedUnit ?? item.observation.unit ?? null, item.observation.reference_range?.text ?? null,
          item.observation.reference_range?.low ?? null, item.observation.reference_range?.high ?? null,
          item.observation.flag ?? null, item.observation.status, statusFor(item.observation, value), item.version,
          item.observation.notes ?? null, item.observation.observed_at ?? null],
      );
    }
    await client.query("update app.lab_orders set status='completed',accession_number=coalesce($2,accession_number),external_order_id=coalesce($3,external_order_id) where id=$1", [order.id, event.order.accession_number ?? null, event.order.lab_order_id ?? null]);
    await client.query("update app.member_profiles set current_stage='results_pending' where member_id=$1", [order.member_id]);
    await client.query("update integration.inbound_events set processing_status='imported',processed_at=now(),lab_report_id=$2 where id=$1", [eventId, report.rows[0]!.id]);
  }).catch(async (error: unknown) => {
    if (error && typeof error === "object" && "quarantine" in error) {
      const issue = error as unknown as { issueCode: string; message: string };
      await quarantine(eventId, [{ code: issue.issueCode, message: issue.message }]);
      return;
    }
    throw error;
  });
}
