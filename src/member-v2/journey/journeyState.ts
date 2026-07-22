// Journey-state config for the v2 Home screen. Content adapted from the
// earlier member portal and owned here by v2.

import { formatConsultDate, formatConsultTime } from "../../lib/api/appointments";
import heroProfileImage from "../../../assets/dashboard/health-profile-hero.png";
import heroConsultImage from "../../../assets/dashboard/pre-consult-hero.png";
import heroBloodFormImage from "../../../assets/dashboard/blood-test-form-hero.png";
import heroResultsImage from "../../../assets/dashboard/test-results-hero.png";
import heroCarePlanImage from "../../../assets/dashboard/care-plan-hero.png";

export type JourneyStateId =
  | "PROFILE_INCOMPLETE"
  | "CONSULT_UPCOMING"
  | "BLOOD_FORM_READY"
  | "RESULTS_PENDING"
  | "RESULTS_READY"
  | "CARE_PLAN_READY";

/** DB `member_profiles.current_stage` values mapped to journey states. */
export const STAGE_TO_JOURNEY: Record<string, JourneyStateId> = {
  profile_incomplete: "PROFILE_INCOMPLETE",
  consult_upcoming: "CONSULT_UPCOMING",
  blood_form_ready: "BLOOD_FORM_READY",
  results_pending: "RESULTS_PENDING",
  results_ready: "RESULTS_READY",
  care_plan_ready: "CARE_PLAN_READY",
};

export type MemberTab = "home" | "profile" | "results" | "carePlan";

export type StepState = "completed" | "active" | "upcoming";

export type Step = {
  label: string;
  statusLabel: string;
  state: StepState;
};

export type HeroAction =
  | { kind: "tab"; tab: MemberTab }
  | { kind: "profileFlow" }
  | { kind: "link"; url: string }
  | { kind: "downloadForm" }
  | { kind: "none" };

export type ConsultCardData = {
  type: "consult";
  doctorName: string;
  doctorRole: string;
  doctorInitials: string;
  date: string;
  time: string;
  location: string;
  primaryCta: string;
  meetingUrl?: string | null;
};

export type BloodDrawCardData = {
  type: "bloodDraw";
  labName: string;
  labBranch: string;
  labInitials: string;
  labAddress: string;
  /** Scheduled draw, filled from the released lab order; null until confirmed. */
  appointment: string | null;
  mapsUrl: string;
  wazeUrl: string;
  primaryCta: string;
};

// Innoquest HQ — the fixed blood-draw location shown to every member. The full
// form is used for map links; the card shows a shorter form (Petaling Jaya → PJ)
// so the address stays on one line.
export const INNOQUEST_HQ_ADDRESS =
  "2nd Floor, Wisma Tecna, 18A, Jalan 51a/223, Seksyen 51a, 46100 Petaling Jaya, Selangor";
export const INNOQUEST_HQ_ADDRESS_SHORT =
  "2nd Floor, Wisma Tecna, 18A, Jalan 51a/223, Seksyen 51a, 46100 PJ";
const INNOQUEST_HQ_QUERY = "Innoquest Pathology, Wisma Tecna, Jalan 51a/223, Petaling Jaya, Selangor";
export const INNOQUEST_HQ_MAPS_URL =
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(INNOQUEST_HQ_QUERY)}`;
export const INNOQUEST_HQ_WAZE_URL =
  `https://www.waze.com/ul?q=${encodeURIComponent(INNOQUEST_HQ_QUERY)}&navigate=yes`;

export type ResultsTimelineCardData = {
  type: "resultsTimeline";
  testName: string;
  expectedTiming: string;
  stages: Array<{ label: string; state: StepState }>;
  primaryCta: string;
};

export type CarePlanTeaserCardData = {
  type: "carePlanTeaser";
  focusAreaCount: string;
  actionCount: string;
  nextReview: string;
  primaryCta: string;
};

export type ContextCardData =
  | ConsultCardData
  | BloodDrawCardData
  | ResultsTimelineCardData
  | CarePlanTeaserCardData;

