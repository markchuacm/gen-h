import { describe, expect, it } from "vitest";
import { planConsultEmail } from "./consult-email.js";
import type { ConsultEmailJob } from "../services/appointments.js";

const SCHEDULED = "2026-08-01T02:00:00.000Z"; // 10:00 in Kuala Lumpur (UTC+8)

function row(overrides: Partial<Parameters<typeof planConsultEmail>[1] & object> = {}) {
  return {
    status: "scheduled" as const,
    scheduled_at: new Date(SCHEDULED),
    meeting_url: "https://meet.google.com/abc-defg-hij",
    member_email: "member@example.com",
    member_name: "Aisha Rahman",
    doctor_email: "doctor@example.com",
    doctor_name: "Dr. Lim Wen Qi",
    ...overrides,
  };
}

const job = (kind: ConsultEmailJob["kind"]): ConsultEmailJob => ({
  appointmentId: "a1",
  scheduledAt: SCHEDULED,
  kind,
});

const beforeConsult = new Date(SCHEDULED).getTime() - 60 * 60 * 1000;

describe("planConsultEmail", () => {
  it("builds member and doctor confirmation emails in Malaysia time", () => {
    const plan = planConsultEmail(job("confirmation"), row(), beforeConsult);
    expect(plan).not.toBeNull();
    expect(plan!.member.to).toBe("member@example.com");
    expect(plan!.doctor.to).toBe("doctor@example.com");
    expect(plan!.member.text).toContain("Malaysia time");
    expect(plan!.member.text).toContain("10:00");
    expect(plan!.member.text).toContain("meet.google.com");
    expect(plan!.doctor.subject).toContain("Aisha Rahman");
  });

  it("no-ops when the consult was cancelled", () => {
    expect(planConsultEmail(job("1h"), row({ status: "cancelled" }), beforeConsult)).toBeNull();
  });

  it("no-ops when the consult was rescheduled to a different time", () => {
    const rescheduled = row({ scheduled_at: new Date("2026-08-02T02:00:00.000Z") });
    expect(planConsultEmail(job("24h"), rescheduled, beforeConsult)).toBeNull();
  });

  it("no-ops reminders once the consult time has passed", () => {
    const afterConsult = new Date(SCHEDULED).getTime() + 60 * 1000;
    expect(planConsultEmail(job("1h"), row(), afterConsult)).toBeNull();
  });

  it("falls back to a portal message when no meeting link is set", () => {
    const plan = planConsultEmail(job("confirmation"), row({ meeting_url: null }), beforeConsult);
    expect(plan!.member.text).toContain("Verae home page");
    expect(plan!.member.text).not.toContain("meet.google.com");
  });
});
