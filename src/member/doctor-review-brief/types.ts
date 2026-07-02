// ─── Doctor Review Brief · data model ─────────────────────────────────────────
// Shapes the intake captures and the derived "living brief". Kept intentionally
// close to the product brief so it can grow (family history, detailed lifestyle,
// real report parsing) without reshaping the core.

export type ReportAvailability =
  | "reports"
  | "genetic_reports"
  | "wearable_only"
  | "no_reports"
  | "not_sure";

export type ReportUploadType = "reports" | "genetic_reports" | "wearable_only";

// Internal grouping only — never surfaced as if a file's contents were parsed.
export type UploadCategory =
  | "blood"
  | "urine"
  | "dna"
  | "wearable"
  | "body_composition"
  | "gut_microbiome"
  | "physical_assessment"
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

export type BriefSource =
  | "user_answer"
  | "uploaded_report"
  | "system_generated";

// Sections the brief can reveal. Predefined, but only shown once they hold items.
export type BriefSectionId =
  | "reason"
  | "uploads"
  | "goals"
  | "symptoms"
  | "lifestyle"
  | "supplements"
  | "documentSummary"
  | "flaggedMarkers"
  | "reviewAreas"
  | "outOfRange"
  | "relationships"
  | "lifestyleContext"
  | "doctorQuestions"
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
  reportSelections?: ReportUploadType[];
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
  // AI-generated insights per uploaded file (keyed by fileId)
  uploadsConfirmedAt?: string;
  aiDocumentInsights?: Record<string, DocumentInsight>;
  briefSynthesis?: BriefSynthesis;
  dynamicQuestionQueue?: DynamicQuestion[];
  answeredDynamicQuestions?: AnsweredDynamicQuestion[];
  synthesisStatus?: BriefSynthesis["status"];
  // Deferred from the required v1 path, kept in the model for later:
  familyHistory?: string;
  priorScreeningHistory?: string;
  changeReadiness?: string[];
  createdAt: string;
  updatedAt: string;
};

// ─── Question definitions (declarative) ───────────────────────────────────────

export type QuestionType =
  | "single"
  | "multi"
  | "dynamic"
  | "text"
  | "snapshot"
  | "supplements";

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
  dynamicQuestionId?: string;
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

// ─── Structured markers ───────────────────────────────────────────────────────
// Extracted exactly as printed on the report — value, unit, reference range and
// whether the report itself marks the value out of range. Never AI-graded.

export type MarkerFlag = "high" | "low" | "abnormal" | null;

export type ExtractedMarker = {
  name: string;
  value?: string;
  unit?: string;
  referenceRange?: string;
  flag: MarkerFlag;
};

export type MarkerFinding = ExtractedMarker & {
  id: string; // `${fileId}:${canonicalKey}:${index}`
  canonicalKey?: string; // normalized key, e.g. "egfr", "vitamin_b12"
  panel?: string; // "kidney" | "lipids" | …
  sourceFileId: string;
  sourceLabel?: string; // "Lipid Panel · BP Healthcare"
};

export type MarkerRelationship = {
  id: string;
  title: string; // "Creatinine and eGFR move together"
  markers: string[];
  note: string; // factual restatement only, never diagnostic
};

// ─── AI document insights ─────────────────────────────────────────────────────
// Populated by the brief pipeline after a file is uploaded. Never surfaces
// clinical interpretations — only printed report facts + a patient question.

export type DocumentInsightStatus =
  | "analyzing"
  | "done"
  | "needs_review"
  | "error";

export type DocumentInsight = {
  fileId: string;
  documentType: string;
  provider: string | null;
  reportDate: string | null;
  textExcerpt?: string;
  sections: string[];
  markers: ExtractedMarker[];
  visibleMarkers: string[];
  flaggedMarkers: string[];
  doctorReviewAreas: string[];
  patientFacingSummary: string;
  question: string;
  questionId: string; // stable ID used as FlowStep key + contextAnswers key
  status: DocumentInsightStatus;
};

// ─── Cross-document synthesis ─────────────────────────────────────────────────

export type EvidenceRef = {
  label: string;
  source?: string;
};

export type BriefTheme = {
  id: string;
  title: string;
  summary: string;
  evidence: EvidenceRef[];
  confidence: "high" | "medium" | "low";
};

export type DynamicQuestion = {
  id: string;
  prompt: string;
  options: string[];
  allowFreeText: boolean;
  whyWeAsk: string;
  triggeredBy?: string[]; // marker names that prompted this question
  origin?: "ai" | "rules";
};

export type AnsweredDynamicQuestion = {
  questionId: string;
  prompt: string;
  answer: string;
  answeredAt: string;
};

export type BriefSynthesis = {
  status: "idle" | "synthesizing" | "ready" | "error";
  narrative: string;
  themes: BriefTheme[];
  outOfRange: MarkerFinding[];
  relationships: MarkerRelationship[];
  lifestyleContext: string[];
  doctorQuestions: string[];
  nextQuestions: DynamicQuestion[];
  degraded?: boolean; // true when built by basic matching instead of full synthesis
  progress: {
    documentsRead: number;
    markersRead: number;
    outOfRangeCount: number;
    questionsQueued: number;
  };
  updatedAt?: string;
  error?: string;
};

// ─── Agent activity feed ──────────────────────────────────────────────────────
// Local (non-persisted) view of the pipeline's reasoning steps, driven by SSE
// `stage` / `doc` / `error` events.

export type AgentStepStatus = "pending" | "active" | "done" | "error";

export type AgentStep = {
  id: string; // "extract" | "classify" | "compose"
  label: string;
  detail?: string;
  status: AgentStepStatus;
};

// ─── "Top of mind highlights to doctor" ───────────────────────────────────────
// Aggregated, clinician-facing salient points derived from the uploads. Kept
// strictly to (a) what a lab itself flagged out-of-range and (b) coverage gaps
// against a curated preventive-panel list — never AI-invented findings.

export type HighlightKind = "flagged" | "coverage_gap";

export type DoctorHighlight = {
  id: string;
  kind: HighlightKind;
  title: string; // short lead, e.g. "Flagged out of range"
  detail: string; // the marker names / gap list
  sourceLabel?: string; // e.g. "Lipid Panel · BP Healthcare"
};

// ─── Attachments (Claude-style file cards) ─────────────────────────────────────

export type AttachmentKind = "pdf" | "image" | "sheet" | "doc";

export type AttachmentCard = {
  fileId: string;
  fileName: string;
  kind: AttachmentKind;
  ext: string; // upper-case extension shown on the card, e.g. "PDF"
  typeLabel: string; // classified document type or category label
  sizeLabel: string; // e.g. "612 KB"
  status: DocumentInsightStatus | "uploaded";
  flaggedCount: number;
};

export const SOURCE_LABEL: Record<BriefSource, string> = {
  user_answer: "from your answer",
  uploaded_report: "uploaded for doctor review",
  system_generated: "prepared from uploaded document",
};
