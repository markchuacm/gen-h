import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  buildCarePlanDraft,
  CARE_PLAN_FOCUS_RULES,
  type CarePlanEvidence,
} from "./care-plan-engine.js";

function marker(
  biomarkerCode: string,
  status: CarePlanEvidence["status"],
  displayName = biomarkerCode,
): CarePlanEvidence {
  return {
    biomarkerCode,
    displayName,
    value: 1.2,
    unit: "mmol/L",
    status,
    reportId: "report-1",
    collectedAt: "2026-07-01T00:00:00.000Z",
  };
}

describe("care-plan engine", () => {
  it("ranks needs-attention focus areas ahead of at-risk areas", () => {
    const draft = buildCarePlanDraft({
      biomarkers: [
        marker("apolipoprotein-b-apob", "at_risk", "Apolipoprotein B"),
        marker("hemoglobin-a1c-hba1c", "needs_attention", "Hemoglobin A1c"),
      ],
      profile: {},
    });
    expect(draft.sections[0]?.templateKey).toBe("glucose-stability");
    expect(draft.sections).toHaveLength(3);
  });

  it("uses clinical priority as the deterministic tie-breaker", () => {
    const draft = buildCarePlanDraft({
      biomarkers: [
        marker("ldl-cholesterol", "at_risk"),
        marker("vitamin-d", "at_risk"),
      ],
      profile: {},
    });
    expect(draft.sections.slice(0, 2).map((section) => section.templateKey)).toEqual([
      "cardiovascular-health",
      "nutrient-status",
    ]);
  });

  it("fills a short clinical plan to three with profile-matched prevention", () => {
    const draft = buildCarePlanDraft({
      biomarkers: [marker("ldl-cholesterol", "at_risk")],
      profile: { goals: ["Improve sleep", "Fitness / performance"] },
    });
    expect(draft.sections).toHaveLength(3);
    expect(draft.sections.map((section) => section.templateKey)).toContain("sleep-recovery");
    expect(draft.sections.map((section) => section.templateKey)).toContain("movement-foundations");
  });

  it("creates a prevention plan when every measured result is optimal", () => {
    const draft = buildCarePlanDraft({
      biomarkers: [marker("glucose", "optimal")],
      profile: { lifestyle: { sleepHours: 5 }, goals: ["Body composition"] },
    });
    expect(draft.mode).toBe("prevention");
    expect(draft.sections).toHaveLength(3);
    expect(draft.sections.every((section) => section.basisType === "prevention")).toBe(true);
  });

  it("filters explicitly contraindicated action variants", () => {
    const draft = buildCarePlanDraft({
      biomarkers: [marker("vitamin-d", "needs_attention")],
      profile: { conditionsOther: "Previous vitamin D toxicity" },
    });
    const nutrients = draft.sections.find((section) => section.templateKey === "nutrient-status");
    expect(nutrients?.proposedActions.some((candidate) => candidate.templateId === "vitamin-d")).toBe(false);
  });

  it("keeps stable focus and action identifiers across runs", () => {
    const input = { biomarkers: [marker("glucose", "at_risk")], profile: {} };
    expect(buildCarePlanDraft(input)).toEqual(buildCarePlanDraft(input));
  });

  it("ships at least three eligible approved actions per focus rule", () => {
    for (const rule of CARE_PLAN_FOCUS_RULES) expect(rule.actions.length).toBeGreaterThanOrEqual(3);
  });

  it("references active catalog biomarkers and has stable unique keys", () => {
    const catalogPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../../seeds/biomarker-catalog.json",
    );
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8")) as {
      biomarkers: Array<{ id: string; isActive: boolean }>;
    };
    const activeIds = new Set(
      catalog.biomarkers.filter((item) => item.isActive).map((item) => item.id),
    );
    const focusIds = CARE_PLAN_FOCUS_RULES.map((rule) => rule.id);

    expect(new Set(focusIds).size).toBe(focusIds.length);
    for (const rule of CARE_PLAN_FOCUS_RULES) {
      expect(rule.biomarkerCodes.filter((code) => !activeIds.has(code))).toEqual([]);
      expect(new Set(rule.actions.map((candidate) => candidate.id)).size).toBe(rule.actions.length);
      for (const candidate of rule.actions) {
        if (candidate.lifestyleCategory === "Supplements") {
          expect(candidate.safetyNote?.trim()).toBeTruthy();
        }
      }
    }
  });
});
