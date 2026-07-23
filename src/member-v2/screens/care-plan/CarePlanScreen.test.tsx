// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CarePlanRow } from "../../../lib/api/carePlan";
import CarePlanScreen from "./CarePlanScreen";

const mocks = vi.hoisted(() => ({
  fetchCarePlan: vi.fn(),
  fetchCarePlanProgress: vi.fn(),
  setCarePlanActionProgress: vi.fn(),
  fetchDoctorProfile: vi.fn(),
}));

vi.mock("../../../lib/api/carePlan", async (importOriginal) => ({
  ...await importOriginal<typeof import("../../../lib/api/carePlan")>(),
  fetchCarePlan: mocks.fetchCarePlan,
  fetchCarePlanProgress: mocks.fetchCarePlanProgress,
  setCarePlanActionProgress: mocks.setCarePlanActionProgress,
}));

vi.mock("../../../lib/api/memberProfile", () => ({
  fetchDoctorProfile: mocks.fetchDoctorProfile,
}));

const releasedPlan: CarePlanRow = {
  id: "plan-1",
  member_id: "member-1",
  doctor_id: "doctor-1",
  title: "Your plan for the next 12 weeks",
  summary: null,
  status: "released",
  version: 2,
  released_at: "2026-07-23T00:00:00.000Z",
  review_date: "2026-10-15",
  ruleset_version: "2026.07.1",
  care_plan_sections: [{
    id: "focus-1",
    care_plan_id: "plan-1",
    sort_order: 0,
    title: "Cardiovascular health",
    summary: "ApoB suggests there are more cholesterol-carrying particles to address.",
    markers: ["Apolipoprotein B"],
    doctor_note: "Small, repeatable food changes are the best place to begin.",
    image_key: "heart",
    template_key: "cardiovascular-health",
    basis_type: "results",
    evidence_snapshot: [{
      biomarkerCode: "apob",
      displayName: "Apolipoprotein B",
      value: 1.24,
      unit: "g/L",
      status: "needs_attention",
      reportId: "00000000-0000-0000-0000-000000000001",
      collectedAt: "2026-07-01T00:00:00.000Z",
    }],
    profile_basis: [],
    actions: [{
      id: "action-1",
      title: "Add soluble fibre",
      lifestyleCategory: "Nutrition",
      instruction: "Include oats, beans, fruit, or seeds daily.",
      rationale: "Soluble fibre can support cholesterol management.",
      moreGuidance: "Choose one familiar meal and build from there.",
      sourceTemplateId: "fibre",
    }],
  }],
};

afterEach(cleanup);
beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.fetchCarePlan.mockResolvedValue({ data: releasedPlan, error: null });
  mocks.fetchCarePlanProgress.mockResolvedValue({ data: { "action-1": false }, error: null });
  mocks.setCarePlanActionProgress.mockResolvedValue({ error: null });
  mocks.fetchDoctorProfile.mockResolvedValue({
    data: { full_name: "Dr Lim", avatar_url: "/doctor.png" },
    error: null,
  });
  window.print = vi.fn();
});

describe("CarePlanScreen", () => {
  it("mirrors the agreed focus-area story and links its evidence to results", async () => {
    const onNav = vi.fn();
    render(<CarePlanScreen onNav={onNav} />);

    expect(await screen.findByRole("heading", { name: "Cardiovascular health" })).toBeTruthy();
    expect(screen.getByText("Apolipoprotein B")).toBeTruthy();
    expect(screen.getByText("1.24 g/L")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Your agreed actions" })).toBeTruthy();
    expect(screen.queryByText(/weekly protocol/i)).toBeNull();

    fireEvent.click(screen.getByTitle("See Apolipoprotein B in your results"));
    expect(onNav).toHaveBeenCalledWith("results");
    fireEvent.click(screen.getByRole("button", { name: "Download plan" }));
    expect(window.print).toHaveBeenCalled();
  });

  it("persists an action check-off against the released plan version", async () => {
    render(<CarePlanScreen onNav={vi.fn()} />);
    const checkbox = await screen.findByRole("checkbox", { name: /Mark "Add soluble fibre" as done/i });

    fireEvent.click(checkbox);

    expect(checkbox.getAttribute("aria-checked")).toBe("true");
    await waitFor(() => {
      expect(mocks.setCarePlanActionProgress).toHaveBeenCalledWith("plan-1", "action-1", true);
    });
  });
});
