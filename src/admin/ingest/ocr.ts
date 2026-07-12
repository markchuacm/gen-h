// OCR fallback for scanned lab pages. Engine: PaddleOCR PP-OCRv4 via ONNX
// Runtime Web (@gutenye/ocr-browser), chosen over Tesseract by benchmarking on
// the real sample reports — it held ~92–93% token recall on biomarker names +
// values vs Tesseract's more variable 83–93% (see the OCR benchmark). Models
// are self-hosted under /ocr-models (no CDN, CSP-safe) and everything here is
// reached only through a dynamic import, so ONNX + the ~15MB models never enter
// the main admin bundle. This module is the single swap-point for the engine.
import type { PDFPageProxy } from "pdfjs-dist";

const MODELS = {
  detectionPath: "/ocr-models/ch_PP-OCRv4_det_infer.onnx",
  recognitionPath: "/ocr-models/ch_PP-OCRv4_rec_infer.onnx",
  dictionaryPath: "/ocr-models/ppocr_keys_v1.txt",
};

// PaddleOCR is heavy to spin up; keep one instance for the whole ingest run.
let ocrPromise: Promise<{ detect: (image: string) => Promise<Array<{ text: string }>> }> | null = null;

async function getOcr() {
  if (!ocrPromise) {
    ocrPromise = import("@gutenye/ocr-browser").then((m) => m.default.create({ models: MODELS }));
  }
  return ocrPromise;
}

/** Render a pdf.js page to a 2× canvas and OCR it into text lines. */
export async function ocrPdfPage(page: PDFPageProxy, scale = 2): Promise<string[]> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) return [];
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const ocr = await getOcr();
  const lines = await ocr.detect(canvas.toDataURL("image/png"));
  return lines.map((l) => l.text).filter((t) => t && t.trim());
}
