// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JOURNEY_STATES, JOURNEY_STATE_IDS } from "../../journey/journeyState";
import HomeScreen from "./HomeScreen";

const mocks = vi.hoisted(() => ({
  fetchBloodForm: vi.fn(),
  downloadBloodFormPdf: vi.fn(),
  updateMemberIdentity: vi.fn(),
}));

vi.mock("../../../lib/bloodForm/api", () => ({
  fetchBloodForm: mocks.fetchBloodForm,
  downloadBloodFormPdf: mocks.downloadBloodFormPdf,
}));

vi.mock("../../../lib/api/memberProfile", () => ({
  updateMemberIdentity: mocks.updateMemberIdentity,
}));

const readyPayload = {
  patient: {
    fullName: "Nurul Aisyah",
    icPassportNo: "900215145678",
    dateOfBirth: "1990-02-15",
    age: 36,
    sex: "female",
    address: "12 Jalan Setiabakti",
    phone: "0123456789",
  },
  order: { clientOrderId: "abc123", orderedAt: null, formReleasedAt: "2026-07-22T00:00:00Z", selectedCodes: [], omittedCodes: [] },
  missingFields: [] as string[],
};

afterEach(cleanup);
beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
});

describe("HomeScreen detail journey", () => {
  it("starts with the hero and the journey overview card", () => {
    const view = render(
      <HomeScreen
        config={JOURNEY_STATES.CONSULT_UPCOMING}
        onNav={vi.fn()}
        onStartProfile={vi.fn()}
      />,
    );

    expect(screen.queryByText("HOME")).toBeNull();
    expect(screen.queryByRole("heading", { name: /welcome/i })).toBeNull();
    expect(screen.getByRole("heading", { name: "Your Verae Journey" })).toBeTruthy();
    expect(screen.getByRole("list", { name: "Your Verae Journey stages" })).toBeTruthy();
    expect(view.container.querySelector("main")?.classList.contains("home-page")).toBe(true);
  });

  it.each(JOURNEY_STATE_IDS)("opens the shared journey screen from the %s sub-CTA", (stateId) => {
    const config = JOURNEY_STATES[stateId];
    render(<HomeScreen config={config} onNav={vi.fn()} onStartProfile={vi.fn()} />);

    expect(document.querySelector(".p-chip")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: config.hero.secondaryCta! }));
    if (!config.journeyOnly) {
      fireEvent.click(screen.getByRole("button", { name: "View your Verae journey" }));
    }

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Your Verae Journey" })).toBeTruthy();
    expect(within(dialog).getByRole("list", { name: "Your Verae Journey stages" })).toBeTruthy();
    expect(within(dialog).getByRole("heading", { name: "How it works" })).toBeTruthy();

    if (config.journeyOnly) {
      expect(screen.queryByRole("heading", { name: "Where your sample is" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Your care plan, at a glance" })).toBeNull();
    } else {
      fireEvent.click(screen.getByRole("button", { name: "Back to details" }));
      expect(
        within(screen.getByRole("dialog")).getByRole("heading", {
          name: /consult|blood draw|sample|care plan/i,
        }),
      ).toBeTruthy();
    }
  });
});

describe("HomeScreen blood-form download", () => {
  it("generates the PDF directly when all details are present", async () => {
    mocks.fetchBloodForm.mockResolvedValue({ data: readyPayload, error: null });
    render(<HomeScreen config={JOURNEY_STATES.BLOOD_FORM_READY} onNav={vi.fn()} onStartProfile={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Download form/i }));

    await waitFor(() => expect(mocks.downloadBloodFormPdf).toHaveBeenCalledWith(readyPayload));
    expect(screen.queryByRole("dialog", { name: "Confirm your details" })).toBeNull();
  });

  it("prompts to confirm details, saves them, then downloads", async () => {
    const missing = { ...readyPayload, patient: { ...readyPayload.patient, icPassportNo: null }, missingFields: ["IC / passport number"] };
    mocks.fetchBloodForm
      .mockResolvedValueOnce({ data: missing, error: null })
      .mockResolvedValueOnce({ data: readyPayload, error: null });
    mocks.updateMemberIdentity.mockResolvedValue({ data: readyPayload, error: null });

    render(<HomeScreen config={JOURNEY_STATES.BLOOD_FORM_READY} onNav={vi.fn()} onStartProfile={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: /Download form/i }));

    const dialog = await screen.findByRole("dialog", { name: "Confirm your details" });
    // The missing IC must be provided before the form can be saved.
    fireEvent.change(within(dialog).getByLabelText("IC / passport number"), {
      target: { value: "900215145678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save & download form" }));

    await waitFor(() => expect(mocks.updateMemberIdentity).toHaveBeenCalled());
    await waitFor(() => expect(mocks.downloadBloodFormPdf).toHaveBeenCalledWith(readyPayload));
  });
});
