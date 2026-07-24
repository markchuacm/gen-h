// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StepConsent from "./StepConsent";

const { acceptConsent } = vi.hoisted(() => ({
  acceptConsent: vi.fn(),
}));

vi.mock("./api", () => ({ acceptConsent }));

describe("invited-member consent", () => {
  afterEach(cleanup);

  beforeEach(() => {
    acceptConsent.mockReset().mockResolvedValue(undefined);
  });

  it("shows separate legal acknowledgements and all policy links", async () => {
    const onDone = vi.fn().mockResolvedValue(undefined);
    render(<StepConsent onDone={onDone} />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "Terms of Service" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Informed Consent Policy" })).toBeTruthy();

    for (const checkbox of screen.getAllByRole("checkbox")) fireEvent.click(checkbox);
    fireEvent.change(screen.getByPlaceholderText("Full name as per ID"), { target: { value: "aMiNa mEMBER" } });
    fireEvent.click(screen.getByRole("button", { name: "Agree and continue" }));

    await waitFor(() => expect(acceptConsent).toHaveBeenCalledWith("Amina Member"));
    expect(onDone).toHaveBeenCalledOnce();
  });
});
