import { getBoss } from "../jobs/boss.js";

export type ConsultEmailKind = "confirmation" | "24h" | "1h";

export type ConsultEmailJob = {
  appointmentId: string;
  // ISO timestamp the reminders were enqueued for. The worker compares this
  // against the current DB value and no-ops on a mismatch, so a reschedule or
  // cancel simply leaves the old delayed jobs to fire and drop themselves —
  // no job bookkeeping required.
  scheduledAt: string;
  kind: ConsultEmailKind;
};

const REMINDER_OFFSETS_MS: Record<"24h" | "1h", number> = {
  "24h": 24 * 60 * 60 * 1000,
  "1h": 60 * 60 * 1000,
};

/**
 * Queue the booking confirmation (immediately) plus the 24h and 1h reminders
 * (delayed) for a consult. Call this AFTER the scheduling transaction commits.
 * Reminder windows already in the past are skipped.
 */
export async function scheduleConsultEmails(appointmentId: string, scheduledAt: Date): Promise<void> {
  const boss = await getBoss();
  const iso = scheduledAt.toISOString();

  await boss.send(
    "send-consult-email",
    { appointmentId, scheduledAt: iso, kind: "confirmation" } satisfies ConsultEmailJob,
    { singletonKey: `${appointmentId}:confirmation:${iso}` },
  );

  for (const kind of ["24h", "1h"] as const) {
    const startAfter = new Date(scheduledAt.getTime() - REMINDER_OFFSETS_MS[kind]);
    if (startAfter.getTime() <= Date.now()) continue;
    await boss.send(
      "send-consult-email",
      { appointmentId, scheduledAt: iso, kind } satisfies ConsultEmailJob,
      { startAfter, singletonKey: `${appointmentId}:${kind}:${iso}` },
    );
  }
}
