/* Dev-only visual harness for the guided care-plan flow — the doctor's
   preparation / consultation / review modes and the member's released plan.
   Served at /care-plan-preview.html; never linked from the app. Network calls
   are stubbed in-page so no API or database is needed. */
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "../member-v2/tokens.css";
import "../member-v2/shell/shell.css";
import "../doctor/doctor.css";
import CarePlanEditor from "../doctor/CarePlanEditor";
import CarePlanScreen from "../member-v2/screens/care-plan/CarePlanScreen";
import { FOCUS_AREA_TEMPLATES } from "../doctor/carePlanLibrary";

const PLAN_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_ID = "22222222-2222-4222-8222-222222222222";

const evidence = {
  cardiovascular: [
    { biomarkerCode: "APOB", displayName: "Apolipoprotein B", value: 1.28, unit: "g/L", status: "needs_attention", reportId: "r1", collectedAt: "2026-07-02" },
    { biomarkerCode: "LDL", displayName: "LDL Cholesterol", value: 4.4, unit: "mmol/L", status: "at_risk", reportId: "r1", collectedAt: "2026-07-02" },
    { biomarkerCode: "HSCRP", displayName: "hs-CRP", value: 3.1, unit: "mg/L", status: "at_risk", reportId: "r1", collectedAt: "2026-07-02" },
  ],
  metabolic: [
    { biomarkerCode: "HBA1C", displayName: "Hemoglobin A1c", value: 5.9, unit: "%", status: "at_risk", reportId: "r1", collectedAt: "2026-07-02" },
    { biomarkerCode: "INSULIN", displayName: "Insulin", value: 14.2, unit: "µIU/mL", status: "at_risk", reportId: "r1", collectedAt: "2026-07-02" },
  ],
  "energy-thyroid": [
    { biomarkerCode: "FERRITIN", displayName: "Ferritin", value: 18, unit: "µg/L", status: "needs_attention", reportId: "r1", collectedAt: "2026-07-02" },
    { biomarkerCode: "VITD", displayName: "Vitamin D", value: 42, unit: "nmol/L", status: "at_risk", reportId: "r1", collectedAt: "2026-07-02" },
  ],
} as const;

function sectionFrom(templateId: keyof typeof evidence | "sleep", order: number, selected: number[]) {
  const template = FOCUS_AREA_TEMPLATES.find((item) => item.id === templateId)!;
  const proposed = template.actions.map((action, index) => ({
    ...action,
    id: `${template.id}-a${index}`,
    templateId: `${template.id}-${index + 1}`,
    doctorRecommended: index === 0,
  }));
  return {
    id: `sec-${template.id}`,
    care_plan_id: PLAN_ID,
    sort_order: order,
    title: template.title,
    summary: template.summary,
    markers: [...template.markers],
    doctor_note: template.doctorNote,
    image_key: template.imageKey,
    template_key: template.id,
    basis_type: templateId === "sleep" ? "prevention" : "results",
    section_state: "active",
    defer_reason: null,
    evidence_snapshot: templateId === "sleep" ? [] : [...(evidence[templateId] ?? [])],
    profile_basis: templateId === "sleep"
      ? ["Sleeps under 6 hours on weeknights", "Wants more daytime energy", "Screen time late at night"]
      : [],
    proposed_actions: proposed,
    actions: selected.map((index) => ({
      ...proposed[index],
      sourceTemplateId: proposed[index].templateId,
      clinicianConfirmed: proposed[index].lifestyleCategory !== "Supplements",
    })),
  };
}

function plan(selected: boolean) {
  return {
    id: PLAN_ID,
    member_id: MEMBER_ID,
    doctor_id: "33333333-3333-4333-8333-333333333333",
    title: "Your plan for the next 12 weeks",
    summary: null,
    status: "draft",
    version: 1,
    released_at: null,
    review_date: "2026-10-16",
    ruleset_version: "v1.0.0",
    generation_mode: "results",
    generation_status: "ready",
    source_report_ids: ["r1"],
    evidence_stale: false,
    draft_revision: 4,
    care_plan_sections: [
      sectionFrom("cardiovascular", 0, selected ? [0, 2] : []),
      sectionFrom("metabolic", 1, selected ? [1] : []),
      sectionFrom("energy-thyroid", 2, selected ? [0, 2] : []),
      sectionFrom("sleep", 3, selected ? [0] : []),
    ],
  };
}

const params = new URLSearchParams(window.location.search);
const withSelections = params.get("selected") !== "0";
const released = params.get("view") === "member" || params.get("released") === "1";

const realFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const json = (body: unknown) =>
    new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
  if (url.includes("/v1/doctor/care-plans")) {
    if (url.endsWith("/sections")) return json({ ok: true, revision: 5 });
    if (params.get("state") === "empty") return json({ data: null });
    return json({
      data: {
        ...plan(withSelections),
        status: released ? "released" : "draft",
        evidence_stale: params.get("stale") === "1",
      },
    });
  }
  if (url.includes("/v1/member/care-plans")) {
    if (url.includes("/progress")) return json({ data: { "cardiovascular-a0": true, "metabolic-a1": true } });
    return json({ data: { ...plan(true), status: "released", released_at: new Date().toISOString() } });
  }
  if (url.includes("/public")) {
    return json({ data: { full_name: "Dr. Farheen Nafisa", avatar_url: null } });
  }
  return realFetch(input as RequestInfo, init);
};

function Harness() {
  const [view, setView] = useState(params.get("view") ?? "doctor");
  return (
    <>
      {/* Top-right, not bottom: the product's own mobile mode switch is fixed to
          the bottom of the viewport, and harness chrome must never sit on top of
          the thing being checked. */}
      <div style={{
        position: "fixed", right: 12, top: 12, zIndex: 999, display: "flex", gap: 6,
        padding: 5, borderRadius: 999, background: "rgba(17,24,39,0.82)",
        backdropFilter: "blur(8px)", color: "#fff", fontSize: 12,
      }}>
        {["doctor", "member"].map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setView(option)}
            style={{
              padding: "5px 12px", borderRadius: 999, color: "#fff",
              background: view === option ? "rgba(255,255,255,0.22)" : "transparent",
            }}
          >
            {option}
          </button>
        ))}
      </div>
      {view === "doctor"
        ? <CarePlanEditor memberId={MEMBER_ID} memberName="Aisyah Rahman" onBack={() => {}} />
        : <CarePlanScreen onNav={() => {}} />}
    </>
  );
}

// Reuse the root across hot reloads; calling createRoot again on the same
// container warns on every edit and buries real console output.
const container = document.getElementById("root")! as HTMLElement & {
  _root?: ReturnType<typeof createRoot>;
};
container._root ??= createRoot(container);
container._root.render(<StrictMode><Harness /></StrictMode>);
