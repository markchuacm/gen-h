// Browser-side PDF text extraction with pdf.js. Digital lab PDFs carry a text
// layer we read directly; pages that come back with almost no text (scanned
// images) are routed to OCR. The worker is bundled locally via Vite's `?url`
// import so nothing is fetched from a CDN (offline / CSP safe).
import * as pdfjs from "pdfjs-dist";
// eslint-disable-next-line import/no-unresolved
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { reconstructLines, type PositionedItem } from "./lineReconstruct";
import type { PageLine } from "./types";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// A page with fewer than this many text items is treated as scanned → OCR.
const TEXT_ITEM_THRESHOLD = 5;

export type ExtractProgress = (msg: string, page: number, total: number) => void;

export async function extractLines(file: File, onProgress?: ExtractProgress): Promise<PageLine[]> {
  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf) }).promise;
  const out: PageLine[] = [];

  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items = content.items as Array<{ str: string; transform: number[]; width: number; height: number }>;
    const textItems = items.filter((i) => i.str && i.str.trim());

    if (textItems.length >= TEXT_ITEM_THRESHOLD) {
      onProgress?.(`Reading page ${p} of ${doc.numPages}`, p, doc.numPages);
      const positioned: PositionedItem[] = textItems.map((i) => ({
        str: i.str,
        x: i.transform[4],
        y: i.transform[5],
        w: i.width,
        h: i.height,
      }));
      for (const text of reconstructLines(positioned)) out.push({ page: p, text });
    } else {
      // Scanned page — render and OCR (lazy import keeps OCR out of the main bundle).
      onProgress?.(`Running OCR on page ${p} of ${doc.numPages}`, p, doc.numPages);
      const { ocrPdfPage } = await import("./ocr");
      const lines = await ocrPdfPage(page);
      for (const text of lines) out.push({ page: p, text });
    }
  }

  await doc.destroy();
  return out;
}
