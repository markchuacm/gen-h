// ─── Doctor Review Brief · document analysis (client) ─────────────────────────
// Extracts readable text from an uploaded file, then hands it to our own backend
// (/api/doctor-review-brief/analyze-document), which is the only place the
// OpenRouter key lives. The backend owns model allowlisting and spend controls.
//
// PDFs are text-extracted in the browser with pdf.js (lazy-loaded so it never
// weighs down the initial bundle). Images have no text layer and no vision call
// is made — they still upload for the doctor, just without extracted highlights.

import type { UploadCategory } from "./types";

const ANALYSIS_ENDPOINT = "/api/doctor-review-brief/analyze-document";
const ANALYSIS_TIMEOUT_MS = 30_000;
const MAX_EXTRACT_CHARS = 12_000; // server trims to its own budget; this caps work
const MAX_PDF_PAGES = 12;

export type DocumentAnalysisResult = {
  documentType: string;
  provider: string | null;
  reportDate: string | null;
  textExcerpt?: string;
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

// ─── Text extraction ──────────────────────────────────────────────────────────

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function isPlainText(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type === "text/csv" ||
    file.type.startsWith("text/") ||
    name.endsWith(".csv") ||
    name.endsWith(".txt")
  );
}

function isPdf(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

let pdfWorkerReady = false;

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfWorkerReady) {
    // Vite resolves the `?url` suffix to the hashed asset URL at build time.
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
      .default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfWorkerReady = true;
  }

  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  const pageCount = Math.min(doc.numPages, MAX_PDF_PAGES);
  let text = "";
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const line = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (line) text += `${line}\n`;
    if (text.length >= MAX_EXTRACT_CHARS) break;
  }

  try {
    await loadingTask.destroy();
  } catch {
    /* noop */
  }
  return text.slice(0, MAX_EXTRACT_CHARS);
}

/** Best-effort readable text for the model. Empty string ⇒ nothing to analyze. */
export async function extractText(file: File): Promise<string> {
  try {
    if (isPlainText(file))
      return (await readAsText(file)).slice(0, MAX_EXTRACT_CHARS);
    if (isPdf(file)) return await extractPdfText(file);
  } catch {
    // Extraction failure is non-fatal — the file still uploads for doctor review.
  }
  return "";
}

// ─── Analysis call ────────────────────────────────────────────────────────────

export async function analyzeDocument(
  file: File,
  category: UploadCategory | undefined,
): Promise<DocumentAnalysisResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ANALYSIS_TIMEOUT_MS);

  try {
    const textExcerpt = await extractText(file);

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

    return { ...data.result, textExcerpt };
  } finally {
    clearTimeout(timeout);
  }
}
