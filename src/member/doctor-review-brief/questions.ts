// ─── Doctor Review Brief · question sequence ──────────────────────────────────
// Declarative so copy and ordering live in data, not JSX. The required v1 path is:
// report availability → upload (if applicable) → reason → goals → symptoms →
// lifestyle snapshot → supplements/meds/allergies → preview.

import type {
  DynamicQuestion,
  IntakeState,
  Question,
} from "./types";
import { buildAdaptiveQueue } from "./questionRules";

export const REPORT_FORK: Question = {
  id: "reportFork",
  section: "reason",
  type: "single",
  prompt: "Do you already have any recent health reports?",
  helper: "This just tailors what we ask next — there's no wrong answer.",
  required: true,
  options: [
    "Blood & urine tests",
    "Genetic tests",
    "Other health data",
    "I don't have recent reports",
  ],
};

// Maps a report-fork option index → the stored availability value.
export const REPORT_FORK_VALUES = [
  "reports",
  "genetic_reports",
  "wearable_only",
  "no_reports",
] as const;

const CORE_QUESTIONS: Question[] = [
  {
    id: "reason",
    section: "reason",
    itemLabel: "Why I'm here",
    type: "multi",
    prompt: "What brings you here?",
    whyWeAsk:
      "This helps your doctor understand what you most want from the consult.",
    required: true,
    allowFreeText: true,
    freeTextLabel: "Anything else in your own words",
    options: [
      "I've done tests, but I don't know what to do with the results",
      "I'm worried about long-term health or family history",
      "I feel off despite “normal” results",
      "I want to optimise energy, focus, body composition, or longevity",
      "I want a doctor to review everything together instead of starting from scratch",
    ],
  },
  {
    id: "goals",
    section: "goals",
    itemLabel: "Main goals",
    type: "multi",
    prompt: "What would you most like to improve over the next 12 months?",
    whyWeAsk:
      "Your goals help your doctor focus the consult on what matters to you.",
    required: false,
    allowFreeText: true,
    freeTextLabel: "Anything else",
    options: [
      "Energy",
      "Focus / brain fog",
      "Mood / stress",
      "Sleep",
      "Fitness / performance",
      "Body composition",
      "Libido / hormones",
      "Cardiovascular prevention",
      "Blood sugar / metabolic health",
      "Longevity / prevention",
    ],
  },
  {
    id: "symptoms",
    section: "symptoms",
    itemLabel: "What feels off",
    type: "multi",
    prompt: "In the last 3 months, what has felt most off?",
    whyWeAsk:
      "Naming what feels off gives your doctor useful context alongside any results.",
    required: false,
    allowFreeText: true,
    freeTextLabel: "Anything else",
    options: [
      "Low energy / afternoon crash",
      "Brain fog / poor focus",
      "Low mood / anxiety / irritability",
      "Poor sleep quality",
      "Waking unrefreshed",
      "Low libido / drive",
      "Frequent illness / slow recovery",
      "Digestive issues",
      "Body composition concerns",
      "Nothing major — mostly prevention",
    ],
  },
  {
    id: "lifestyle",
    section: "lifestyle",
    itemLabel: "Lifestyle context",
    type: "snapshot",
    prompt: "A quick snapshot of your daily rhythm",
    helper:
      "Just the essentials for now — you can add more detail if you like.",
    whyWeAsk:
      "Sleep, movement and diet shape almost everything your doctor will look at.",
    required: false,
  },
  {
    id: "supplements",
    section: "supplements",
    itemLabel: "Supplements / medications",
    type: "supplements",
    prompt: "Anything you're currently taking?",
    whyWeAsk:
      "Supplements, medications and allergies help your doctor interpret everything else safely.",
    required: false,
  },
];

export const BASE_QUESTION_COUNT = 1 + CORE_QUESTIONS.length;
export const BASE_INTAKE_STEP_COUNT = BASE_QUESTION_COUNT + 3; // upload, preparing, generating

// Adaptive questions never crowd out the core flow: at most 2 queued questions
// surface at a time, and at most 4 are asked per session in total.
const MAX_DYNAMIC_VISIBLE = 2;
const MAX_DYNAMIC_PER_SESSION = 4;

function toFlowQuestion(question: DynamicQuestion): Question {
  return {
    id: `dyn_${question.id}`,
    dynamicQuestionId: question.id,
    section: "questions",
    itemLabel:
      question.triggeredBy && question.triggeredBy.length > 0
        ? `About ${question.triggeredBy.slice(0, 2).join(" & ")}`
        : "Context from you",
    type: "dynamic",
    prompt: question.prompt,
    whyWeAsk: question.whyWeAsk,
    options: question.options,
    allowFreeText: question.allowFreeText,
    freeTextLabel: "Add anything else",
    required: true,
  };
}

/** Finding-driven questions from the queue: answered ones stay (so Back works),
 *  then unanswered ones fill the remaining visible/session budget. */
function dynamicQuestionsFor(state: IntakeState): Question[] {
  const queue = buildAdaptiveQueue(state);
  if (queue.length === 0) return [];
  const answeredIds = new Set(
    (state.answeredDynamicQuestions ?? [])
      .filter((q) => q.answer.trim())
      .map((q) => q.questionId),
  );

  const answered = queue.filter((q) => answeredIds.has(q.id));
  const unanswered = queue.filter((q) => !answeredIds.has(q.id));
  const sessionBudget = Math.max(0, MAX_DYNAMIC_PER_SESSION - answered.length);
  const visible = unanswered.slice(
    0,
    Math.min(MAX_DYNAMIC_VISIBLE, sessionBudget),
  );

  return [...answered, ...visible].map(toFlowQuestion);
}

// ─── Flow assembly ────────────────────────────────────────────────────────────

export type FlowStep =
  | { key: string; kind: "question"; question: Question }
  | { key: "upload"; kind: "upload" }
  | { key: "preparing"; kind: "preparing" }
  | { key: "findings"; kind: "findings" }
  | { key: "generating"; kind: "generating" };

const hasRoute = (state: IntakeState) =>
  (state.reportSelections?.length ?? 0) > 0 ||
  state.hasReports === "reports" ||
  state.hasReports === "genetic_reports" ||
  state.hasReports === "wearable_only";

/** Ordered intake steps (up to, but not including, the preview). */
export function buildFlow(state: IntakeState): FlowStep[] {
  const steps: FlowStep[] = [
    { key: REPORT_FORK.id, kind: "question", question: REPORT_FORK },
  ];
  if (!state.hasReports) return steps;

  if (hasRoute(state)) {
    steps.push({ key: "upload", kind: "upload" });
    if (state.uploadsConfirmedAt)
      steps.push({ key: "preparing", kind: "preparing" });
    const hasFindings =
      !!state.uploadsConfirmedAt &&
      Object.values(state.aiDocumentInsights ?? {}).some(
        (i) => i.status === "done" || i.status === "needs_review",
      );
    if (hasFindings) steps.push({ key: "findings", kind: "findings" });
    dynamicQuestionsFor(state).forEach((q) =>
      steps.push({ key: q.id, kind: "question", question: q }),
    );
  }

  CORE_QUESTIONS.forEach((q) =>
    steps.push({ key: q.id, kind: "question", question: q }),
  );
  steps.push({ key: "generating", kind: "generating" });
  return steps;
}

export function questionById(id: string): Question | undefined {
  if (id === REPORT_FORK.id) return REPORT_FORK;
  const core = CORE_QUESTIONS.find((q) => q.id === id);
  if (core) return core;
  return undefined;
}
