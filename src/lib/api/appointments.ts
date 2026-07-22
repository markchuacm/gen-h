import { apiError, apiRequest } from "../apiClient";

export type MemberAppointment = {
  id: string;
  doctor_id: string;
  doctor_name: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  meeting_url: string | null;
  status: "scheduled" | "cancelled" | "completed";
};

// Verae operates in Malaysia; every consult time is shown in Asia/Kuala_Lumpur
// regardless of the viewer's device timezone. These formatters back the member,
// doctor, and admin surfaces so the displayed strings all match the reminder
// emails.
const KL = "Asia/Kuala_Lumpur";
const dateFmt = new Intl.DateTimeFormat("en-GB", { timeZone: KL, day: "numeric", month: "long", year: "numeric" });
const weekdayFmt = new Intl.DateTimeFormat("en-GB", { timeZone: KL, weekday: "short" });
const timeFmt = new Intl.DateTimeFormat("en-US", { timeZone: KL, hour: "numeric", minute: "2-digit", hour12: true });

/** e.g. "3 July 2026 (Fri)" */
export function formatConsultDate(iso: string): string {
  const date = new Date(iso);
  return `${dateFmt.format(date)} (${weekdayFmt.format(date)})`;
}

/** e.g. "10:00 AM" */
export function formatConsultTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

/** The signed-in member's scheduled consult, or a specific member's when
    memberId is passed (a doctor/admin viewing a case — RLS still gates it). */
export async function fetchMemberAppointment(memberId?: string) {
  try {
    const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
    return await apiRequest<{ data: MemberAppointment | null }>(`/v1/member/appointment${query}`)
      .then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}
