// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Biomarker } from "../member-v2/screens/results/types";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import PanelBuilder from "./PanelBuilder";

const mocks = vi.hoisted(() => ({
  fetchLabOrder: vi.fn(),
  saveLabOrder: vi.fn(),
}));

const biomarkers = Array.from({ length: 103 }, (_, index): Biomarker => ({
  id: `marker-${index + 1}`,
  name: `Marker ${index + 1}`,
  displayName: `Marker ${index + 1}`,
  category: "Core",
  categories: ["Core"],
  aliases: [],
  description: "",
  whatItMeasures: "",
  whyItMatters: "",
  unit: "",
  scoringMode: "THREE_TIER",
  contextRequirements: [],
  optimalRangeLabel: "",
  suboptimalRangeLabel: "",
  outOfRangeLabel: "",
  lowerOptimal: null,
  upperOptimal: null,
  lowerReference: null,
  upperReference: null,
  directionality: "range_based",
  status: "not_available",
  latestValue: null,
  latestDate: null,
  historicalValues: [],
}));

const markerIds = biomarkers.map((marker) => marker.id);
const riskAreas = [
  ["cardiovascular-risk", "Cardiovascular Risk", 0, 20],
  ["metabolic-health", "Metabolic Health", 15, 35],
  ["blood-inflammation-immunity", "Blood, Inflammation & Immunity", 35, 50],
  ["kidney-urinary-health", "Kidney & Urinary Health", 50, 68],
  ["liver-digestive-health", "Liver & Digestive Health", 68, 80],
  ["thyroid-hormones-ageing", "Thyroid, Hormones & Ageing", 80, 90],
  ["nutrients-bone-health", "Nutrients & Bone Health", 90, 95],
  ["infectious-disease-screening", "Infectious Disease Screening", 95, 100],
  ["life-stage-risk", "Life Stage Risk", 100, 103],
].map(([id, name, start, end]) => ({
  id: id as string,
  name: name as string,
  description: "",
  biomarkerIds: markerIds.slice(start as number, end as number),
}));

const catalog = {
  categories: [{ name: "Core", description: "", biomarkerIds: biomarkers.map((marker) => marker.id) }],
  riskAreas,
  biomarkers,
  byCode: new Map(biomarkers.map((marker) => [marker.id, marker])),
  retiredCodes: new Set<string>(),
};

vi.mock("../lib/api/catalog", () => ({
  useBiomarkerCatalog: () => ({
    loading: false,
    error: null,
    catalog,
  }),
}));

vi.mock("../lib/api/labOrder", () => ({
  fetchLabOrder: mocks.fetchLabOrder,
  saveLabOrder: mocks.saveLabOrder,
}));

const detail = {
  memberName: "Amina Tan",
  memberEmail: "amina@example.com",
  age: 42,
  sex: "Female",
  stage: "consult_upcoming",
  onboarding: {},
  documents: [],
  hasResults: false,
  results: { releasedReportCount: 0, measuredMarkerCount: 0 },
  labOrder: null,
  carePlan: null,
  appointment: null,
} satisfies DoctorCaseDetail;

const quote = {
  pricingVersion: 1,
  currency: "MYR" as const,
  catalogCount: 103,
  selectedCount: 103,
  baseAmountMinor: 140_000,
  personalizationDiscountMinor: 0,
  foundingDiscountMinor: 20_000,
  isFoundingMember: true,
  totalAmountMinor: 120_000,
  quotedAt: "2026-07-21T10:00:00.000Z",
};

function advancedBaselineButton(): HTMLButtonElement {
  const button = document.querySelector<HTMLButtonElement>(".pb-panel-baseline");
  if (!button) throw new Error("Advanced Baseline button was not rendered");
  return button;
}

afterEach(cleanup);

beforeEach(() => {
  mocks.fetchLabOrder.mockReset();
  mocks.saveLabOrder.mockReset();
  mocks.fetchLabOrder.mockResolvedValue({ data: null, error: null });
});

describe("PanelBuilder pricing flow", () => {
  it("starts a new panel with all 103 active biomarkers selected", async () => {
    const view = render(<PanelBuilder memberId="member-1" detail={detail} onBack={vi.fn()} onSaved={vi.fn()} />);

    await waitFor(() => expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("103 markers selected"));
    expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("0 omitted");
    expect(advancedBaselineButton().getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: /Cardiovascular Risk/ }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Restore Advanced Baseline" })).toBeTruthy();

    fireEvent.click(advancedBaselineButton());
    await waitFor(() => expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("0 markers selected"));
    expect(advancedBaselineButton().getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(advancedBaselineButton());
    await waitFor(() => expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("103 markers selected"));
    expect(advancedBaselineButton().getAttribute("aria-pressed")).toBe("true");
  });

  it("preserves an existing saved panel instead of restoring all markers", async () => {
    mocks.fetchLabOrder.mockResolvedValue({
      data: { member_id: "member-1", biomarker_codes: ["marker-1", "marker-2"], status: "ordered", ordered_at: null, quote: null },
      error: null,
    });
    const view = render(<PanelBuilder memberId="member-1" detail={detail} onBack={vi.fn()} onSaved={vi.fn()} />);

    await waitFor(() => expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("2 markers selected"));
    expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("101 omitted");
  });

  it("uses overlapping risk coverage and restores the complete baseline explicitly", async () => {
    const view = render(<PanelBuilder memberId="member-1" detail={detail} onBack={vi.fn()} onSaved={vi.fn()} />);

    await screen.findByRole("button", { name: /Cardiovascular Risk/ });
    fireEvent.click(screen.getByRole("button", { name: /Cardiovascular Risk/ }));

    await waitFor(() => expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("88 markers selected"));
    expect(advancedBaselineButton().getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: /Cardiovascular Risk/ }).getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: /Metabolic Health/ }).getAttribute("aria-pressed")).toBe("true");

    fireEvent.click(advancedBaselineButton());
    await waitFor(() => expect(view.container.querySelector(".pb-footer-count")?.textContent).toContain("103 markers selected"));
    expect(advancedBaselineButton().getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the member-facing quote after save without exposing counts or formula", async () => {
    mocks.saveLabOrder.mockResolvedValue({
      data: {
        member_id: "member-1",
        biomarker_codes: biomarkers.map((marker) => marker.id),
        status: "ordered",
        ordered_at: quote.quotedAt,
        quote,
      },
      error: null,
    });
    render(<PanelBuilder memberId="member-1" detail={detail} onBack={vi.fn()} onSaved={vi.fn()} />);
    await screen.findByRole("button", { name: "Review panel" });

    fireEvent.click(screen.getByRole("button", { name: "Review panel" }));
    fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Confirm & save" }));

    const dialog = await screen.findByRole("dialog", { name: "Your personalized blood baseline" });
    expect(within(dialog).getByText("To share with the Verae member")).toBeTruthy();
    expect(within(dialog).getByText("RM 1,200")).toBeTruthy();
    expect(dialog.textContent).not.toContain("103 biomarkers");
    expect(dialog.textContent).not.toContain("RM20");
    expect(dialog.textContent).not.toContain("omitted");
  });
});
