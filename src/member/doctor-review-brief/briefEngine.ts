// ─── Doctor Review Brief · engine ─────────────────────────────────────────────
// Pure functions that turn captured answers into the derived "living brief".
// The brief is always derived from IntakeState (single source of truth) so the
// preview and the panel can never drift out of sync.
//
// Safety: detectCategory only groups/labels a file by its name — it never claims
// anything about the file's contents. No medical findings are ever inferred.

import type {
  AttachmentCard,
  AttachmentKind,
  BriefItem,
  BriefSource,
  BriefStatus,
  DoctorHighlight,
  IntakeState,
  RenderSection,
  UploadCategory,
} from "./types";

const CATEGORY_KEYWORDS: Array<[UploadCategory, string[]]> = [
  ["dna", ["dna", "genetic", "genome", "23andme", "ancestry"]],
  [
    "gut_microbiome",
    [
      "microbiome",
      "gut-health",
      "guthealth",
      "stool",
      "faecal",
      "fecal",
      "viome",
      "zoe",
    ],
  ],
  ["urine", ["urine", "urinalysis"]],
  [
    "body_composition",
    ["dexa", "inbody", "bodycomp", "body-composition", "bodyfat"],
  ],
  [
    "physical_assessment",
    [
      "physical-exam",
      "physicalexam",
      "vo2",
      "fitness-assessment",
      "functional-movement",
      "posture",
      "gait",
      "physio",
    ],
  ],
  [
    "wearable",
    ["wearable", "oura", "whoop", "garmin", "fitbit", "watch", "apple-health"],
  ],
  [
    "blood",
    [
      "blood",
      "cbc",
      "lipid",
      "panel",
      "serum",
      "haemo",
      "hemo",
      "labs",
      "lab-",
    ],
  ],
  [
    "screening",
    ["screening", "screen", "checkup", "check-up", "medical-report"],
  ],
  ["specialist", ["specialist", "referral", "cardio", "endo", "consult"]],
];

export const CATEGORY_LABEL: Record<UploadCategory, string> = {
  blood: "Blood test",
  urine: "Urine test",
  dna: "DNA / genetic report",
  wearable: "Wearable data",
  body_composition: "Body composition",
  gut_microbiome: "Gut microbiome test",
  physical_assessment: "Physical assessment",
  specialist: "Specialist report",
  screening: "Health screening",
  other: "Health document",
};

export function detectCategory(
  fileName: string,
  mimeType = "",
): UploadCategory {
  const haystack = `${fileName} ${mimeType}`.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => haystack.includes(kw))) return category;
  }
  return "other";
}

// ─── "Top of mind highlights to doctor" ───────────────────────────────────────
// Temporary fallback while synthesis is pending: only markers the report itself
// flags out of range (from structured extraction). Cross-document themes come
// from the pipeline's compose stage.
export function computeDoctorHighlights(state: IntakeState): DoctorHighlight[] {
  const insights = state.aiDocumentInsights ?? {};
  const out: DoctorHighlight[] = [];

  state.uploadedFiles.forEach((file) => {
    const insight = insights[file.id];
    if (insight?.status !== "done") return;
    const flagged = (insight.markers ?? []).filter((m) => m.flag);
    if (flagged.length === 0) return;
    out.push({
      id: `hl-flag-${file.id}`,
      kind: "flagged",
      title: "Flagged out of range",
      detail: flagged.map((m) => m.name).join(" · "),
      sourceLabel:
        [insight.documentType, insight.provider].filter(Boolean).join(" · ") ||
        file.name,
    });
  });

  return out;
}

// ─── Attachments (Claude-style file cards) ─────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extensionOf(fileName: string, mimeType: string): string {
  const dot = fileName.lastIndexOf(".");
  if (dot >= 0 && dot < fileName.length - 1)
    return fileName.slice(dot + 1).toLowerCase();
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.startsWith("image/")) return mimeType.slice(6);
  if (mimeType.includes("csv")) return "csv";
  return "file";
}

