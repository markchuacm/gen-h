import { describe, expect, it } from "vitest";
import { planBloodFormEmail } from "./blood-form-email.js";

function row(overrides: Partial<Parameters<typeof planBloodFormEmail>[0] & object> = {}) {
  return {
    member_email: "member@example.com",
    member_name: "Aisha Rahman",
    form_released_at: new Date("2026-07-22T02:00:00.000Z"),
    ...overrides,
  };
}

describe("planBloodFormEmail", () => {
  it("builds a dashboard-link email for a released form", () => {
    const plan = planBloodFormEmail(row());
    expect(plan).not.toBeNull();
    expect(plan!.to).toBe("member@example.com");
    expect(plan!.subject).toContain("blood test request form");
    expect(plan!.text).toContain("Aisha");
    // Links to the dashboard; never attaches or links the PDF directly.
    expect(plan!.text.toLowerCase()).toContain("dashboard");
    expect(plan!.text).not.toMatch(/\.pdf/i);
  });

  it("greets generically when no name is stored", () => {
    const plan = planBloodFormEmail(row({ member_name: null }));
    expect(plan!.text).toContain("Hi there,");
  });

  it("no-ops when the form has not been released", () => {
    expect(planBloodFormEmail(row({ form_released_at: null }))).toBeNull();
  });

  it("no-ops when the row is missing", () => {
    expect(planBloodFormEmail(null)).toBeNull();
  });
});
