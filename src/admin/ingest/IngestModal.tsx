// "Ingest from PDF": upload a lab report, parse it client-side, review every
// parsed biomarker, then commit a draft lab_reports + biomarker_results set in
// one go. The report is created as a draft, so the existing per-report Release
// button remains the human gate before members/doctors see anything.
import { useState } from "react";
import {
  createBiomarkersBulk,
  createLabReport,
  uploadDocumentForMember,
} from "../../lib/api/admin";
import type { RangeCtx } from "./deriveStatus";
import { runIngest } from "./ingestPipeline";
import type { IngestRow, IngestStage } from "./types";
import IngestReviewTable from "./IngestReviewTable";

type Props = {
  memberId: string;
  sex: string | null;
  age: number | null;
  onClose: () => void;
  onCommitted: () => Promise<void>;
};

const rangeCtx = (sex: string | null, age: number | null): RangeCtx => ({
  sex: (sex ?? "").toLowerCase().startsWith("f") ? "female" : "male",
  age: age ?? 40,
});

export default function IngestModal({ memberId, sex, age, onClose, onCommitted }: Props) {
  const ctx = rangeCtx(sex, age);
  const [stage, setStage] = useState<IngestStage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [labName, setLabName] = useState("");
  const [panelName, setPanelName] = useState("");
  const [collectedAt, setCollectedAt] = useState("");
  const [storePdf, setStorePdf] = useState(true);
  const [progress, setProgress] = useState("");
  const [rows, setRows] = useState<IngestRow[]>([]);
  const [unmatched, setUnmatched] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [committedCount, setCommittedCount] = useState(0);

  const includedRows = rows.filter((r) => r.include);

  const startParse = async () => {
    if (!file) return;
    setStage("processing");
    setError(null);
    setProgress("Reading PDF…");
    try {
      const result = await runIngest(file, ctx, (msg) => setProgress(msg));
      setRows(result.rows);
      setUnmatched(result.unmatched);
      setStage("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't read this PDF.");
      setStage("upload");
    }
  };

  const commit = async () => {
    setStage("committing");
    setError(null);
    try {
      let documentId: string | null = null;
      if (storePdf && file) {
        const up = await uploadDocumentForMember(memberId, file, "health_screening");
        if (up.error) throw new Error(`Uploading the PDF failed: ${up.error}`);
        documentId = up.data?.id ?? null;
      }

      const report = await createLabReport(memberId, {
        lab_name: labName || null,
        panel_name: panelName || null,
        collected_at: collectedAt || null,
        document_id: documentId,
      });
      if (report.error || !report.data) throw new Error(report.error ?? "Couldn't create the report.");

      const { inserted, error: bulkErr } = await createBiomarkersBulk(
        report.data.id,
        memberId,
        includedRows.map((r) => r.input),
      );
      if (bulkErr) throw new Error(`Report created, but saving markers failed: ${bulkErr}`);

      setCommittedCount(inserted);
      setStage("done");
      await onCommitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Commit failed.");
      setStage("review");
    }
  };

  const invalidCommit = includedRows.some((r) => !r.input.biomarker_code.trim());

  return (
    <div className="adm-ing-layer" role="dialog" aria-modal="true" aria-label="Ingest lab report">
      <div className="adm-ing-backdrop" onClick={stage === "processing" || stage === "committing" ? undefined : onClose} />
      <div className="adm-ing-panel">
        <header className="adm-ing-panel-head">
          <div>
            <p className="p-eyebrow">Ingest lab report</p>
            <h2>{file ? file.name : "Upload a PDF"}</h2>
          </div>
          {stage !== "processing" && stage !== "committing" && (
            <button type="button" className="adm-ing-close" onClick={onClose} aria-label="Close">✕</button>
          )}
        </header>

        {error && <p role="alert" className="adm-error">{error}</p>}

        {stage === "upload" && (
          <div className="adm-ing-body">
            <div className="adm-bio-grid">
              <label className="adm-bio-notes">
                <span>Lab report PDF</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <label><span>Lab name</span>
                <input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="e.g. Gnosis" /></label>
              <label><span>Panel name</span>
                <input value={panelName} onChange={(e) => setPanelName(e.target.value)} placeholder="e.g. Vitality Profile" /></label>
              <label><span>Collection date</span>
                <input type="date" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} /></label>
            </div>
            <label className="adm-ing-check">
              <input type="checkbox" checked={storePdf} onChange={(e) => setStorePdf(e.target.checked)} />
              <span>Store this PDF as the report's source document</span>
            </label>
            <div className="adm-bio-actions">
              <button type="button" className="adm-btn" disabled={!file} onClick={() => void startParse()}>
                Read PDF
              </button>
              <button type="button" className="adm-btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {stage === "processing" && (
          <div className="adm-ing-body adm-ing-progress">
            <div className="adm-ing-spinner" aria-hidden="true" />
            <p className="adm-muted">{progress}</p>
          </div>
        )}

        {stage === "review" && (
          <div className="adm-ing-body">
            <IngestReviewTable rows={rows} unmatched={unmatched} ctx={ctx} onRowsChange={setRows} />
            <div className="adm-bio-actions adm-ing-commit-bar">
              <button
                type="button"
                className="adm-btn"
                disabled={includedRows.length === 0 || invalidCommit}
                title={invalidCommit ? "Every included row needs a code" : undefined}
                onClick={() => void commit()}
              >
                Create draft report ({includedRows.length} marker{includedRows.length === 1 ? "" : "s"})
              </button>
              <button type="button" className="adm-btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </div>
        )}

        {stage === "committing" && (
          <div className="adm-ing-body adm-ing-progress">
            <div className="adm-ing-spinner" aria-hidden="true" />
            <p className="adm-muted">Saving draft report…</p>
          </div>
        )}

        {stage === "done" && (
          <div className="adm-ing-body adm-ing-done">
            <p>Draft report created with <strong>{committedCount}</strong> biomarker{committedCount === 1 ? "" : "s"}.</p>
            <p className="adm-hint">Review and hit Release when you're ready for the member and doctor to see it.</p>
            <div className="adm-bio-actions">
              <button type="button" className="adm-btn" onClick={onClose}>Done</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