function attachmentKind(mimeType: string, ext: string): AttachmentKind {
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (
    mimeType.startsWith("image/") ||
    ["png", "jpg", "jpeg", "heic", "webp", "gif"].includes(ext)
  )
    return "image";
  if (
    mimeType.includes("csv") ||
    mimeType.includes("sheet") ||
    ["csv", "tsv", "xls", "xlsx"].includes(ext)
  )
    return "sheet";
  return "doc";
}

export function computeAttachments(state: IntakeState): AttachmentCard[] {
  const insights = state.aiDocumentInsights ?? {};
  return state.uploadedFiles.map((file) => {
    const insight = insights[file.id];
    const ext = extensionOf(file.name, file.type);
    const typeLabel =
      insight?.status === "done" && insight.documentType
        ? insight.documentType
        : insight?.status === "analyzing"
          ? "Reading…"
          : insight?.status === "needs_review"
            ? "Needs doctor review"
            : insight?.status === "error"
              ? "Re-add this file to analyze it"
              : file.detectedCategory
                ? CATEGORY_LABEL[file.detectedCategory]
                : "Document";
    return {
      fileId: file.id,
      fileName: file.name,
      kind: attachmentKind(file.type, ext),
      ext: ext.toUpperCase().slice(0, 4),
      typeLabel,
      sizeLabel: formatBytes(file.size),
      status: insight?.status ?? "uploaded",
      flaggedCount:
        insight?.status === "done" ? insight.flaggedMarkers.length : 0,
    };
  });
}

// ─── Brief section builders ───────────────────────────────────────────────────

function item(
  id: string,
  value: string,
  source: BriefSource,
  label?: string,
): BriefItem {
  return { id, value, source, label };
}

function listItems(
  prefix: string,
  values: string[],
  freeText: string | undefined,
  source: BriefSource,
): BriefItem[] {
  const items = values.map((v, i) => item(`${prefix}-${i}`, v, source));
  if (freeText && freeText.trim())
    items.push(item(`${prefix}-free`, freeText.trim(), source));
  return items;
}

const LIFESTYLE_FIELDS: Array<[keyof IntakeState["lifestyle"], string]> = [
  ["sleepHours", "Sleep"],
  ["sleepQuality", "Sleep quality"],
  ["exercise", "Exercise"],
  ["diet", "Diet"],
  ["bedtime", "Bedtime"],
  ["wakeTime", "Wake time"],
  ["caffeineAlcohol", "Caffeine / alcohol"],
  ["exerciseTypes", "Exercise types"],
  ["dietPreference", "Diet style"],
  ["sweetTooth", "Sweet tooth"],
];

const SUPPLEMENT_FIELDS: Array<
  [keyof IntakeState["supplementsAndMeds"], string]
> = [
  ["supplements", "Supplements"],
  ["medications", "Medications"],
  ["allergies", "Allergies"],
  ["knownConditions", "Known conditions"],
];

/** Generic "topics for your doctor" — never derived from file contents. */
export function computeReviewAreas(state: IntakeState): BriefItem[] {
  const out: BriefItem[] = [];
  const insights = state.aiDocumentInsights ?? {};

  state.uploadedFiles.forEach((file) => {
    const insight = insights[file.id];
    if (insight?.status === "done") {
      insight.doctorReviewAreas.forEach((area, index) => {
        out.push(item(`ra-${file.id}-${index}`, area, "system_generated"));
      });
    }
  });

  if (out.length > 0) return out;

  const cats = new Set<UploadCategory>();
  state.uploadedFiles.forEach((f) => {
    if (!insights[f.id] && f.detectedCategory) cats.add(f.detectedCategory);
  });

  cats.forEach((c) =>
    out.push(
      item(
        `ra-${c}`,
        `${CATEGORY_LABEL[c]} — your doctor will review this with you.`,
        "system_generated",
      ),
    ),
  );

  if (state.hasReports === "no_reports" || state.hasReports === "not_sure") {
    [
      "Understanding your goals and symptoms",
      "Reviewing your lifestyle and history",
      "Deciding which tests are actually worth doing",
      "Avoiding unnecessary testing",
    ].forEach((v, i) =>
      out.push(item(`ra-baseline-${i}`, v, "system_generated")),
    );
  }
  return out;
}

