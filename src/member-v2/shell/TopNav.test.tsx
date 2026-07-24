// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import TopNav from "./TopNav";

const auth = vi.hoisted(() => ({ signOut: vi.fn() }));

vi.mock("../../auth/AuthProvider", () => ({
  useAuth: () => ({
    profile: { email: "member@example.com", full_name: "Mark Chua" },
    session: null,
    signOut: auth.signOut,
  }),
}));

afterEach(() => {
  cleanup();
  auth.signOut.mockReset();
});

function renderNav(onNav = vi.fn()) {
  return {
    onNav,
    ...render(
      <TopNav
        activeTab="results"
        onNav={onNav}
        journeyState="RESULTS_READY"
        onJourneyStateChange={vi.fn()}
        onOpenAccountDetails={vi.fn()}
      />,
    ),
  };
}

describe("TopNav", () => {
  it("shows labeled tabs and identifies the active page", () => {
    const { onNav } = renderNav();

    expect(screen.getByRole("button", { name: "Home" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Profile" })).toBeNull();
    expect(screen.getByRole("button", { name: "Results" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Care plan" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Results" }).textContent).toBe("Results");
    expect(screen.getByText("Results").classList.contains("p-nav-tab-label")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Home" }));
    expect(onNav).toHaveBeenCalledWith("home");
  });

  it("opens the email account menu and signs out", () => {
    renderNav();

    fireEvent.click(screen.getByRole("button", { name: "Open account menu" }));
    expect(screen.getByRole("menu")).toBeTruthy();
    expect(screen.getByText("MC")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Account" })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Profile" })).toBeTruthy();
    expect(screen.getByText("member@example.com")).toBeTruthy();

    fireEvent.click(screen.getByRole("menuitem", { name: "Sign out" }));
    expect(auth.signOut).toHaveBeenCalledOnce();
  });

  it("closes the account menu on Escape and restores trigger focus", () => {
    renderNav();
    const trigger = screen.getByRole("button", { name: "Open account menu" });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("opens the mobile navigation drawer and navigates from its labeled links", () => {
    const { onNav } = renderNav();
    const trigger = screen.getByRole("button", { name: "Open navigation" });

    fireEvent.click(trigger);

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    expect(onNav).toHaveBeenCalledWith("home");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes the mobile navigation drawer on Escape and restores trigger focus", () => {
    renderNav();
    const trigger = screen.getByRole("button", { name: "Open navigation" });

    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });
});
