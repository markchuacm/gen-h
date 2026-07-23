// v2 profile onboarding: static, choice-first question flow adapted from the
// earlier member intake. The UX is new and fully client-side.

export type StepId =
  | "identity"
  | "reports"
  | "allergies"
  | "basics"
  | "reason"
  | "goals"
  | "symptoms"
  | "lifestyle"
  | "habits"
  | "conditions"
  | "family"
  | "supplements";

export type StepDef = {
  id: StepId;
  kind: "identity" | "reports" | "basics" | "chips" | "lifestyle" | "habits" | "supplements";
  prompt: string;
  promptEm?: string;
  helper?: string;
  whyWeAsk?: string;
  /** Section title in the doctor brief summary. */
  summaryLabel: string;
  options?: string[];
  /** Adds a keyboard-accessible “Other” choice (0) and a conditional text field. */
  allowsOther?: boolean;
  /** Places the generated “Other” choice immediately before the final option. */
  otherBeforeLast?: boolean;
  otherPlaceholder?: string;
  /** For chips steps: at least one selection required to continue. */
  required?: boolean;
};

export type ReportUploadCategory = "health_screening" | "genetic_tests" | "other_tests";
export type ReportSelection = ReportUploadCategory | "no_tests";
export type UploadedReportKind = "pdf" | "image" | "sheet" | "doc" | "other";

export type UploadedReport = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  category: ReportUploadCategory;
  kind: UploadedReportKind;
  /** Supabase persistence — absent while the upload is still in flight. */
  documentId?: string;
  storagePath?: string;
  status?: "uploading" | "uploaded";
};

export const REPORT_OPTIONS: Array<{
  id: ReportSelection;
  label: string;
  helper?: string;
}> = [
  {
    id: "health_screening",
    label: "Upload health screenings",
    helper: "Blood work, urine tests, health screening reports",
  },
  {
    id: "genetic_tests",
    label: "Upload genetic tests",
    helper: "DNA, ancestry, nutrigenomics or carrier reports",
  },
  {
    id: "other_tests",
    label: "Upload other tests",
    helper: "Imaging, gut microbiome, wearable data or other files",
  },
  {
    id: "no_tests",
    label: "I don't have any tests",
  },
];

export const REPORT_CATEGORY_LABELS: Record<ReportUploadCategory, string> = {
  health_screening: "Health screening",
  genetic_tests: "Genetic tests",
  other_tests: "Other tests",
};

export const PRESCRIPTION_MEDICATION_OPTION = "Prescription medication";
export const MANAGE_EXISTING_CONDITION_REASON = "I want help managing an existing health condition";
// Earlier copy for this same "reason" option. Some members' saved answers
// still hold one of these exact strings from before the wording changed,
// which the reason chip step no longer recognises as a match —
// normalizeReasonSelections re-maps them so they render as the current
// option instead of stray, unselected entries.
const LEGACY_REASON_LABELS: Record<string, string> = {
  "I have an existing health condition, and I would like to manage it": MANAGE_EXISTING_CONDITION_REASON,
  "I want help managing an existing health condition.": MANAGE_EXISTING_CONDITION_REASON,
};

export function normalizeReasonSelections(reason: string[]): string[] {
  const mapped = reason.map((item) => LEGACY_REASON_LABELS[item] ?? item);
  return Array.from(new Set(mapped));
}

