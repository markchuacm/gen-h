// ─── Doctor Review Brief · document analysis client ───────────────────────────
// Browser code must never read OpenRouter secrets or call OpenRouter directly.
// This client sends bounded document context to our own backend endpoint.

import type { UploadCategory } from "./types";

const ANALYSIS_ENDPOINT = "/api/doctor-review-brief/analyze-document";
const ANALYSIS_TIMEOUT_MS = 30_000;

export type DocumentAnalysisResult = {
  documentType: string;
  provider: string | null;
  reportDate: string | null;
  sections: string[];
  visibleMarkers: string[];
  flaggedMarkers: string[];
  doctorReviewAreas: string[];
  patientFacingSummary: string;
  question: string;
  extractionStatus: "extracted" | "needs_review";
};

type AnalysisApiResponse =
  | { ok: true; result: DocumentAnalysisResult }
  | { ok: false; error: string };

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function canReadAsText(file: File): boolean {
  return (
    file.type === "text/csv" ||
    file.type.startsWith("text/") ||
    file.name.toLowerCase().endsWith(".csv") ||
    file.name.toLowerCase().endsWith(".txt")
  );
}

export async function analyzeDocument(
  file: File,
  category: UploadCategory | undefined,
): Promise<DocumentAnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    let textExcerpt: string | undefined;

    if (canReadAsText(file)) {
      try {
        textExcerpt = (await readAsText(file)).slice(0, 4_000);
      } catch {
        // Non-fatal: filename and category still give the doctor useful context.
      }
    }

    const res = await fetch(ANALYSIS_ENDPOINT, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        category,
        textExcerpt,
      }),
    });

    const data = (await res.json().catch(() => ({
      ok: false,
      error: "Document analysis failed.",
    }))) as AnalysisApiResponse;

    if (!res.ok || !data.ok) {
      throw new Error(data.ok ? "Document analysis failed." : data.error);
    }

    return data.result;
  } finally {
    clearTimeout(timeout);
  }
}
