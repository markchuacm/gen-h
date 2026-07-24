// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DoctorCaseNav from "./DoctorCaseNav";

const auth = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    profile: { full_name: "Dr. Farheen Nafisa", email: "doctor@example.com" },
    session: null,
    signOut: auth.signOut,
  }),
}));

afterEach(() => {
  cleanup();
  auth.signOut.mockReset();
});

describe("DoctorCaseNav", () => {
  it("exposes the case workflow and marks the current view", () => {
    const onNav = vi.fn();
    render(<DoctorCaseNav activeView="results" onNav={onNav} />);

    expect(screen.getByRole("button", { name: "Home" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Brief" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Panel" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Results" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Careplan" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    fireEvent.click(screen.getByRole("button", { name: "Careplan" }));
    expect(onNav).toHaveBeenNthCalledWith(1, "home");
    expect(onNav).toHaveBeenNthCalledWith(2, "carePlan");
  });

  it("signs out from the right-side action", () => {
    render(<DoctorCaseNav activeView="brief" onNav={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalledOnce();
  });
});