/** Only sections that currently hold items are returned (progressive reveal). */
export function buildBriefSections(state: IntakeState): RenderSection[] {
  const sections: RenderSection[] = [];

  const reason = listItems(
    "reason",
    state.reason,
    state.reasonFreeText,
    "user_answer",
  );
  if (reason.length)
    sections.push({
      id: "reason",
      title: "Why I'm here",
      items: reason,
      editQuestionId: "reason",
    });

  const goals = listItems(
    "goals",
    state.goals,
    state.goalsFreeText,
    "user_answer",
  );
  if (goals.length)
    sections.push({
      id: "goals",
      title: "Main goals",
      items: goals,
      editQuestionId: "goals",
    });

  const symptoms = listItems(
    "symptoms",
    state.symptoms,
    state.symptomsFreeText,
    "user_answer",
  );
  if (symptoms.length)
    sections.push({
      id: "symptoms",
      title: "What feels off",
      items: symptoms,
      editQuestionId: "symptoms",
    });

  const lifestyle = LIFESTYLE_FIELDS.flatMap(([key, label]) => {
    const v = state.lifestyle[key];
    return v && v.trim()
      ? [item(`ls-${key}`, v.trim(), "user_answer", label)]
      : [];
  });
  if (lifestyle.length)
    sections.push({
      id: "lifestyle",
      title: "Lifestyle context",
      items: lifestyle,
      editQuestionId: "lifestyle",
    });

  const supplements = SUPPLEMENT_FIELDS.flatMap(([key, label]) => {
    const v = state.supplementsAndMeds[key];
    return v && v.trim()
      ? [item(`sm-${key}`, v.trim(), "user_answer", label)]
      : [];
  });
  if (supplements.length)
    sections.push({
      id: "supplements",
      title: "Supplements / medications",
      items: supplements,
      editQuestionId: "supplements",
    });

  const contextItems = Object.entries(state.contextAnswers).flatMap(
    ([qid, value]) =>
      value && value.trim() && !qid.startsWith("dyn_")
        ? [item(`ctx-${qid}`, value.trim(), "user_answer")]
        : [],
  );
  if (contextItems.length)
    sections.push({
      id: "questions",
      title: "Notes for your doctor",
      items: contextItems,
    });

  const dynamicAnswerItems = (state.answeredDynamicQuestions ?? []).flatMap(
    (answer) =>
      answer.answer.trim()
        ? [
            item(
              `dyn-${answer.questionId}`,
              answer.answer.trim(),
              "user_answer",
              answer.prompt,
            ),
          ]
        : [],
  );
  if (dynamicAnswerItems.length) {
    sections.push({
      id: "questions",
      title: "Questions answered by you",
      items: dynamicAnswerItems,
    });
  }

  return sections;
}

// ─── Status / counts ──────────────────────────────────────────────────────────

export type BriefSummary = {
  status: BriefStatus;
  areasCaptured: number;
  filesUploaded: number;
  reviewAreas: number;
};

export function computeBriefSummary(state: IntakeState): BriefSummary {
  const captured = [
    state.reason.length > 0 || !!state.reasonFreeText?.trim(),
    state.goals.length > 0 || !!state.goalsFreeText?.trim(),
    state.symptoms.length > 0 || !!state.symptomsFreeText?.trim(),
    Object.values(state.lifestyle).some((v) => v && v.trim()),
    Object.values(state.supplementsAndMeds).some((v) => v && v.trim()),
    (state.answeredDynamicQuestions ?? []).some((q) => q.answer.trim()),
  ].filter(Boolean).length;

  const filesUploaded = state.uploadedFiles.length;
  const reviewAreas = state.briefSynthesis?.themes.length ?? 0;
  const score = captured + (filesUploaded > 0 ? 1 : 0);

  const status: BriefStatus =
    score >= 4 ? "doctor_ready" : score >= 2 ? "useful" : "getting_started";
  return { status, areasCaptured: captured, filesUploaded, reviewAreas };
}

export const STATUS_LABEL: Record<BriefStatus, string> = {
  getting_started: "Getting started",
  useful: "Useful",
  doctor_ready: "Doctor-ready",
};

/** Whether any brief content exists yet — used for the entry card resume state. */
export function briefHasContent(state: IntakeState): boolean {
  return buildBriefSections(state).length > 0 || !!state.hasReports;
}
