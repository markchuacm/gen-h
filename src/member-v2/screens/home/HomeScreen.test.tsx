// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JOURNEY_STATES, JOURNEY_STATE_IDS } from "../../journey/journeyState";
import HomeScreen from "./HomeScreen";

afterEach(cleanup);

describe("HomeScreen detail journey", () => {
  it("starts with the hero and without the former home heading or journey rail", () => {
    const view = render(
      <HomeScreen
        config={JOURNEY_STATES.CONSULT_UPCOMING}
        onNav={vi.fn()}
        onStartProfile={vi.fn()}
      />,
    );

    expect(screen.queryByText("HOME")).toBeNull();
    expect(screen.queryByRole("heading", { name: /welcome/i })).toBeNull();
    expect(screen.queryByRole("list", { name: "Your Verae journey" })).toBeNull();
    expect(view.container.querySelector("main")?.classList.contains("home-page")).toBe(true);
  });

  it.each(JOURNEY_STATE_IDS)("opens the shared journey screen from the %s sub-CTA", (stateId) => {
    const config = JOURNEY_STATES[stateId];
    render(<HomeScreen config={config} onNav={vi.fn()} onStartProfile={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: config.hero.secondaryCta! }));
    fireEvent.click(screen.getByRole("button", { name: "View your Verae journey" }));

    expect(screen.getByRole("list", { name: "Your Verae journey" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "How the Verae health consult works" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Back to details" }));
    expect(
      within(screen.getByRole("dialog")).getByRole("heading", {
        name: /consult|blood draw|sample|care plan/i,
      }),
    ).toBeTruthy();
  });
});
