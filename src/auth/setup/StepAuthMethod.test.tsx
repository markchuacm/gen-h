// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import StepAuthMethod from "./StepAuthMethod";

const { linkSocial, setSetupPassword } = vi.hoisted(() => ({
  linkSocial: vi.fn(),
  setSetupPassword: vi.fn(),
}));

vi.mock("../authClient", () => ({ authClient: { linkSocial } }));
vi.mock("../portalUrl", () => ({ portalUrl: () => "https://app-uat.veraehealth.com/member" }));
vi.mock("./api", () => ({ setSetupPassword }));

describe("invited-member password choice", () => {
  afterEach(cleanup);

  beforeEach(() => {
    linkSocial.mockReset().mockResolvedValue({ error: null });
    setSetupPassword.mockReset().mockResolvedValue(undefined);
  });

  it("keeps Google available without filling password fields", async () => {
    render(<StepAuthMethod onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    await waitFor(() => expect(linkSocial).toHaveBeenCalledOnce());
  });

  it("blocks a matching short password before the API request", async () => {
    render(<StepAuthMethod onDone={vi.fn()} />);
    const fields = screen.getAllByLabelText(/password/i);
    fireEvent.change(fields[0], { target: { value: "short" } });
    fireEvent.change(fields[1], { target: { value: "short" } });
    fireEvent.submit(screen.getByRole("button", { name: "Set password and continue" }).closest("form")!);
    expect(fields[0]).toHaveProperty("validationMessage", "Use at least 10 characters");
    expect(setSetupPassword).not.toHaveBeenCalled();
  });

  it("does not show the removed password guidance note", () => {
    render(<StepAuthMethod onDone={vi.fn()} />);
    expect(screen.queryByText(/Use 10–200 characters/)).toBeNull();
  });
});
