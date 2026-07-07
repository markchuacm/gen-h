// Journey-state config for the v2 Home screen. Content adapted from the
// earlier member portal and owned here by v2.

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
};

export type BloodDrawCardData = {
  type: "bloodDraw";
  labName: string;
  labBranch: string;
  labInitials: string;
  labAddress: string;
  labHours: string;
  primaryCta: string;
};

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
    primaryCta: string;
    primaryAction: HeroAction;
    secondaryCta?: string;
    image: string;
  };
  steps: Step[];
  tip: { title: string; body: string };
  contextCard: ContextCardData;
};

const CONSULT_CARD: ConsultCardData = {
  type: "consult",
  doctorName: "Dr. Lim Wen Qi",
  doctorRole: "Functional Medicine Physician",
  doctorInitials: "LW",
  date: "3 July 2026 (Fri)",
  time: "10:00 AM",
  location: "Online (Teleconsult)",
  primaryCta: "View consult details",
};

export const JOURNEY_STATES: Record<JourneyStateId, JourneyStateConfig> = {
  PROFILE_INCOMPLETE: {
    id: "PROFILE_INCOMPLETE",
    switcherLabel: "Profile incomplete",
    stageLabel: "Step 1 of 5 · Profile",
    greetingPrefix: "Welcome to Gen-H",
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
      titleBefore: "Get ready for ",
      titleEm: "your consult",
      body: "Meet Dr. Lim Wen Qi on 3 July 2026 (Fri) at 10:00 AM.",
      primaryCta: "Join consult",
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
    contextCard: { ...CONSULT_CARD, primaryCta: "Join consult" },
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
      primaryAction: { kind: "none" },
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
      labBranch: "TTDI",
      labInitials: "IQ",
      labAddress: "24G, Jalan Wan Kadir 3, Taman Tun Dr Ismail, 60000 Kuala Lumpur",
      labHours: "Mon–Sat, 7:30 AM – 5:00 PM",
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
