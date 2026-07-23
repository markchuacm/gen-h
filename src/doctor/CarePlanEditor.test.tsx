// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CarePlanEditor from "./CarePlanEditor";

const mocks = vi.hoisted(() => ({
  fetchEditablePlan: vi.fn(),
  savePlanSections: vi.fn(),
  releaseCarePlan: vi.fn(),
  regenerateCarePlan: vi.fn(),
  createPlanVersion: vi.fn(),
}));

vi.mock("../lib/api/doctor", async (importOriginal) => ({
  ...await importOriginal<typeof import("../lib/api/doctor")>(),
  ...mocks,
}));

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.fetchEditablePlan.mockResolvedValue({
    data: {
      id: "plan-1",
      title: "Your plan for the next 12 weeks",
      summary: null,
      status: "draft",
      version: 1,
      ruleset_version: "2026.07.1",
      generation_mode: "results",
      generation_status: "ready",
      source_report_ids: ["00000000-0000-0000-0000-000000000001"],
      review_date: "2026-10-15",
      evidence_stale: false,
      draft_revision: 0,
      care_plan_sections: [{
        id: "section-1",
        sort_order: 0,
        title: "Nutrient status",
        summary: "Vitamin D is below the target range.",
        markers: ["Vitamin D"],
        doctor_note: "",
        image_key: "nutrition",
        actions: [],
        template_key: "nutrient-status",
        basis_type: "results",
        section_state: "active",
        defer_reason: null,
        evidence_snapshot: [{
          biomarkerCode: "vitamin-d",
          displayName: "Vitamin D",
          value: 18,
          unit: "ng/mL",
          status: "needs_attention",
          reportId: "00000000-0000-0000-0000-000000000001",
          collectedAt: "2026-07-01T00:00:00.000Z",
        }],
        profile_basis: [],
        proposed_actions: [{
          id: "vitamin-d-action",
          templateId: "vitamin-d",
          title: "Use a reviewed vitamin D supplement",
          lifestyleCategory: "Supplements",
          instruction: "Take the dose agreed with your doctor.",
          rationale: "A reviewed supplement can help restore vitamin D.",
          moreGuidance: "Take it consistently and recheck as advised.",
          doctorRecommended: true,
          safetyNote: "Review current medications, dose, and follow-up.",
        }],
      }],
    },
    error: null,
  });
  mocks.savePlanSections.mockResolvedValue({ revision: 1, error: null, code: null });
});

afterEach(cleanup);

describe("CarePlanEditor consultation", () => {
  it("does not mark an untouched generated draft as doctor-edited", async () => {
    render(
      <CarePlanEditor
        memberId="member-1"
        memberName="Amina Tan"
        onBack={vi.fn()}
      />,
    );

    await screen.findByRole("button", { name: /Start consultation mode/i });
    await new Promise((resolve) => window.setTimeout(resolve, 1_000));

    expect(mocks.savePlanSections).not.toHaveBeenCalled();
  });

  it("keeps suggestions unselected and blocks a supplement until the clinician confirms it", async () => {
    render(
      <CarePlanEditor
        memberId="member-1"
        memberName="Amina Tan"
        onBack={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: /Start consultation mode/i }));
    const supplement = screen.getByRole("button", { name: /Use a reviewed vitamin D supplement/i });
    expect(supplement.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(supplement);
    expect(supplement.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /Review the plan/i }));
    expect(screen.getByText(/Choose at least one action, or defer/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: /Clinician safety check/i }));
    fireEvent.click(screen.getByRole("button", { name: /Review the plan/i }));

    expect(await screen.findByRole("heading", { name: "Your plan for the next 12 weeks" })).toBeTruthy();
    expect(screen.getByLabelText("Clinician confirmed")).toBeTruthy();
  });
});
