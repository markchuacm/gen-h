import { describe, expect, it } from "vitest";
import { parseLabPayload } from "./index.js";

const event = {
  schema_version: "1.0",
  event_id: "evt-001",
  event_type: "lab_result.final",
  occurred_at: "2026-07-15T04:30:00.000Z",
  order: { client_order_id: "verae-order-001" },
  patient: {},
  report: {
    report_id: "report-001",
    version: 1,
    status: "final",
    observations: [{ source_code: "HBA1C", source_system: "LAB", name: "HbA1c", value: "5.4", unit: "%", status: "final" }],
  },
};

describe("laboratory adapters", () => {
  it("accepts the exact canonical version", () => {
    const result = parseLabPayload("canonical_json", Buffer.from(JSON.stringify(event)));
    expect(result.ok).toBe(true);
  });

  it("quarantines unknown fields that cannot form a complete event", () => {
    const result = parseLabPayload("canonical_json", Buffer.from('{"event_id":"evt"}'));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues[0]?.code).toBe("SCHEMA_VALIDATION_FAILED");
  });

  it("recognises HL7 and FHIR transports without guessing partner mappings", () => {
    const hl7 = parseLabPayload("hl7_v2", Buffer.from("MSH|^~\\&|LAB|\rOBR|1|"));
    const fhir = parseLabPayload("fhir", Buffer.from('{"resourceType":"Bundle","entry":[]}'));
    expect(hl7.ok).toBe(false);
    expect(fhir.ok).toBe(false);
    if (!hl7.ok) expect(hl7.issues[0]?.code).toBe("ADAPTER_CONFIGURATION_REQUIRED");
    if (!fhir.ok) expect(fhir.issues[0]?.code).toBe("ADAPTER_CONFIGURATION_REQUIRED");
  });
});
