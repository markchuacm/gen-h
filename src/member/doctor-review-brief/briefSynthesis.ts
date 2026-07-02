// ─── Doctor Review Brief · pipeline payload builders ──────────────────────────
// Builds /api/doctor-review-brief/process request bodies from IntakeState and
// computes the signature used for commit-based synthesis triggering (a rerun
// only fires when the signature actually changed since the last run).

import type { DocumentPayload } from "./extraction";
import type { ProcessDocumentPayload, ProcessRequest } from "./sse";
import type { DocumentInsight, IntakeState } from "./types";

const INSIGHT_EXCERPT_CAP = 40_000;

export function answersPayload(state: IntakeState) {
  return {
    reason: state.reason,
    reasonFreeText: state.reasonFreeText,
    goals: state.goals,
    goalsFreeText: state.goalsFreeText,
    symptoms: state.symptoms,
    symptomsFreeText: state.symptomsFreeText,
    lifestyle: state.lifestyle,
    supplementsAndMeds: state.supplementsAndMeds,
    contextAnswers: state.contextAnswers,
  };
}

function insightPayload(
  insight: DocumentInsight,
): Omit<DocumentInsight, "questionId"> {
  const { questionId: _questionId, ...rest } = insight;
  return {
    ...rest,
    textExcerpt: insight.textExcerpt
      ? insight.textExcerpt.slice(0, INSIGHT_EXCERPT_CAP)
      : "",
  };
}

/**
 * Documents for a pipeline run. `prepared` holds freshly extracted content for
 * files that still need a full extraction pass; files with a completed insight
 * ride along as prior context so extraction never re-runs for them.
 */
export function buildProcessDocuments(
  state: IntakeState,
  prepared?: Map<string, DocumentPayload>,
): ProcessDocumentPayload[] {
  return state.uploadedFiles.map((file) => {
    const insight = state.aiDocumentInsights?.[file.id];
    const content = prepared?.get(file.id);
    const hasUsableInsight =
      insight &&
      (insight.status === "done" || insight.status === "needs_review") &&
      !content;
    return {
      fileId: file.id,
      fileName: file.name,
      category: file.detectedCategory,
      ...(content?.textExcerpt ? { textExcerpt: content.textExcerpt } : {}),
      ...(content?.images?.length ? { images: content.images } : {}),
      ...(hasUsableInsight ? { insight: insightPayload(insight) } : {}),
    };
  });
}

export function buildProcessRequest(
  state: IntakeState,
  mode: ProcessRequest["mode"],
  opts: {
    prepared?: Map<string, DocumentPayload>;
    askedQuestionIds: string[];
  },
): ProcessRequest {
  return {
    mode,
    documents: buildProcessDocuments(state, opts.prepared),
    answers: answersPayload(state),
    answeredDynamicQuestions: state.answeredDynamicQuestions ?? [],
    askedQuestionIds: opts.askedQuestionIds,
  };
}

/** Change detector for commit-based synthesis triggering. */
export function synthesisSignature(state: IntakeState): string {
  return JSON.stringify({
    uploadsConfirmedAt: state.uploadsConfirmedAt,
    files: state.uploadedFiles.map((f) => f.id),
    insights: Object.fromEntries(
      Object.entries(state.aiDocumentInsights ?? {}).map(([id, i]) => [
        id,
        {
          status: i.status,
          documentType: i.documentType,
          markers: i.markers?.length ?? 0,
          flagged: i.flaggedMarkers,
        },
      ]),
    ),
    answers: answersPayload(state),
    dynamic: state.answeredDynamicQuestions ?? [],
  });
}
