// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PhoneField } from "./identityFields";

afterEach(cleanup);

describe("PhoneField", () => {
  it("shows the dialled national number and defaults to Malaysia", () => {
    render(<PhoneField value="+60123456789" onChange={vi.fn()} />);
    expect((screen.getByRole("textbox") as HTMLInputElement).value).toBe("123456789");
    expect(screen.getByText("+60")).toBeTruthy();
  });

  it("opens a searchable country list and changes the dial code on select", () => {
    const onChange = vi.fn();
    render(<PhoneField value="+60123456789" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: /country code/i }));
    const search = screen.getByPlaceholderText("Search for country");
    fireEvent.change(search, { target: { value: "Nether" } });

    fireEvent.click(screen.getByRole("button", { name: /Netherlands/ }));
    // National digits preserved, dial code swapped to +31.
    expect(onChange).toHaveBeenCalledWith("+31123456789");
  });

  it("keeps only digits from typed input", () => {
    const onChange = vi.fn();
    render(<PhoneField value="" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "12-345 678" } });
    expect(onChange).toHaveBeenCalledWith("+6012345678");
  });
});
