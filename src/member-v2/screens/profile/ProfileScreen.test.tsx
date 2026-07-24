// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileScreen from "./ProfileScreen";

vi.mock("../../../auth/AuthProvider", () => ({
  useAuth: () => ({
    profile: { id: "member-a", full_name: "Account Name", consent_name: "Amina Burhanuddin Helmi Binti Mohammad Baktiar" },
    signOut: vi.fn(),
  }),
}));

vi.mock("../../../lib/api/memberProfile", () => ({
  fetchOnboardingResponses: vi.fn().mockResolvedValue({ data: null, error: null }),
  upsertOnboardingResponses: vi.fn().mockResolvedValue({ error: null }),
  completeOnboarding: vi.fn().mockResolvedValue({ error: null }),
  updateMemberIdentity: vi.fn().mockResolvedValue({ error: null }),
}));

vi.mock("../../../lib/api/healthDocuments", () => ({
  removeHealthDocument: vi.fn(),
  uploadHealthDocument: vi.fn(),
  validateHealthFile: vi.fn().mockReturnValue(null),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("ProfileScreen", () => {
  it("fills the full name field from sign-up immediately, without waiting on the profile fetch", async () => {
    render(
      <ProfileScreen
        flowOpen={false}
        onFlowOpenChange={vi.fn()}
        onCompleted={vi.fn()}
        onExitIncomplete={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Start" }));

    const input = (await screen.findByLabelText(
      "Full name (as per IC / Passport)",
    )) as HTMLInputElement;
    await waitFor(() => expect(input.value).toBe("Amina Burhanuddin Helmi Binti Mohammad Baktiar"));
    expect(document.activeElement).not.toBe(input);
  });

  it("pre-fills the preferred-name field with the first name, unfocused, on the basics step", async () => {
    render(
      <ProfileScreen
        flowOpen={false}
        onFlowOpenChange={vi.fn()}
        onCompleted={vi.fn()}
        onExitIncomplete={vi.fn()}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Start" }));

    fireEvent.change(screen.getByLabelText("IC / passport number"), { target: { value: "900101145566" } });
    fireEvent.change(screen.getByLabelText("Address"), { target: { value: "12 Jalan Setiabakti" } });
    fireEvent.change(screen.getByLabelText("Phone"), { target: { value: "0173280063" } });
    expect((screen.getByLabelText("Date of birth") as HTMLInputElement).value).toBe("01/01/1990");
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement).disabled).toBe(false),
    );
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    const preferredName = (await screen.findByLabelText("Preferred name")) as HTMLInputElement;
    expect(preferredName.value).toBe("Amina");
    expect(document.activeElement).not.toBe(preferredName);
  });
});
