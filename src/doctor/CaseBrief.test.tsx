// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import CaseBrief from "./CaseBrief";

afterEach(cleanup);

const detail = {
  memberName: "Amina Tan",
  memberEmail: "amina@example.com",
  age: 42,
  sex: "Female",
  stage: "consult_upcoming",
  onboarding: { basics: { heightCm: 173, weightKg: 76 } },
  documents: [],
  hasResults: false,
  results: { releasedReportCount: 0, measuredMarkerCount: 0 },
  labOrder: null,
  carePlan: null,
  appointment: null,
} satisfies DoctorCaseDetail;

describe("CaseBrief", () => {
  it("shows BMI in the doctor's at-a-glance vitals", () => {
    render(<CaseBrief detail={detail} />);

    expect(screen.getByText("BMI")).toBeTruthy();
    expect(screen.getByText("25.4 kg/m²")).toBeTruthy();
  });

  it("shows shared medical conditions in the doctor's brief", () => {
    render(
      <CaseBrief
        detail={{
          ...detail,
          onboarding: { conditions: ["Diabetes"] },
        }}
      />,
    );

    expect(screen.getByRole("region", { name: "Medical conditions" })).toBeTruthy();
    expect(screen.getByText("Diabetes")).toBeTruthy();
  });

  it("collapses legacy reason wording so it doesn't show as a duplicate concern", () => {
    render(
      <CaseBrief
        detail={{
          ...detail,
          onboarding: {
            reason: [
              "I have an existing health condition, and I would like to manage it",
              "I want help managing an existing health condition.",
              "I've done tests, but I don't know what to do with the results",
            ],
          },
        }}
      />,
    );

    const reasonBlock = screen.getByLabelText("Why they're here");
    expect(reasonBlock.querySelectorAll("p")).toHaveLength(2);
    expect(screen.getByText("I want help managing an existing health condition")).toBeTruthy();
    expect(screen.getByText("I've done tests, but I don't know what to do with the results")).toBeTruthy();
  });
});
