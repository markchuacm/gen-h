import { useState } from "react";
import {
  createBiomarker,
  createLabReport,
  deleteBiomarker,
  deleteLabReport,
  releaseLabReport,
  updateBiomarker,
  updateLabReport,
} from "../lib/api/admin";
import type { AdminBiomarkerRow, AdminLabReport, BiomarkerInput } from "../lib/api/admin";
import { BIOMARKER_CATALOG, catalogLookup } from "./biomarkerCatalog";
import IngestModal from "./ingest/IngestModal";

const STATUS_OPTIONS: AdminBiomarkerRow["status"][] = ["optimal", "at_risk", "needs_attention"];
const STATUS_LABELS: Record<string, string> = {
  optimal: "Optimal",
  at_risk: "At risk",
  needs_attention: "Needs attention",
};

type DocRef = { id: string; file_name: string };

const numOrNull = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function emptyBiomarker(): BiomarkerInput {
  return {
    biomarker_code: "",
    biomarker_name: null,
    category: null,
    value_numeric: null,
    value_text: null,
    unit: null,
    ref_low: null,
    ref_high: null,
    optimal_low: null,
    optimal_high: null,
    status: "optimal",
    notes: null,
  };
}

// ---- Biomarker add/edit form --------------------------------------------

function BiomarkerForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: BiomarkerInput;
  onSave: (row: BiomarkerInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [row, setRow] = useState<BiomarkerInput>(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof BiomarkerInput>(k: K, v: BiomarkerInput[K]) =>
    setRow((r) => ({ ...r, [k]: v }));

  const onCode = (code: string) => {
    const hit = catalogLookup(code);
    setRow((r) => ({
      ...r,
      biomarker_code: code,
      biomarker_name: hit ? hit.name : r.biomarker_name,
      category: hit ? hit.category : r.category,
      unit: hit && !r.unit ? hit.unit : r.unit,
    }));
  };

  const valid = row.biomarker_code.trim() !== "" &&
    (row.value_numeric != null || (row.value_text ?? "").trim() !== "");

  return (
    <div className="adm-bio-form">
      <div className="adm-bio-grid">
        <label>
          <span>Code</span>
          <input list="bio-codes" value={row.biomarker_code} onChange={(e) => onCode(e.target.value)} />
        </label>
        <label>
          <span>Name</span>
          <input value={row.biomarker_name ?? ""} onChange={(e) => set("biomarker_name", e.target.value || null)} />
        </label>
        <label>
          <span>Category</span>
          <input value={row.category ?? ""} onChange={(e) => set("category", e.target.value || null)} />
        </label>
        <label>
          <span>Value (number)</span>
          <input type="number" step="any" value={row.value_numeric ?? ""}
            onChange={(e) => set("value_numeric", numOrNull(e.target.value))} />
        </label>
        <label>
          <span>Value (text)</span>
          <input value={row.value_text ?? ""} onChange={(e) => set("value_text", e.target.value || null)} />
        </label>
        <label>
          <span>Unit</span>
          <input value={row.unit ?? ""} onChange={(e) => set("unit", e.target.value || null)} />
        </label>
        <label>
          <span>Ref low</span>
          <input type="number" step="any" value={row.ref_low ?? ""}
            onChange={(e) => set("ref_low", numOrNull(e.target.value))} />
        </label>
        <label>
          <span>Ref high</span>
          <input type="number" step="any" value={row.ref_high ?? ""}
            onChange={(e) => set("ref_high", numOrNull(e.target.value))} />
        </label>
        <label>
          <span>Optimal low</span>
          <input type="number" step="any" value={row.optimal_low ?? ""}
            onChange={(e) => set("optimal_low", numOrNull(e.target.value))} />
        </label>
        <label>
          <span>Optimal high</span>
          <input type="number" step="any" value={row.optimal_high ?? ""}
            onChange={(e) => set("optimal_high", numOrNull(e.target.value))} />
        </label>
        <label>
          <span>Status</span>
          <select value={row.status} onChange={(e) => set("status", e.target.value as BiomarkerInput["status"])}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </label>
        <label className="adm-bio-notes">
          <span>Notes</span>
          <input value={row.notes ?? ""} onChange={(e) => set("notes", e.target.value || null)} />
        </label>
      </div>
      <div className="adm-bio-actions">
        <button
          type="button"
          className="adm-btn"
          disabled={!valid || saving}
          onClick={async () => {
            setSaving(true);
            await onSave(row);
            setSaving(false);
          }}
        >
          Save biomarker
        </button>
        <button type="button" className="adm-btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ---- One report card -----------------------------------------------------

function ReportCard({
  report,
  memberId,
  documents,
  onChange,
}: {
  report: AdminLabReport;
  memberId: string;
  documents: DocRef[];
  onChange: () => Promise<void>;
}) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const released = report.status === "released";

  const wrap = async (fn: () => Promise<{ error: string | null }>) => {
    setBusy(true);
    await fn();
    await onChange();
    setBusy(false);
  };

  const docName = documents.find((d) => d.id === report.document_id)?.file_name;

  return (
    <div className="adm-report">
      <div className="adm-report-head">
        <div>
          <strong>{report.panel_name || "Untitled panel"}</strong>
          <span className="adm-report-meta">
            {[report.lab_name, report.collected_at, docName].filter(Boolean).join(" · ")}
          </span>
        </div>
        <div className="adm-report-head-right">
          <span className={`adm-pill adm-pill-${report.status}`}>{released ? "Released" : "Draft"}</span>
          {!released && (
            <button
              type="button"
              className="adm-btn"
              disabled={busy || report.biomarker_results.length === 0}
              title={report.biomarker_results.length === 0 ? "Add biomarkers first" : "Release to member & doctor"}
              onClick={() => void wrap(() => releaseLabReport(report.id))}
            >
              Release
            </button>
          )}
          {!released && (
            <button type="button" className="adm-btn-danger" disabled={busy}
              onClick={() => void wrap(() => deleteLabReport(report.id))}>
              Delete
            </button>
          )}
        </div>
      </div>

      {report.biomarker_results.length > 0 && (
        <table className="adm-table adm-table-tight">
          <thead>
            <tr><th>Biomarker</th><th>Value</th><th>Unit</th><th>Ref</th><th>Optimal</th><th>Status</th><th /></tr>
          </thead>
          <tbody>
            {report.biomarker_results.map((b) => (
              <tr key={b.id}>
                <td>{b.biomarker_name || b.biomarker_code}</td>
                <td className="adm-num">{b.value_numeric ?? b.value_text ?? "—"}</td>
                <td>{b.unit ?? "—"}</td>
                <td className="adm-num">{[b.ref_low, b.ref_high].some((v) => v != null)
                  ? `${b.ref_low ?? "–"}–${b.ref_high ?? "–"}` : "—"}</td>
                <td className="adm-num">{[b.optimal_low, b.optimal_high].some((v) => v != null)
                  ? `${b.optimal_low ?? "–"}–${b.optimal_high ?? "–"}` : "—"}</td>
                <td><span className={`adm-bio-status adm-bio-${b.status}`}>{STATUS_LABELS[b.status]}</span></td>
                <td className="adm-row-actions">
                  <button type="button" className="adm-link" onClick={() => setEditingId(b.id)}>Edit</button>
                  <button type="button" className="adm-link adm-link-danger" disabled={busy}
                    onClick={() => void wrap(() => deleteBiomarker(b.id))}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingId && (() => {
        const target = report.biomarker_results.find((b) => b.id === editingId);
        if (!target) return null;
        const { id, lab_report_id, member_id, ...rest } = target;
        void id; void lab_report_id; void member_id;
        return (
          <BiomarkerForm
            initial={rest}
            onCancel={() => setEditingId(null)}
            onSave={async (row) => {
              await wrap(() => updateBiomarker(editingId, row));
              setEditingId(null);
            }}
          />
        );
      })()}

      {adding ? (
        <BiomarkerForm
          initial={emptyBiomarker()}
          onCancel={() => setAdding(false)}
          onSave={async (row) => {
            await wrap(() => createBiomarker(report.id, memberId, row));
            setAdding(false);
          }}
        />
      ) : (
        <button type="button" className="adm-btn-ghost adm-add" onClick={() => setAdding(true)}>
          ＋ Add biomarker
        </button>
      )}
    </div>
  );
}

// ---- Section -------------------------------------------------------------

function LabResultsSection({
  memberId,
  sex,
  age,
  reports,
  documents,
  onChange,
}: {
  memberId: string;
  sex: string | null;
  age: number | null;
  reports: AdminLabReport[];
  documents: DocRef[];
  onChange: () => Promise<void>;
}) {
  const [creating, setCreating] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [labName, setLabName] = useState("");
  const [panelName, setPanelName] = useState("");
  const [collectedAt, setCollectedAt] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await createLabReport(memberId, {
      lab_name: labName || null,
      panel_name: panelName || null,
      collected_at: collectedAt || null,
      document_id: documentId || null,
    });
    if (err) setError(err);
    else {
      setLabName(""); setPanelName(""); setCollectedAt(""); setDocumentId("");
      setCreating(false);
      await onChange();
    }
    setBusy(false);
  };

  return (
    <div className="adm-card">
      <datalist id="bio-codes">
        {BIOMARKER_CATALOG.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </datalist>

      <div className="adm-card-head">
        <h2>Lab results</h2>
        {!creating && (
          <div className="adm-card-head-actions">
            <button type="button" className="adm-btn" onClick={() => setIngesting(true)}>Ingest from PDF</button>
            <button type="button" className="adm-btn-ghost" onClick={() => setCreating(true)}>New report</button>
          </div>
        )}
      </div>

      {ingesting && (
        <IngestModal
          memberId={memberId}
          sex={sex}
          age={age}
          onClose={() => setIngesting(false)}
          onCommitted={onChange}
        />
      )}

      {error && <p role="alert" className="adm-error">{error}</p>}

      {creating && (
        <div className="adm-new-report">
          <div className="adm-bio-grid">
            <label><span>Lab name</span>
              <input value={labName} onChange={(e) => setLabName(e.target.value)} placeholder="e.g. Innoquest" /></label>
            <label><span>Panel name</span>
              <input value={panelName} onChange={(e) => setPanelName(e.target.value)} placeholder="e.g. Advanced Baseline" /></label>
            <label><span>Collection date</span>
              <input type="date" value={collectedAt} onChange={(e) => setCollectedAt(e.target.value)} /></label>
            <label><span>Source document</span>
              <select value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
                <option value="">None</option>
                {documents.map((d) => <option key={d.id} value={d.id}>{d.file_name}</option>)}
              </select></label>
          </div>
          <div className="adm-bio-actions">
            <button type="button" className="adm-btn" disabled={busy} onClick={() => void submit()}>
              Create draft
            </button>
            <button type="button" className="adm-btn-ghost" onClick={() => setCreating(false)}>Cancel</button>
          </div>
        </div>
      )}

      {reports.length === 0 && !creating && <p className="adm-muted">No lab reports yet.</p>}

      <div className="adm-report-list">
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} memberId={memberId} documents={documents} onChange={onChange} />
        ))}
      </div>
    </div>
  );
}

export default LabResultsSection;
