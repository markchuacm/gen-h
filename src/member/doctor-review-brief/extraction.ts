// ─── Doctor Review Brief · document content prep (client) ─────────────────────
// Turns an uploaded File into pipeline-ready content: extracted text for PDFs
// and plain-text files, downscaled JPEG data URLs for photos, and rendered page
// images for scanned PDFs with no usable text layer. The server (the only place
// the OpenRouter key lives) does all model work.
//
// pdf.js is lazy-loaded so it never weighs down the initial bundle.

const MAX_EXTRACT_CHARS = 40_000; // server trims to its own budget; this caps work
const MAX_PDF_PAGES = 20;
const SCANNED_PDF_TEXT_THRESHOLD = 200; // fewer chars ⇒ treat as scanned, render pages
const MAX_RENDERED_PDF_PAGES = 4;
const PDF_RENDER_SCALE = 1.5;
const MAX_IMAGE_EDGE_PX = 1568;
const IMAGE_JPEG_QUALITY = 0.85;
const MAX_IMAGE_DATA_URL_CHARS = 5 * 1024 * 1024;

export type DocumentPayload = {
  textExcerpt?: string;
  images?: string[];
};

// ─── File-kind checks ─────────────────────────────────────────────────────────

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

function isImage(file: File): boolean {
  const name = file.name.toLowerCase();
  return (
    file.type.startsWith("image/") ||
    /\.(png|jpe?g|heic|webp|gif)$/.test(name)
  );
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// ─── PDF text + page rendering ────────────────────────────────────────────────

let pdfWorkerReady = false;

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfWorkerReady) {
    // Vite resolves the `?url` suffix to the hashed asset URL at build time.
    const workerUrl = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url"))
      .default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    pdfWorkerReady = true;
  }
  return pdfjs;
}

async function extractPdfContent(file: File): Promise<DocumentPayload> {
  const pdfjs = await loadPdfjs();
  const data = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data });
  const doc = await loadingTask.promise;

  try {
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
    text = text.slice(0, MAX_EXTRACT_CHARS);

    if (text.trim().length >= SCANNED_PDF_TEXT_THRESHOLD) {
      return { textExcerpt: text };
    }

    // Scanned PDF — no usable text layer. Render the first pages to images so
    // the multimodal model can read them.
    const images: string[] = [];
    const renderCount = Math.min(doc.numPages, MAX_RENDERED_PDF_PAGES);
    for (let pageNum = 1; pageNum <= renderCount; pageNum++) {
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: PDF_RENDER_SCALE });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) break;
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY);
      if (dataUrl.length <= MAX_IMAGE_DATA_URL_CHARS) images.push(dataUrl);
    }
    return {
      textExcerpt: text.trim() ? text : undefined,
      images: images.length > 0 ? images : undefined,
    };
  } finally {
    try {
      await loadingTask.destroy();
    } catch {
      /* noop */
    }
  }
}

// ─── Image downscaling ────────────────────────────────────────────────────────

async function prepareImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE_PX / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY);
    if (dataUrl.length > MAX_IMAGE_DATA_URL_CHARS) {
      throw new Error("Image too large to analyze.");
    }
    return dataUrl;
  } finally {
    bitmap.close();
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Best-effort pipeline content for a file. An empty payload ⇒ nothing to
 * analyze (the file still attaches to the brief for the doctor).
 */
export async function prepareDocumentPayload(
  file: File,
): Promise<DocumentPayload> {
  try {
    if (isPlainText(file)) {
      const text = (await readAsText(file)).slice(0, MAX_EXTRACT_CHARS);
      return text.trim() ? { textExcerpt: text } : {};
    }
    if (isPdf(file)) return await extractPdfContent(file);
    if (isImage(file)) return { images: [await prepareImage(file)] };
  } catch {
    // Content prep failure is non-fatal — the file still uploads for the doctor.
  }
  return {};
}
