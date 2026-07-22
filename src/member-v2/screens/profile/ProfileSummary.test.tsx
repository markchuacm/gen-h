// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ProfileSummary from "./ProfileSummary";
import { DEFAULT_ANSWERS } from "./profileQuestions";

afterEach(cleanup);

describe("ProfileSummary", () => {
  it("shows BMI as an additional hero pill", () => {
    render(<ProfileSummary answers={DEFAULT_ANSWERS} onEditStep={vi.fn()} />);

    expect(screen.getByText("25.4 kg/m²")).toBeTruthy();
  });
});
