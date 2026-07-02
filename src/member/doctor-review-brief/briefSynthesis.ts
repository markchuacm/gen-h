// ─── Doctor Review Brief · cross-document synthesis client ────────────────────
// Sends extracted document facts + patient answers to our backend synthesis route.

import type {
  AnsweredDynamicQuestion,
  BriefSynthesis,
  DocumentInsight,
  IntakeState,
  UploadedFile,
} from "./types";

const SYNTHESIS_ENDPOINT = "/api/doctor-review-brief/synthesize";
const SYNTHESIS_TIMEOUT_MS = 35_000;

type SynthesisApiResponse =
  | { ok: true; result: BriefSynthesis }
  | { ok: false; error: string };

function documentPayload(
  files: UploadedFile[],
  insights?: Record<string, DocumentInsight>,
) {
  return files.map((file) => {
    const insight = insights?.[file.id];
    return {
      fileId: file.id,
      fileName: file.name,
      category: file.detectedCategory,
      status: insight?.status ?? "uploaded",
      documentType: insight?.documentType,
      provider: insight?.provider,
      reportDate: insight?.reportDate,
      textExcerpt: insight?.textExcerpt
        ? insight.textExcerpt.slice(0, 12_000)
        : "",
      sections: insight?.sections ?? [],
      visibleMarkers: insight?.visibleMarkers ?? [],
      flaggedMarkers: insight?.flaggedMarkers ?? [],
      doctorReviewAreas: insight?.doctorReviewAreas ?? [],
      patientFacingSummary: insight?.patientFacingSummary,
    };
  });
}

function answersPayload(state: IntakeState) {
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
          textExcerpt: i.textExcerpt ? i.textExcerpt.slice(0, 12_000) : "",
          sections: i.sections,
          visibleMarkers: i.visibleMarkers,
          flaggedMarkers: i.flaggedMarkers,
          doctorReviewAreas: i.doctorReviewAreas,
          question: i.question,
        },
      ]),
    ),
    answers: answersPayload(state),
    dynamic: state.answeredDynamicQuestions ?? [],
  });
}

export async function synthesizeBrief(
  state: IntakeState,
  answeredDynamicQuestions: AnsweredDynamicQuestion[],
): Promise<BriefSynthesis> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SYNTHESIS_TIMEOUT_MS);

  try {
    const res = await fetch(SYNTHESIS_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documents: documentPayload(
          state.uploadedFiles,
          state.aiDocumentInsights,
        ),
        answers: answersPayload(state),
        answeredDynamicQuestions,
      }),
    });

    const data = (await res.json().catch(() => ({
      ok: false,
      error: "Brief synthesis failed.",
    }))) as SynthesisApiResponse;

    if (!res.ok || !data.ok) {
      throw new Error(data.ok ? "Brief synthesis failed." : data.error);
    }

    return data.result;
  } finally {
    clearTimeout(timeout);
  }
}
