// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import DatePicker from "./DatePicker";

afterEach(cleanup);

describe("DatePicker", () => {
  it("uses the site's formatted value and copper calendar selection", () => {
    const onChange = vi.fn();
    render(<DatePicker id="dob" value="1992-11-02" onChange={onChange} />);

    expect((screen.getByPlaceholderText("DD/MM/YYYY") as HTMLInputElement).value).toBe("02/11/1992");

    fireEvent.click(screen.getByRole("button", { name: "Open date picker" }));
    expect(screen.getByRole("dialog", { name: "Choose date" })).toBeTruthy();
    expect(screen.getByText("November 1992")).toBeTruthy();

    const selectedDay = screen.getByRole("button", { name: "2 November 1992" });
    expect(selectedDay.className).toContain("is-selected");
    fireEvent.click(screen.getByRole("button", { name: "3 November 1992" }));
    expect(onChange).toHaveBeenCalledWith("1992-11-03");
  });

  it("keeps direct DD/MM/YYYY typing compatible with the stored ISO value", () => {
    const onChange = vi.fn();
    render(<DatePicker id="dob" value="" onChange={onChange} />);

    fireEvent.change(screen.getByPlaceholderText("DD/MM/YYYY"), { target: { value: "15/02/1990" } });
    expect(onChange).toHaveBeenCalledWith("1990-02-15");
  });

  it("supports year, month, then day selection", () => {
    const onChange = vi.fn();
    render(<DatePicker id="dob" value="1992-12-02" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Open date picker" }));
    fireEvent.click(screen.getByRole("button", { name: "Choose month and year" }));
    expect(screen.getByRole("button", { name: "1992", pressed: true })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "1992", pressed: true }));
    expect(screen.getByRole("button", { name: "Dec", pressed: true })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dec", pressed: true }));
    expect(screen.getByRole("button", { name: "2 December 1992" }).className).toContain("is-selected");
  });
});