export const STEPS: StepDef[] = [
  {
    id: "identity",
    kind: "identity",
    prompt: "Let's start with your ",
    promptEm: "details",
    whyWeAsk: "These are required on your lab request form, which the lab matches against your IC.",
    summaryLabel: "Personal details",
  },
  {
    id: "basics",
    kind: "basics",
    prompt: "Next, the ",
    promptEm: "basics",
    whyWeAsk:
      "Your name helps us address you correctly; age, gender and body measurements anchor every reference range your doctor uses.",
    summaryLabel: "About you",
  },
  {
    id: "reason",
    kind: "chips",
    prompt: "What brings you ",
    promptEm: "here?",
    helper: "Choose everything that fits, by pressing the number on keyboard",
    whyWeAsk: "This helps your doctor understand what you most want from the consult.",
    summaryLabel: "Why I'm here",
    required: true,
    allowsOther: true,
    otherPlaceholder: "Tell us what else brings you here",
    options: [
      "I've done tests, but I don't know what to do with the results",
      "I'm worried about long-term health or family history",
      "I feel off despite “normal” results",
      MANAGE_EXISTING_CONDITION_REASON,
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
    allowsOther: true,
    otherPlaceholder: "Tell us what else you would like to improve",
    options: [
      "Energy",
      "Focus / brain fog",
      "Mood / stress",
      "Sleep",
      "Fitness / performance",
      "Body composition",
      "Libido / hormones",
      "Blood sugar / metabolic health",
      "Longevity / preventive",
    ],
  },
  {
    id: "symptoms",
    kind: "chips",
    prompt: "In the last 3 months, what has felt ",
    promptEm: "most off?",
    whyWeAsk: "Naming what feels off gives your doctor useful context alongside any results.",
    summaryLabel: "What feels off",
    allowsOther: true,
    otherPlaceholder: "Tell us what else has felt off",
    options: [
      "Low energy / afternoon crash",
      "Brain fog / poor focus",
      "Low mood / anxiety / irritability",
      "Poor sleep quality",
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
    whyWeAsk: "Alcohol, smoking and vaping directly shift several of the markers we test.",
    summaryLabel: "Habits",
  },
  {
      id: "conditions",
      kind: "chips",
      prompt: "Do you have any existing ",
      promptEm: "medical conditions?",
      whyWeAsk: "Existing conditions help your doctor interpret your results and tailor recommendations safely.",
      summaryLabel: "Medical conditions",
      allowsOther: true,
      otherBeforeLast: true,
    otherPlaceholder: "Tell us about any other medical conditions",
    options: [
      "Hypertension",
      "Diabetes",
      "Asthma",
      "Chronic kidney disease",
      "Hyperlipidaemia",
      "Autoimmune disease",
      "Previous heart attack or stroke",
      "Mental health conditions",
      "Cancer",
      "None",
    ],
  },
  {
    id: "family",
    kind: "chips",
    prompt: "Any of these in your ",
    promptEm: "close family?",
    helper: "Parents and siblings count most.",
    whyWeAsk: "Family history changes which prevention targets your doctor sets first.",
    summaryLabel: "Family history",
    allowsOther: true,
    otherPlaceholder: "Tell us about any other family history",
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
    allowsOther: true,
    otherPlaceholder: "Tell us about any other supplements or medications",
    options: [
      "Multivitamin",
      "Vitamin D",
      "Fish oil / omega-3",
      "Magnesium",
      "Protein powder",
      "Creatine",
      "Traditional / herbal remedies",
      PRESCRIPTION_MEDICATION_OPTION,
      "Nothing at the moment",
    ],
  },
  {
    id: "allergies",
    kind: "chips",
    prompt: "Do you have any ",
    promptEm: "allergies to medication?",
    whyWeAsk: "Allergies to medication help your doctor prescribe and recommend treatments safely.",
    summaryLabel: "Allergies to medication",
    allowsOther: true,
    otherPlaceholder: "Tell us about any other allergies to medication",
    options: [
      "Penicillin / amoxicillin",
      "Cephalosporin antibiotics",
      "Sulfonamide antibiotics (sulfa)",
      "NSAIDs (aspirin, ibuprofen, naproxen)",
      "Anticonvulsants",
      "Opioid pain medicines",
      "Anaesthetic medicines",
      "Contrast dye",
      "Not that I'm aware of",
    ],
  },
  {
    id: "reports",
    kind: "reports",
    prompt: "Share what you already ",
    promptEm: "have",
    whyWeAsk:
      "Existing reports help your doctor connect your current profile with what has already been measured.",
    summaryLabel: "Previous reports",
    required: true,
  },
];

export const STEP_COUNT = STEPS.length;

export const EXERCISE_OPTIONS = ["0", "1–2", "3–4", "5+"] as const;
export const DIET_OPTIONS = ["Mostly home-cooked", "Mixed", "Mostly eating out"] as const;
export const MEN_ALCOHOL_OPTIONS = [
  "Rarely / never",
  "14 or less drinks a week",
  "15 or more drinks a week",
] as const;
export const WOMEN_ALCOHOL_OPTIONS = [
  "Rarely / never",
  "7 or less drinks a week",
  "8 or more drinks a week",
] as const;
export const SMOKING_OPTIONS = [
  "Never",
  "Former user",
  "Occasional / social user",
  "Daily / regularly",
] as const;
export const SMOKING_PRODUCT_OPTIONS = ["Cigarettes / Cigars", "Vapes / E-cigarettes"] as const;

export type AlcoholOption =
  | (typeof MEN_ALCOHOL_OPTIONS)[number]
  | (typeof WOMEN_ALCOHOL_OPTIONS)[number];
export type SmokingOption = (typeof SMOKING_OPTIONS)[number];
export type SmokingProductOption = (typeof SMOKING_PRODUCT_OPTIONS)[number];

export function alcoholOptionsForSex(sex: "Male" | "Female") {
  return sex === "Female" ? WOMEN_ALCOHOL_OPTIONS : MEN_ALCOHOL_OPTIONS;
}

/** Keeps the alcohol answer meaningful if the member corrects their gender. */
export function alcoholOptionForSex(
  option: AlcoholOption,
  sex: "Male" | "Female",
): AlcoholOption {
  if (option === "Rarely / never") return option;
  const options = alcoholOptionsForSex(sex);
  return option.includes("or less") ? options[1] : options[2];
}

export const OTHER_OPTION = "Other";
export const NOTHING_MAJOR_OPTION = "Nothing major — mostly prevention";

export const EXCLUSIVE_PROFILE_OPTIONS = {
  conditions: "None",
  family: "None that I know of",
  supplements: "Nothing at the moment",
  allergies: "Not that I'm aware of",
} as const;

export type ProfileAnswers = {
  reportSelections: ReportSelection[];
  uploadedReports: UploadedReport[];
  // Identity fields for the Innoquest request form. The source of truth is
  // app.member_profiles / app.profiles; these are mirrored into the onboarding
  // draft so the flow can edit them, and pushed back on save.
  identity: { fullName: string; icPassportNo: string; dateOfBirth: string; address: string; phone: string };
  basics: { preferredName: string; age: number; sex: "Male" | "Female"; heightCm: number; weightKg: number };
  reason: string[];
  reasonOther: string;
  goals: string[];
  goalsOther: string;
  symptoms: string[];
  symptomsOther: string;
  lifestyle: {
    sleepHours: number;
    exerciseDays: (typeof EXERCISE_OPTIONS)[number];
    diet: (typeof DIET_OPTIONS)[number];
    stress: number;
  };
  habits: {
    alcohol: AlcoholOption;
    smoking: SmokingOption;
    smokingProducts: SmokingProductOption[];
  };
  conditions: string[];
  conditionsOther: string;
  family: string[];
  familyOther: string;
  supplements: string[];
  supplementsOther: string;
  prescriptionMedicationDetails: string;
  allergies: string[];
  allergiesOther: string;
};

/** Formats the derived BMI for the patient and doctor brief hero summaries. */
export function bmiLabel(heightCm: number, weightKg: number): string | null {
  if (!(heightCm > 0) || !(weightKg > 0)) return null;
  const bmi = weightKg / (heightCm / 100) ** 2;
  return Number.isFinite(bmi) ? `${bmi.toFixed(1)} kg/m²` : null;
}

/**
 * Onboarding answers are persisted as JSON. Normalize earlier answer labels
 * whenever a saved draft is loaded so the current controls always have a
 * selected option, while retaining the answer's low/high intent.
 */
export function normalizeHabits(
  habits: Partial<ProfileAnswers["habits"]>,
  sex: "Male" | "Female",
): ProfileAnswers["habits"] {
  const savedAlcohol = habits.alcohol as string | undefined;
  const savedSmoking = habits.smoking as string | undefined;
  const alcoholOptions = alcoholOptionsForSex(sex);
  const alcohol = savedAlcohol === "Rarely / never"
    ? savedAlcohol
    : savedAlcohol?.includes("or less") || savedAlcohol === "Socially"
      ? alcoholOptions[1]
      : savedAlcohol?.includes("or more") || savedAlcohol === "Most days"
        ? alcoholOptions[2]
        : alcoholOptions[1];
  const smoking = savedSmoking === "Former smoker"
    ? "Former user"
    : savedSmoking === "Current smoker"
      ? "Daily / regularly"
      : SMOKING_OPTIONS.includes(savedSmoking as SmokingOption)
        ? savedSmoking as SmokingOption
        : "Never";
  const smokingProducts = Array.isArray(habits.smokingProducts)
    ? habits.smokingProducts.filter((product): product is SmokingProductOption =>
        SMOKING_PRODUCT_OPTIONS.includes(product as SmokingProductOption),
      )
    : [];

  return { alcohol, smoking, smokingProducts: smoking === "Never" ? [] : smokingProducts };
}

export const DEFAULT_ANSWERS: ProfileAnswers = {
  reportSelections: [],
  uploadedReports: [],
  identity: { fullName: "", icPassportNo: "", dateOfBirth: "", address: "", phone: "" },
  basics: { preferredName: "", age: 36, sex: "Male", heightCm: 173, weightKg: 76 },
  reason: [],
  reasonOther: "",
  goals: [],
  goalsOther: "",
  symptoms: [],
  symptomsOther: "",
  lifestyle: { sleepHours: 6.5, exerciseDays: "1–2", diet: "Mixed", stress: 3 },
  habits: { alcohol: "14 or less drinks a week", smoking: "Never", smokingProducts: [] },
  conditions: [],
  conditionsOther: "",
  family: [],
  familyOther: "",
  supplements: [],
  supplementsOther: "",
  prescriptionMedicationDetails: "",
  allergies: [],
  allergiesOther: "",
};