export type JourneyStateConfig = {
  id: JourneyStateId;
  switcherLabel: string;
  stageLabel: string;
  /** Rendered as `${greetingPrefix}, ${firstName}` on the home screen. */
  greetingPrefix: string;
  hero: {
    pill: string;
    titleBefore: string;
    titleEm?: string;
    titleAfter?: string;
    body: string;
    primaryCta?: string;
    primaryAction: HeroAction;
    // Rendered but non-actionable — e.g. a scheduled consult whose join link
    // has not been added yet. `primaryHint` becomes the button's tooltip.
    primaryDisabled?: boolean;
    primaryHint?: string;
    secondaryCta?: string;
    image: string;
  };
  steps: Step[];
  tip: { title: string; body: string };
  contextCard: ContextCardData;
};

// Placeholder shown until the admin schedules the consult. resolveJourneyConfig
// swaps in the real doctor, date, time, and join link once an appointment exists.
const CONSULT_CARD: ConsultCardData = {
  type: "consult",
  doctorName: "Your Verae doctor",
  doctorRole: "Verae physician",
  doctorInitials: "V",
  date: "To be confirmed",
  time: "—",
  location: "Online (Google Meet)",
  primaryCta: "View consult details",
  meetingUrl: null,
};

export const JOURNEY_STATES: Record<JourneyStateId, JourneyStateConfig> = {
  PROFILE_INCOMPLETE: {
    id: "PROFILE_INCOMPLETE",
    switcherLabel: "Profile incomplete",
    stageLabel: "Step 1 of 5 · Profile",
    greetingPrefix: "Welcome to Verae",
    hero: {
      pill: "Health profile",
      titleBefore: "Complete your ",
      titleEm: "health profile",
      body: "Help your doctor understand your goals, lifestyle and history before your consult.",
      primaryCta: "Continue profile",
      primaryAction: { kind: "profileFlow" },
      secondaryCta: "View consult details",
      image: heroProfileImage,
    },
    steps: [
      { label: "Profile", statusLabel: "Pending", state: "active" },
      { label: "Consult", statusLabel: "Upcoming", state: "upcoming" },
      { label: "Blood draw", statusLabel: "Upcoming", state: "upcoming" },
      { label: "Results", statusLabel: "Upcoming", state: "upcoming" },
      { label: "Care plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "Before your consult",
      body: "Complete your profile so your doctor can review your goals, lifestyle, history and existing reports.",
    },
    contextCard: CONSULT_CARD,
  },
  CONSULT_UPCOMING: {
    id: "CONSULT_UPCOMING",
    switcherLabel: "Consult upcoming",
    stageLabel: "Step 2 of 5 · Consult",
    greetingPrefix: "Welcome back",
    hero: {
      pill: "Upcoming consult",
      titleBefore: "We're scheduling ",
      titleEm: "your consult",
      body: "We're finding the right time for your consult — we'll email you once it's booked.",
      primaryAction: { kind: "none" },
      secondaryCta: "View consult details",
      image: heroConsultImage,
    },
    steps: [
      { label: "Profile", statusLabel: "Completed", state: "completed" },
      { label: "Consult", statusLabel: "Upcoming", state: "active" },
      { label: "Blood draw", statusLabel: "Upcoming", state: "upcoming" },
      { label: "Results", statusLabel: "Upcoming", state: "upcoming" },
      { label: "Care plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "Before your consult",
      body: "Review your goals, symptoms and questions before meeting your doctor.",
    },
    contextCard: CONSULT_CARD,
  },
  BLOOD_FORM_READY: {
    id: "BLOOD_FORM_READY",
    switcherLabel: "Blood draw",
    stageLabel: "Step 3 of 5 · Blood draw",
    greetingPrefix: "Welcome back",
    hero: {
      pill: "Blood draw",
      titleBefore: "Your blood test form ",
      titleEm: "is ready",
      body: "Bring this form to your assigned lab.",
      primaryCta: "Download form",
      primaryAction: { kind: "downloadForm" },
      secondaryCta: "View instructions",
      image: heroBloodFormImage,
    },
    steps: [
      { label: "Profile", statusLabel: "Completed", state: "completed" },
      { label: "Consult", statusLabel: "Completed", state: "completed" },
      { label: "Blood draw", statusLabel: "Upcoming", state: "active" },
      { label: "Results", statusLabel: "Upcoming", state: "upcoming" },
      { label: "Care plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "Before your blood draw",
      body: "Fast for 8–10 hours if instructed. Drink water as usual. Bring your request form to the assigned lab.",
    },
    contextCard: {
      type: "bloodDraw",
      labName: "Innoquest",
      labBranch: "HQ · Petaling Jaya",
      labInitials: "IQ",
      labAddress: INNOQUEST_HQ_ADDRESS_SHORT,
      appointment: null,
      mapsUrl: INNOQUEST_HQ_MAPS_URL,
      wazeUrl: INNOQUEST_HQ_WAZE_URL,
      primaryCta: "Download form",
    },
  },
  RESULTS_PENDING: {
    id: "RESULTS_PENDING",
    switcherLabel: "Results pending",
    stageLabel: "Step 4 of 5 · Results",
    greetingPrefix: "Welcome back",
    hero: {
      pill: "Results",
      titleBefore: "Your results are ",
      titleEm: "processing",
      body: "We'll organise them by health area once they're ready.",
      primaryCta: "View past results",
      primaryAction: { kind: "tab", tab: "results" },
      secondaryCta: "View timeline",
      image: heroResultsImage,
    },
    steps: [
      { label: "Profile", statusLabel: "Completed", state: "completed" },
      { label: "Consult", statusLabel: "Completed", state: "completed" },
      { label: "Blood draw", statusLabel: "Completed", state: "completed" },
      { label: "Results", statusLabel: "Upcoming", state: "active" },
      { label: "Care plan", statusLabel: "Upcoming", state: "upcoming" },
    ],
    tip: {
      title: "What happens next",
      body: "Your doctor reviews your results before they reach you, so numbers always arrive with context.",
    },
    contextCard: {
      type: "resultsTimeline",
      testName: "Advanced Blood Baseline",
      expectedTiming: "3–7 working days",
      stages: [
        { label: "Blood drawn", state: "completed" },
        { label: "At the lab", state: "active" },
        { label: "Doctor review", state: "upcoming" },
        { label: "Ready for you", state: "upcoming" },
      ],
      primaryCta: "View past results",
    },
  },
  RESULTS_READY: {
    id: "RESULTS_READY",
    switcherLabel: "Results ready",
    stageLabel: "Step 4 of 5 · Results",
    greetingPrefix: "Welcome back",
    hero: {
      pill: "Results",
      titleBefore: "Your results ",
      titleEm: "are in",
      body: "Explore them by health area while your doctor prepares your care plan.",
      primaryCta: "View results",
      primaryAction: { kind: "tab", tab: "results" },
      secondaryCta: "View timeline",
      image: heroResultsImage,
    },
    steps: [
      { label: "Profile", statusLabel: "Completed", state: "completed" },
      { label: "Consult", statusLabel: "Completed", state: "completed" },
      { label: "Blood draw", statusLabel: "Completed", state: "completed" },
      { label: "Results", statusLabel: "Ready", state: "active" },
      { label: "Care plan", statusLabel: "In progress", state: "upcoming" },
    ],
    tip: {
      title: "What happens next",
      body: "Your doctor is reviewing your results and will build your personalised care plan next.",
    },
    contextCard: {
      type: "resultsTimeline",
      testName: "Advanced Blood Baseline",
      expectedTiming: "Care plan in progress",
      stages: [
        { label: "Blood drawn", state: "completed" },
        { label: "At the lab", state: "completed" },
        { label: "Results ready", state: "completed" },
        { label: "Doctor review", state: "active" },
      ],
      primaryCta: "View results",
    },
  },
  CARE_PLAN_READY: {
    id: "CARE_PLAN_READY",
    switcherLabel: "Care plan ready",
    stageLabel: "Step 5 of 5 · Care plan",
    greetingPrefix: "Welcome back",
    hero: {
      pill: "Care plan",
      titleBefore: "Your care plan ",
      titleEm: "is ready",
      body: "Clear next steps from your doctor, built around your results.",
      primaryCta: "View care plan",
      primaryAction: { kind: "tab", tab: "carePlan" },
      secondaryCta: "View plan summary",
      image: heroCarePlanImage,
    },
    steps: [
      { label: "Profile", statusLabel: "Completed", state: "completed" },
      { label: "Consult", statusLabel: "Completed", state: "completed" },
      { label: "Blood draw", statusLabel: "Completed", state: "completed" },
      { label: "Results", statusLabel: "Completed", state: "completed" },
      { label: "Care plan", statusLabel: "Delivered", state: "active" },
    ],
    tip: {
      title: "Your next step",
      body: "Review your care plan and start with the actions your doctor marked as priorities.",
    },
    contextCard: {
      type: "carePlanTeaser",
      focusAreaCount: "4",
      actionCount: "15",
      nextReview: "In 12 weeks",
      primaryCta: "View care plan",
    },
  },
};

export const JOURNEY_STATE_IDS = Object.keys(JOURNEY_STATES) as JourneyStateId[];

/** The fields resolveJourneyConfig needs from a scheduled appointment. */
export type AppointmentForJourney = {
  doctor_name: string | null;
  scheduled_at: string;
  meeting_url: string | null;
};

function initialsFrom(name: string): string {
  const words = name.replace(/^dr\.?\s+/i, "").trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]!.toUpperCase()).join("");
  return initials || "V";
}

/**
 * The static JOURNEY_STATES config, filled in from the member's real data: the
 * consult-upcoming state from their teleconsult appointment, and the blood-draw
 * state from their scheduled Innoquest appointment. Other states are returned
 * unchanged.
 */
export function resolveJourneyConfig(
  id: JourneyStateId,
  appointment: AppointmentForJourney | null,
  bloodDrawAt: string | null = null,
): JourneyStateConfig {
  const base = JOURNEY_STATES[id];

  if (id === "BLOOD_FORM_READY") {
    if (!bloodDrawAt || base.contextCard.type !== "bloodDraw") return base;
    const date = formatConsultDate(bloodDrawAt);
    const time = formatConsultTime(bloodDrawAt);
    return {
      ...base,
      hero: {
        ...base.hero,
        body: `Your blood draw is booked for ${date} at ${time}. Bring your request form to Innoquest.`,
      },
      contextCard: { ...base.contextCard, appointment: `${date} · ${time}` },
    };
  }

  if (id !== "CONSULT_UPCOMING" || !appointment) return base;

  const doctorName = appointment.doctor_name?.trim() || "your Verae doctor";
  const date = formatConsultDate(appointment.scheduled_at);
  const time = formatConsultTime(appointment.scheduled_at);
  const meetingUrl = appointment.meeting_url;

  return {
    ...base,
    hero: {
      ...base.hero,
      titleBefore: "Get ready for ",
      titleEm: "your consult",
      titleAfter: undefined,
      body: `Meet ${doctorName} on ${date} at ${time}.`,
      primaryCta: "Join consult",
      primaryAction: meetingUrl ? { kind: "link", url: meetingUrl } : { kind: "none" },
      primaryDisabled: !meetingUrl,
      primaryHint: meetingUrl ? undefined : "Your join link will appear here soon",
      secondaryCta: "View consult details",
    },
    contextCard: {
      type: "consult",
      doctorName,
      doctorRole: "Verae physician",
      doctorInitials: initialsFrom(doctorName),
      date,
      time,
      location: "Online (Google Meet)",
      primaryCta: "Join consult",
      meetingUrl,
    },
  };
}
