import { withWorker } from "../db/pools.js";
import type { ConsultEmailJob, ConsultEmailKind } from "../services/appointments.js";
import { sendAccountEmail } from "../services/email.js";

type AppointmentRow = {
  status: "scheduled" | "cancelled" | "completed";
  scheduled_at: Date;
  meeting_url: string | null;
  member_email: string;
  member_name: string | null;
  doctor_email: string;
  doctor_name: string | null;
};

const KL_TIME = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  dateStyle: "full",
  timeStyle: "short",
});

function formatWhen(scheduledAt: Date): string {
  return `${KL_TIME.format(scheduledAt)} (Malaysia time)`;
}

function joinLine(meetingUrl: string | null): string {
  return meetingUrl
    ? `Join here: ${meetingUrl}`
    : "Your join link will appear on your Verae home page before the call.";
}

function firstName(name: string | null): string {
  return name?.trim().split(/\s+/)[0] ?? "there";
}

function memberEmail(kind: ConsultEmailKind, row: AppointmentRow): { subject: string; text: string } {
  const when = formatWhen(row.scheduled_at);
  const doctor = row.doctor_name ?? "your Verae doctor";
  const greeting = `Hi ${firstName(row.member_name)},`;
  const join = joinLine(row.meeting_url);
  if (kind === "confirmation") {
    return {
      subject: "Your Verae teleconsult is booked",
      text: `${greeting}\n\nYour teleconsult with ${doctor} is confirmed for ${when}.\n\n${join}\n\nFind a quiet spot, have your questions ready, and log in a few minutes early. We look forward to seeing you.\n\n— Verae Health`,
    };
  }
  if (kind === "24h") {
    return {
      subject: "Your Verae consult is tomorrow",
      text: `${greeting}\n\nA reminder that your teleconsult with ${doctor} is tomorrow — ${when}.\n\n${join}\n\n— Verae Health`,
    };
  }
  return {
    subject: "Your Verae consult starts in 1 hour",
    text: `${greeting}\n\nYour teleconsult with ${doctor} starts in about an hour — ${when}.\n\n${join}\n\n— Verae Health`,
  };
}

function doctorEmail(kind: ConsultEmailKind, row: AppointmentRow): { subject: string; text: string } {
  const when = formatWhen(row.scheduled_at);
  const member = row.member_name ?? "your patient";
  const greeting = `Hi ${firstName(row.doctor_name)},`;
  const join = row.meeting_url ? `Join here: ${row.meeting_url}` : "The join link has not been added yet.";
  const brief = "Their case brief is in your Verae doctor console.";
  if (kind === "confirmation") {
    return {
      subject: `New consult booked: ${member}`,
      text: `${greeting}\n\nA teleconsult with ${member} has been scheduled for ${when}.\n\n${join}\n\n${brief}\n\n— Verae Health`,
    };
  }
  if (kind === "24h") {
    return {
      subject: `Reminder: consult with ${member} tomorrow`,
      text: `${greeting}\n\nA reminder that your teleconsult with ${member} is tomorrow — ${when}.\n\n${join}\n\n${brief}\n\n— Verae Health`,
    };
  }
  return {
    subject: `Consult with ${member} starts in 1 hour`,
    text: `${greeting}\n\nYour teleconsult with ${member} starts in about an hour — ${when}.\n\n${join}\n\n${brief}\n\n— Verae Health`,
  };
}

type ConsultEmailPlan = {
  member: { to: string; subject: string; text: string };
  doctor: { to: string; subject: string; text: string };
};

/**
 * Decide whether a queued consult email is still valid and, if so, build the
 * member and doctor messages. Returns null (a silent no-op) when the row is
 * missing, no longer scheduled, rescheduled to a different time, or — for
 * reminders — already in the past. Pure so the staleness rules are unit-tested.
 */
export function planConsultEmail(job: ConsultEmailJob, row: AppointmentRow | null, now: number = Date.now()): ConsultEmailPlan | null {
  if (!row || row.status !== "scheduled") return null;
  if (row.scheduled_at.toISOString() !== job.scheduledAt) return null;
  if (job.kind !== "confirmation" && row.scheduled_at.getTime() <= now) return null;
  return {
    member: { to: row.member_email, ...memberEmail(job.kind, row) },
    doctor: { to: row.doctor_email, ...doctorEmail(job.kind, row) },
  };
}

export async function sendConsultEmail(job: ConsultEmailJob): Promise<void> {
  const row = await withWorker(job.appointmentId, async (client) => {
    const result = await client.query<AppointmentRow>(
      `select a.status, a.scheduled_at, a.meeting_url,
              m.email as member_email, m.full_name as member_name,
              d.email as doctor_email, d.full_name as doctor_name
       from app.appointments a
       join app.profiles m on m.id = a.member_id
       join app.profiles d on d.id = a.doctor_id
       where a.id = $1`,
      [job.appointmentId],
    );
    return result.rows[0] ?? null;
  });

  const plan = planConsultEmail(job, row);
  if (!plan) return;
  // Sequential: a retry re-sends both, an acceptable duplicate for reminders.
  await sendAccountEmail(plan.member);
  await sendAccountEmail(plan.doctor);
}
