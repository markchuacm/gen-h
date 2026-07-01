// ─── Doctor Review Brief · engine ─────────────────────────────────────────────
// Pure functions that turn captured answers into the derived "living brief".
// The brief is always derived from IntakeState (single source of truth) so the
// preview and the panel can never drift out of sync.
//
// Safety: detectCategory only groups/labels a file by its name — it never claims
// anything about the file's contents. No medical findings are ever inferred.

import type {
  BriefItem,
  BriefSource,
  BriefStatus,
  IntakeState,
  RenderSection,
  UploadCategory,
} from "./types";

const CATEGORY_KEYWORDS: Array<[UploadCategory, string[]]> = [
  ["dna", ["dna", "genetic", "genome", "23andme", "ancestry"]],
  ["urine", ["urine", "urinalysis"]],
  ["body_composition", ["dexa", "inbody", "bodycomp", "body-composition", "bodyfat"]],
  ["wearable", ["wearable", "oura", "whoop", "garmin", "fitbit", "watch", "apple-health"]],
  ["blood", ["blood", "cbc", "lipid", "panel", "serum", "haemo", "hemo", "labs", "lab-"]],
  ["screening", ["screening", "screen", "checkup", "check-up", "medical-report"]],
  ["specialist", ["specialist", "referral", "cardio", "endo", "consult"]],
];

export const CATEGORY_LABEL: Record<UploadCategory, string> = {
  blood: "Blood test",
  urine: "Urine test",
  dna: "DNA / genetic report",
  wearable: "Wearable data",
  body_composition: "Body composition",
  specialist: "Specialist report",
  screening: "Health screening",
  other: "Health document",
};

export function detectCategory(fileName: string, mimeType = ""): UploadCategory {
  const haystack = `${fileName} ${mimeType}`.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => haystack.includes(kw))) return category;
  }
  return "other";
}

// ─── Brief section builders ───────────────────────────────────────────────────

function item(id: string, value: string, source: BriefSource, label?: string): BriefItem {
  return { id, value, source, label };
}

function listItems(
  prefix: string,
  values: string[],
  freeText: string | undefined,
  source: BriefSource,
): BriefItem[] {
  const items = values.map((v, i) => item(`${prefix}-${i}`, v, source));
  if (freeText && freeText.trim()) items.push(item(`${prefix}-free`, freeText.trim(), source));
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

const SUPPLEMENT_FIELDS: Array<[keyof IntakeState["supplementsAndMeds"], string]> = [
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
    ].forEach((v, i) => out.push(item(`ra-baseline-${i}`, v, "system_generated")));
  }
  return out;
}

/** Only sections that currently hold items are returned (progressive reveal). */
export function buildBriefSections(state: IntakeState): RenderSection[] {
  const sections: RenderSection[] = [];

  const reason = listItems("reason", state.reason, state.reasonFreeText, "user_answer");
  if (reason.length) sections.push({ id: "reason", title: "Why I'm here", items: reason, editQuestionId: "reason" });

  if (state.uploadedFiles.length) {
    const insights = state.aiDocumentInsights ?? {};
    sections.push({
      id: "uploads",
      title: "Uploaded context",
      editQuestionId: "upload",
      items: state.uploadedFiles.map((f) => {
        const insight = insights[f.id];
        const labelParts = [
          insight?.documentType || (f.detectedCategory ? CATEGORY_LABEL[f.detectedCategory] : "Health document"),
          insight?.provider,
          insight?.reportDate,
        ].filter(Boolean);
        return item(`file-${f.id}`, `${f.name}${labelParts.length ? ` · ${labelParts.join(" · ")}` : ""}`, "uploaded_report");
      }),
    });

    const visibleItems = state.uploadedFiles.flatMap((f) => {
      const insight = insights[f.id];
      if (insight?.status !== "done") return [];
      const values = [...insight.sections, ...insight.visibleMarkers].slice(0, 18);
      return values.length
        ? [item(`visible-${f.id}`, values.join(" · "), "system_generated", insight.documentType)]
        : [];
    });
    if (visibleItems.length) {
      sections.push({
        id: "documentSummary",
        title: "Visible in report",
        editQuestionId: "upload",
        items: visibleItems,
      });
    }

    const flaggedItems = state.uploadedFiles.flatMap((f) => {
      const insight = insights[f.id];
      if (insight?.status !== "done" || insight.flaggedMarkers.length === 0) return [];
      return [item(`flagged-${f.id}`, insight.flaggedMarkers.join(" · "), "system_generated", "Marked in report")];
    });
    if (flaggedItems.length) {
      sections.push({
        id: "flaggedMarkers",
        title: "Marked for doctor review",
        editQuestionId: "upload",
        items: flaggedItems,
      });
    }
  }

  const goals = listItems("goals", state.goals, state.goalsFreeText, "user_answer");
  if (goals.length) sections.push({ id: "goals", title: "Main goals", items: goals, editQuestionId: "goals" });

  const symptoms = listItems("symptoms", state.symptoms, state.symptomsFreeText, "user_answer");
  if (symptoms.length)
    sections.push({ id: "symptoms", title: "What feels off", items: symptoms, editQuestionId: "symptoms" });

  const lifestyle = LIFESTYLE_FIELDS.flatMap(([key, label]) => {
    const v = state.lifestyle[key];
    return v && v.trim() ? [item(`ls-${key}`, v.trim(), "user_answer", label)] : [];
  });
  if (lifestyle.length)
    sections.push({ id: "lifestyle", title: "Lifestyle context", items: lifestyle, editQuestionId: "lifestyle" });

  const supplements = SUPPLEMENT_FIELDS.flatMap(([key, label]) => {
    const v = state.supplementsAndMeds[key];
    return v && v.trim() ? [item(`sm-${key}`, v.trim(), "user_answer", label)] : [];
  });
  if (supplements.length)
    sections.push({
      id: "supplements",
      title: "Supplements / medications",
      items: supplements,
      editQuestionId: "supplements",
    });

  const contextItems = Object.entries(state.contextAnswers).flatMap(([qid, value]) =>
    value && value.trim() ? [item(`ctx-${qid}`, value.trim(), "user_answer")] : [],
  );
  if (contextItems.length)
    sections.push({ id: "questions", title: "Notes for your doctor", items: contextItems });

  const reviewAreas = computeReviewAreas(state);
  if (reviewAreas.length)
    sections.push({ id: "reviewAreas", title: "Review areas for doctor", items: reviewAreas });

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
  ].filter(Boolean).length;

  const filesUploaded = state.uploadedFiles.length;
  const reviewAreas = computeReviewAreas(state).length;
  const score = captured + (filesUploaded > 0 ? 1 : 0);

  const status: BriefStatus = score >= 4 ? "doctor_ready" : score >= 2 ? "useful" : "getting_started";
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
