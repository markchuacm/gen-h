import { useEffect, useState } from "react";
import { Download, ExternalLink, Eye, FileSpreadsheet, FileText, Image as ImageIcon, X } from "lucide-react";
// The attachment tiles reuse the member onboarding uploader look (pf-report-file*
// classes from profile.css), made clickable to open an inline preview instead of
// removable. That stylesheet coupling is confined to this file.
import "../member-v2/screens/profile/profile.css";
import { REPORT_CATEGORY_LABELS } from "../member-v2/screens/profile/profileQuestions";
import type { ReportUploadCategory } from "../member-v2/screens/profile/profileQuestions";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import { createDocumentSignedUrl } from "../lib/api/healthDocuments";

type CaseDoc = DoctorCaseDetail["documents"][number];
type DocKind = "pdf" | "image" | "sheet" | "doc" | "other";

function docKind(fileName: string): DocKind {
  const name = fileName.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|heic|webp|gif)$/.test(name)) return "image";
  if (/\.(csv|xls|xlsx)$/.test(name)) return "sheet";
  if (/\.(docx?|txt)$/.test(name)) return "doc";
  return "other";
}

const KIND_ICON: Record<DocKind, typeof FileText> = {
  pdf: FileText,
  image: ImageIcon,
  sheet: FileSpreadsheet,
  doc: FileText,
  other: FileText,
};

function extLabel(fileName: string, kind: DocKind) {
  const ext = fileName.includes(".") ? fileName.split(".").pop()?.toUpperCase() : "";
  return ext || kind.toUpperCase();
}

function categoryLabel(docType: string | null) {
  if (!docType) return "Attachment";
  return REPORT_CATEGORY_LABELS[docType as ReportUploadCategory] ?? docType;
}

function AttachmentTile({ doc, onOpen }: { doc: CaseDoc; onOpen: (doc: CaseDoc) => void }) {
  const kind = docKind(doc.file_name);
  const Icon = KIND_ICON[kind];
  return (
    <button
      type="button"
      className={`doc-attach-tile pf-report-file pf-report-file--${kind}`}
      onClick={() => onOpen(doc)}
      title={`Preview ${doc.file_name}`}
    >
      <span className="doc-attach-thumb-badge" aria-hidden="true">
        <Eye strokeWidth={1.9} />
      </span>
      <div className="pf-report-file-thumb" aria-hidden="true">
        <Icon strokeWidth={1.6} />
        <span>{extLabel(doc.file_name, kind)}</span>
      </div>
      <div className="pf-report-file-meta">
        <strong>{doc.file_name}</strong>
        <span>{categoryLabel(doc.doc_type)}</span>
      </div>
    </button>
  );
}

function DocumentPreview({ doc, onClose }: { doc: CaseDoc; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const kind = docKind(doc.file_name);
  const canInline = kind === "pdf" || kind === "image";

  useEffect(() => {
    let cancelled = false;
    createDocumentSignedUrl(doc.storage_path).then(({ url: signed }) => {
      if (cancelled) return;
      if (signed) setUrl(signed);
      else setError("Couldn't generate a preview link.");
    });
    return () => {
      cancelled = true;
    };
  }, [doc.storage_path]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="doc-preview-layer" role="presentation">
      <button className="doc-preview-backdrop" type="button" aria-label="Close preview" onClick={onClose} />
      <div className="doc-preview" role="dialog" aria-modal="true" aria-label={`Preview of ${doc.file_name}`}>
        <header className="doc-preview-header">
          <strong title={doc.file_name}>{doc.file_name}</strong>
          <div className="doc-preview-header-actions">
            {url && (
              <a className="doc-preview-action" href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink strokeWidth={1.8} aria-hidden="true" /> Open
              </a>
            )}
            {url && (
              <a className="doc-preview-action" href={url} download={doc.file_name}>
                <Download strokeWidth={1.8} aria-hidden="true" /> Download
              </a>
            )}
            <button className="doc-preview-close" type="button" aria-label="Close preview" onClick={onClose}>
              <X strokeWidth={1.9} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className="doc-preview-body">
          {error && <p className="doc-preview-fallback">{error}</p>}
          {!error && !url && <p className="doc-preview-fallback">Loading preview…</p>}
          {url && canInline && kind === "image" && <img src={url} alt={doc.file_name} />}
          {url && canInline && kind === "pdf" && <iframe src={url} title={doc.file_name} />}
          {url && !canInline && (
            <div className="doc-preview-fallback">
              <FileText strokeWidth={1.4} aria-hidden="true" />
              <p>This file type can't be previewed inline. Open or download it to view.</p>
              <a className="doc-preview-action" href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink strokeWidth={1.8} aria-hidden="true" /> Open file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Previous reports & attachments card, with inline preview overlay. */
function CaseAttachments({ documents }: { documents: CaseDoc[] }) {
  const [preview, setPreview] = useState<CaseDoc | null>(null);

  return (
    <>
      <section className="doc-card doc-attachments" aria-labelledby="case-attachments">
        <div className="doc-attach-head">
          <span className="doc-label" id="case-attachments">Previous reports &amp; attachments</span>
          {documents.length > 0 && (
            <span className="doc-attach-count">
              {documents.length} file{documents.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
        {documents.length === 0 ? (
          <p className="doc-muted">No documents uploaded.</p>
        ) : (
          <div className="pf-report-file-grid">
            {documents.map((doc) => (
              <AttachmentTile key={doc.id} doc={doc} onOpen={setPreview} />
            ))}
          </div>
        )}
      </section>

      {preview && <DocumentPreview doc={preview} onClose={() => setPreview(null)} />}
    </>
  );
}

export default CaseAttachments;
