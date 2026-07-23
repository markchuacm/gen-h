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
});
