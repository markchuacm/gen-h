import { canonicalLabEventSchema, type CanonicalLabEvent } from "@verae/contracts";

export type AdapterIssue = { code: string; message: string; details?: unknown };
export type AdapterResult =
  | { ok: true; event: CanonicalLabEvent }
  | { ok: false; issues: AdapterIssue[] };

function json(raw: Buffer): unknown | null {
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return null;
  }
}

export function parseLabPayload(adapterType: string, raw: Buffer): AdapterResult {
  if (adapterType === "canonical_json") {
    const value = json(raw);
    if (value === null) return { ok: false, issues: [{ code: "INVALID_JSON", message: "Payload is not valid JSON" }] };
    const parsed = canonicalLabEventSchema.safeParse(value);
    if (!parsed.success) {
      return {
        ok: false,
        issues: [{ code: "SCHEMA_VALIDATION_FAILED", message: "Payload does not match CanonicalLabEvent v1", details: parsed.error.flatten() }],
      };
    }
    return { ok: true, event: parsed.data };
  }

  if (adapterType === "hl7_v2") {
    if (!raw.toString("utf8").trimStart().startsWith("MSH|")) {
      return { ok: false, issues: [{ code: "INVALID_HL7_V2", message: "Payload does not begin with an HL7 MSH segment" }] };
    }
    return { ok: false, issues: [{ code: "ADAPTER_CONFIGURATION_REQUIRED", message: "HL7 v2 field mapping requires approved partner samples" }] };
  }

  if (adapterType === "fhir") {
    const value = json(raw);
    const resourceType = value && typeof value === "object" && "resourceType" in value
      ? (value as { resourceType?: unknown }).resourceType
      : null;
    if (resourceType !== "Bundle" && resourceType !== "DiagnosticReport") {
      return { ok: false, issues: [{ code: "INVALID_FHIR", message: "Expected a FHIR Bundle or DiagnosticReport" }] };
    }
    return { ok: false, issues: [{ code: "ADAPTER_CONFIGURATION_REQUIRED", message: "FHIR identifier and Observation mapping requires approved partner samples" }] };
  }

  return { ok: false, issues: [{ code: "ADAPTER_NOT_IMPLEMENTED", message: `Adapter ${adapterType} is not implemented` }] };
}
