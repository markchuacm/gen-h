import { describe, expect, it } from "vitest";
import {
  validateCarePlanForRelease,
  type CarePlanReleaseSection,
} from "./care-plan-validation.js";

function section(
  overrides: Partial<CarePlanReleaseSection> = {},
): CarePlanReleaseSection {
  return {
    title: "Cardiovascular health",
    basisType: "results",
    state: "active",
    deferReason: null,
    actions: [{
      title: "Build a fibre-rich breakfast",
      instruction: "Add oats, fruit, or seeds on five mornings each week.",
      lifestyleCategory: "Nutrition",
    }],
    ...overrides,
  };
}

describe("care-plan release validation", () => {
  it("accepts a complete active plan", () => {
    expect(validateCarePlanForRelease({
      exists: true,
      status: "draft",
      evidenceStale: false,
      sections: [section()],
    })).toEqual([]);
  });

  it("blocks stale evidence and unresolved focus areas", () => {
    const issues = validateCarePlanForRelease({
      exists: true,
      status: "draft",
      evidenceStale: true,
      sections: [section({ actions: [] })],
    });
    expect(issues.map((issue) => issue.path)).toEqual([
      "plan.evidence",
      "sections.0.actions",
    ]);
  });

  it("requires a private reason when an area is deferred", () => {
    expect(validateCarePlanForRelease({
      exists: true,
      status: "draft",
      evidenceStale: false,
      sections: [section({ state: "deferred", deferReason: " " })],
    })[0]?.path).toBe("sections.0.deferReason");
  });

  it("requires supplement confirmation for guided plans", () => {
    const supplement = section().actions[0]!;
    const issues = validateCarePlanForRelease({
      exists: true,
      status: "draft",
      evidenceStale: false,
      sections: [section({
        actions: [{ ...supplement, lifestyleCategory: "Supplements" }],
      })],
    });
    expect(issues[0]?.path).toBe("sections.0.actions.0.clinicianConfirmed");
  });

  it("keeps legacy supplement plans releasable", () => {
    const supplement = section().actions[0]!;
    expect(validateCarePlanForRelease({
      exists: true,
      status: "draft",
      evidenceStale: false,
      sections: [section({
        basisType: "legacy",
        actions: [{ ...supplement, lifestyleCategory: "Supplements" }],
      })],
    })).toEqual([]);
  });
});
