// ─── Doctor Review Brief · question sequence ──────────────────────────────────
// Declarative so copy and ordering live in data, not JSX. The required v1 path is:
// report availability → upload (if applicable) → reason → goals → symptoms →
// lifestyle snapshot → supplements/meds/allergies → preview.

import type { DocumentInsight, IntakeState, Question, UploadCategory } from "./types";

export const REPORT_FORK: Question = {
  id: "reportFork",
  section: "reason",
  type: "single",
  prompt: "Do you already have any recent health reports?",
  helper: "This just tailors what we ask next — there's no wrong answer.",
  required: true,
  options: [
    "Yes — blood tests or health screening reports",
    "Yes — but only wearable / fitness / body composition data",
    "No — I don't have recent reports",
    "I'm not sure",
  ],
};

// Maps a report-fork option index → the stored availability value.
export const REPORT_FORK_VALUES = ["reports", "wearable_only", "no_reports", "not_sure"] as const;

const CORE_QUESTIONS: Question[] = [
  {
    id: "reason",
    section: "reason",
    itemLabel: "Why I'm here",
    type: "multi",
    prompt: "What brings you here?",
    whyWeAsk: "This helps your doctor understand what you most want from the consult.",
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
    whyWeAsk: "Your goals help your doctor focus the consult on what matters to you.",
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
    whyWeAsk: "Naming what feels off gives your doctor useful context alongside any results.",
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
    helper: "Just the essentials for now — you can add more detail if you like.",
    whyWeAsk: "Sleep, movement and diet shape almost everything your doctor will look at.",
    required: false,
  },
  {
    id: "supplements",
    section: "supplements",
    itemLabel: "Supplements / medications",
    type: "supplements",
    prompt: "Anything you're currently taking?",
    whyWeAsk: "Supplements, medications and allergies help your doctor interpret everything else safely.",
    required: false,
  },
];

// Context questions are file-type aware but deliberately do NOT imply any parsing
// of the file's contents.
const CONTEXT_QUESTIONS: Record<string, Question> = {
  dna: {
    id: "ctx_dna",
    section: "questions",
    itemLabel: "From your DNA / genetic report",
    type: "text",
    prompt: "What were you hoping to understand from your genetic report?",
    whyWeAsk:
      "Genetic reports are most useful when interpreted alongside your actual labs and lifestyle — your doctor will do that with you.",
    required: false,
  },
  wearable: {
    id: "ctx_wearable",
    section: "questions",
    itemLabel: "From your wearable data",
    type: "text",
    prompt: "What are you hoping your doctor reviews from your wearable data?",
    helper: "e.g. sleep, recovery, fitness, heart rate, or consistency.",
    whyWeAsk: "Wearable data is most useful when paired with how you actually feel.",
    required: false,
  },
};

function insightToQuestion(insight: DocumentInsight): Question {
  return {
    id: insight.questionId,
    section: "questions",
    itemLabel: `About your ${insight.documentType}`,
    type: "text",
    prompt: insight.question,
    whyWeAsk: "This helps your doctor know exactly what to focus on when they review this document.",
    required: false,
  };
}

function contextQuestionsFor(
  files: IntakeState["uploadedFiles"],
  insights?: Record<string, DocumentInsight>,
): Question[] {
  const out: Question[] = [];
  const coveredCategories = new Set<UploadCategory>();

  // AI-generated questions take priority — one per file that completed successfully
  files.forEach((f) => {
    const insight = insights?.[f.id];
    if ((insight?.status === "done" || insight?.status === "needs_review") && insight.question) {
      out.push(insightToQuestion(insight));
      if (insight.status === "done" && f.detectedCategory) coveredCategories.add(f.detectedCategory);
    }
  });

  // Hardcoded fallbacks for recognised categories not already covered by AI
  const cats = new Set<UploadCategory>();
  files.forEach((f) => f.detectedCategory && cats.add(f.detectedCategory));
  if (cats.has("dna") && !coveredCategories.has("dna")) out.push(CONTEXT_QUESTIONS.dna);
  if (cats.has("wearable") && !coveredCategories.has("wearable")) out.push(CONTEXT_QUESTIONS.wearable);

  return out;
}

// ─── Flow assembly ────────────────────────────────────────────────────────────

export type FlowStep =
  | { key: string; kind: "question"; question: Question }
  | { key: "upload"; kind: "upload" }
  | { key: "preparing"; kind: "preparing" }
  | { key: "reassurance"; kind: "reassurance" };

const hasRoute = (v: IntakeState["hasReports"]) => v === "reports" || v === "wearable_only";

/** Ordered intake steps (up to, but not including, the preview). */
export function buildFlow(state: IntakeState): FlowStep[] {
  const steps: FlowStep[] = [{ key: REPORT_FORK.id, kind: "question", question: REPORT_FORK }];
  if (!state.hasReports) return steps;

  if (hasRoute(state.hasReports)) {
    steps.push({ key: "upload", kind: "upload" });
    steps.push({ key: "preparing", kind: "preparing" });
    contextQuestionsFor(state.uploadedFiles, state.aiDocumentInsights).forEach((q) =>
      steps.push({ key: q.id, kind: "question", question: q }),
    );
  } else {
    steps.push({ key: "reassurance", kind: "reassurance" });
  }

  CORE_QUESTIONS.forEach((q) => steps.push({ key: q.id, kind: "question", question: q }));
  return steps;
}

export function questionById(id: string): Question | undefined {
  if (id === REPORT_FORK.id) return REPORT_FORK;
  const core = CORE_QUESTIONS.find((q) => q.id === id);
  if (core) return core;
  return Object.values(CONTEXT_QUESTIONS).find((q) => q.id === id);
}
