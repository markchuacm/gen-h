// ─── Doctor Review Brief · data model ─────────────────────────────────────────
// Shapes the intake captures and the derived "living brief". Kept intentionally
// close to the product brief so it can grow (family history, detailed lifestyle,
// real report parsing) without reshaping the core.

export type ReportAvailability = "reports" | "wearable_only" | "no_reports" | "not_sure";

// Internal grouping only — never surfaced as if a file's contents were parsed.
export type UploadCategory =
  | "blood"
  | "urine"
  | "dna"
  | "wearable"
  | "body_composition"
  | "specialist"
  | "screening"
  | "other";

export type UploadStatus = "uploading" | "uploaded" | "error";

export type UploadedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: UploadStatus;
  detectedCategory?: UploadCategory;
};

export type BriefSource = "user_answer" | "uploaded_report" | "system_generated";

// Sections the brief can reveal. Predefined, but only shown once they hold items.
export type BriefSectionId =
  | "reason"
  | "uploads"
  | "goals"
  | "symptoms"
  | "lifestyle"
  | "supplements"
  | "reviewAreas"
  | "questions";

export type LifestyleSnapshot = {
  sleepHours?: string;
  sleepQuality?: string;
  exercise?: string;
  diet?: string;
  // Optional deeper detail — surfaced only via "Add more detail", never required.
  bedtime?: string;
  wakeTime?: string;
  caffeineAlcohol?: string;
  exerciseTypes?: string;
  dietPreference?: string;
  sweetTooth?: string;
};

export type SupplementsAndMeds = {
  supplements?: string;
  medications?: string;
  allergies?: string;
  knownConditions?: string;
};

export type IntakeState = {
  hasReports?: ReportAvailability;
  uploadedFiles: UploadedFile[];
  reason: string[];
  reasonFreeText?: string;
  contextAnswers: Record<string, string>; // keyed by context-question id
  goals: string[];
  goalsFreeText?: string;
  symptoms: string[];
  symptomsFreeText?: string;
  lifestyle: LifestyleSnapshot;
  supplementsAndMeds: SupplementsAndMeds;
  // Deferred from the required v1 path, kept in the model for later:
  familyHistory?: string;
  priorScreeningHistory?: string;
  changeReadiness?: string[];
  createdAt: string;
  updatedAt: string;
};

// ─── Question definitions (declarative) ───────────────────────────────────────

export type QuestionType = "single" | "multi" | "text" | "snapshot" | "supplements";

export type Question = {
  id: string;
  section: BriefSectionId;
  itemLabel?: string;
  type: QuestionType;
  prompt: string;
  helper?: string;
  whyWeAsk?: string;
  options?: string[];
  allowFreeText?: boolean;
  freeTextLabel?: string;
  required?: boolean; // when false, "Skip for now" is offered
};

// ─── Derived brief (single source of truth = IntakeState) ─────────────────────

export type BriefItem = {
  id: string;
  label?: string;
  value: string;
  source: BriefSource;
};

export type RenderSection = {
  id: BriefSectionId;
  title: string;
  items: BriefItem[];
  editQuestionId?: string; // where "Edit" jumps in the flow ("upload" for files)
};

export type BriefStatus = "getting_started" | "useful" | "doctor_ready";

export const SOURCE_LABEL: Record<BriefSource, string> = {
  user_answer: "from your answer",
  uploaded_report: "uploaded for doctor review",
  system_generated: "pending clinician review",
};
