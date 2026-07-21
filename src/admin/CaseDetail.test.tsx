// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminCaseDetail } from "../lib/api/admin";
import CaseDetail from "./CaseDetail";

const mocks = vi.hoisted(() => ({
  fetchAdminCaseDetail: vi.fn(),
  fetchAdminLabReports: vi.fn(),
  fetchAdminAppointment: vi.fn(),
  fetchAdminDoctors: vi.fn(),
  setFoundingMember: vi.fn(),
  clipboardWrite: vi.fn(),
}));

vi.mock("../lib/api/admin", () => ({
  assignDoctor: vi.fn(),
  cancelAppointment: vi.fn(),
  deactivateAssignment: vi.fn(),
  fetchAdminAppointment: mocks.fetchAdminAppointment,
  fetchAdminCaseDetail: mocks.fetchAdminCaseDetail,
  fetchAdminDoctors: mocks.fetchAdminDoctors,
  fetchAdminLabReports: mocks.fetchAdminLabReports,
  resetInvite: vi.fn(),
  scheduleAppointment: vi.fn(),
  setFoundingMember: mocks.setFoundingMember,
  setStage: vi.fn(),
  uploadDocumentForMember: vi.fn(),
  STAGE_OPTIONS: ["consult_upcoming", "blood_form_ready"],
  STAGE_LABELS: { consult_upcoming: "Consult upcoming", blood_form_ready: "Blood draw" },
}));

vi.mock("../lib/api/healthDocuments", () => ({ createDocumentSignedUrl: vi.fn() }));
vi.mock("./LabResultsSection", () => ({ default: () => <div data-testid="lab-results" /> }));
vi.mock("./CaseTimeline", () => ({ default: () => <div data-testid="case-timeline" /> }));

const quote = {
  pricingVersion: 1,
  currency: "MYR" as const,
  catalogCount: 103,
  selectedCount: 97,
  baseAmountMinor: 140_000,
  personalizationDiscountMinor: 12_000,
  foundingDiscountMinor: 20_000,
  isFoundingMember: true,
  totalAmountMinor: 108_000,
  quotedAt: "2026-07-21T10:00:00.000Z",
};

const detail: AdminCaseDetail = {
  memberName: "Amina Tan",
  memberEmail: "amina@example.com",
  accountStatus: "active",
  age: 42,
  sex: "Female",
  heightCm: 165,
  weightKg: 60,
  goals: null,
  medications: null,
  conditions: null,
  preferredName: "Amina",
  currentStage: "blood_form_ready",
  onboardingStatus: "completed",
  phone: "+60123456789",
  invitedAt: null,
  tempPasswordExpiresAt: null,
  setupCompletedAt: "2026-07-01T00:00:00.000Z",
  isFoundingMember: true,
  onboarding: {},
  documents: [],
  doctorId: null,
  doctorName: null,
  carePlan: null,
  labOrder: {
    biomarkerCodes: Array.from({ length: 97 }, (_, index) => `marker-${index + 1}`),
    status: "ordered",
    orderedAt: quote.quotedAt,
    quote,
  },
};

afterEach(cleanup);

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.fetchAdminCaseDetail.mockResolvedValue({ data: detail, error: null });
  mocks.fetchAdminLabReports.mockResolvedValue({ data: [], error: null });
  mocks.fetchAdminAppointment.mockResolvedValue({ data: null, error: null });
  mocks.fetchAdminDoctors.mockResolvedValue({ data: [], error: null });
  mocks.setFoundingMember.mockResolvedValue({ error: null });
  mocks.clipboardWrite.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: mocks.clipboardWrite },
  });
});

describe("admin saved quote operations", () => {
  it("shows the stored snapshot and copies the amount and member summary", async () => {
    render(<CaseDetail memberId="member-1" onBack={vi.fn()} />);

    expect(await screen.findByRole("heading", { name: "Blood panel quote" })).toBeTruthy();
    expect(screen.getByText("97")).toBeTruthy();
    expect(screen.getByText(/1,080/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Copy amount" }));
    await waitFor(() => expect(mocks.clipboardWrite).toHaveBeenCalledWith("1080.00"));

    fireEvent.click(screen.getByRole("button", { name: "Copy member summary" }));
    await waitFor(() => expect(mocks.clipboardWrite.mock.calls.at(-1)?.[0]).toContain("Advanced Blood Baseline"));
    expect(mocks.clipboardWrite.mock.calls.at(-1)?.[0]).toContain("Total");
  });

  it("updates future founding eligibility without changing the rendered saved snapshot", async () => {
    render(<CaseDetail memberId="member-1" onBack={vi.fn()} />);
    const membership = await screen.findByRole("switch", { name: "Founding member" });

    fireEvent.click(membership);
    await waitFor(() => expect(mocks.setFoundingMember).toHaveBeenCalledWith("member-1", false));
    expect(screen.getByText("Eligibility snapshot").parentElement?.textContent).toContain("Founding");
  });

  it("explains how an older unquoted order gains pricing", async () => {
    mocks.fetchAdminCaseDetail.mockResolvedValue({
      data: { ...detail, labOrder: { ...detail.labOrder!, quote: null } },
      error: null,
    });
    render(<CaseDetail memberId="member-1" onBack={vi.fn()} />);

    expect(await screen.findByText("This panel predates saved pricing.")).toBeTruthy();
    expect(screen.getByText(/doctor reviews and saves the panel again/i)).toBeTruthy();
  });
});
