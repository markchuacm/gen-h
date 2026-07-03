// v2 profile onboarding: static, choice-first question flow adapted from the
// earlier member intake. The UX is new and fully client-side.

export type StepId =
  | "basics"
  | "reason"
  | "goals"
  | "symptoms"
  | "lifestyle"
  | "habits"
  | "family"
  | "supplements";

export type StepDef = {
  id: StepId;
  kind: "basics" | "chips" | "lifestyle" | "habits" | "supplements";
  prompt: string;
  promptEm?: string;
  helper?: string;
  whyWeAsk?: string;
  /** Section title in the doctor brief summary. */
  summaryLabel: string;
  options?: string[];
  /** For chips steps: at least one selection required to continue. */
  required?: boolean;
};

export const STEPS: StepDef[] = [
  {
    id: "basics",
    kind: "basics",
    prompt: "First, the ",
    promptEm: "basics",
    helper: "Slide to set — no typing needed.",
    whyWeAsk: "Age, sex and body measurements anchor every reference range your doctor uses.",
    summaryLabel: "About you",
  },
  {
    id: "reason",
    kind: "chips",
    prompt: "What brings you ",
    promptEm: "here?",
    helper: "Choose everything that fits.",
    whyWeAsk: "This helps your doctor understand what you most want from the consult.",
    summaryLabel: "Why I'm here",
    required: true,
    options: [
      "I've done tests, but I don't know what to do with the results",
      "I'm worried about long-term health or family history",
      "I feel off despite “normal” results",
      "I want to optimise energy, focus, body composition, or longevity",
      "I want a doctor to review everything together",
    ],
  },
  {
    id: "goals",
    kind: "chips",
    prompt: "What would you most like to improve over the next ",
    promptEm: "12 months?",
    whyWeAsk: "Your goals help your doctor focus the consult on what matters to you.",
    summaryLabel: "Main goals",
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
    kind: "chips",
    prompt: "In the last 3 months, what has felt ",
    promptEm: "most off?",
    whyWeAsk: "Naming what feels off gives your doctor useful context alongside any results.",
    summaryLabel: "What feels off",
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
    kind: "lifestyle",
    prompt: "A quick snapshot of your ",
    promptEm: "daily rhythm",
    helper: "Just the essentials for now.",
    whyWeAsk: "Sleep, movement and diet shape almost everything your doctor will look at.",
    summaryLabel: "Lifestyle",
  },
  {
    id: "habits",
    kind: "habits",
    prompt: "Two honest ",
    promptEm: "habit questions",
    helper: "No judgement — this only makes your results easier to read.",
    whyWeAsk: "Alcohol and smoking directly shift several of the markers we test.",
    summaryLabel: "Habits",
  },
  {
    id: "family",
    kind: "chips",
    prompt: "Any of these in your ",
    promptEm: "close family?",
    helper: "Parents and siblings count most.",
    whyWeAsk: "Family history changes which prevention targets your doctor sets first.",
    summaryLabel: "Family history",
    options: [
      "Heart disease",
      "Diabetes",
      "High blood pressure",
      "High cholesterol",
      "Cancer",
      "Stroke",
      "Dementia",
      "None that I know of",
    ],
  },
  {
    id: "supplements",
    kind: "supplements",
    prompt: "Anything you're ",
    promptEm: "currently taking?",
    whyWeAsk:
      "Supplements, medications and allergies help your doctor interpret everything else safely.",
    summaryLabel: "Supplements & medications",
    options: [
      "Multivitamin",
      "Vitamin D",
      "Fish oil / omega-3",
      "Magnesium",
      "Protein powder",
      "Creatine",
      "Traditional / herbal remedies",
      "Prescription medication",
      "Nothing at the moment",
    ],
  },
];

export const STEP_COUNT = STEPS.length;

export const EXERCISE_OPTIONS = ["0", "1–2", "3–4", "5+"] as const;
export const DIET_OPTIONS = ["Mostly home-cooked", "Mixed", "Mostly eating out"] as const;
export const ALCOHOL_OPTIONS = ["Rarely / never", "Socially", "Most days"] as const;
export const SMOKING_OPTIONS = ["Never", "Former smoker", "Current smoker"] as const;

export type ProfileAnswers = {
  basics: { age: number; sex: "Male" | "Female"; heightCm: number; weightKg: number };
  reason: string[];
  goals: string[];
  symptoms: string[];
  lifestyle: {
    sleepHours: number;
    exerciseDays: (typeof EXERCISE_OPTIONS)[number];
    diet: (typeof DIET_OPTIONS)[number];
    stress: number;
  };
  habits: {
    alcohol: (typeof ALCOHOL_OPTIONS)[number];
    smoking: (typeof SMOKING_OPTIONS)[number];
  };
  family: string[];
  supplements: string[];
  supplementsOther: string;
};

export const DEFAULT_ANSWERS: ProfileAnswers = {
  basics: { age: 36, sex: "Male", heightCm: 173, weightKg: 76 },
  reason: [],
  goals: [],
  symptoms: [],
  lifestyle: { sleepHours: 6.5, exerciseDays: "1–2", diet: "Mixed", stress: 3 },
  habits: { alcohol: "Socially", smoking: "Never" },
  family: [],
  supplements: [],
  supplementsOther: "",
};
