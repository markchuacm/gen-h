import { useCallback, useEffect, useRef, useState } from "react";
import {
  assignDoctor,
  deactivateAssignment,
  fetchAdminCaseDetail,
  fetchAdminDoctors,
  fetchAdminLabReports,
  setStage,
  STAGE_LABELS,
  STAGE_OPTIONS,
  uploadDocumentForMember,
} from "../lib/api/admin";
import type { AdminCaseDetail, AdminDoctorRow, AdminLabReport } from "../lib/api/admin";
import { createDocumentSignedUrl } from "../lib/api/healthDocuments";
import LabResultsSection from "./LabResultsSection";
import CaseTimeline from "./CaseTimeline";

const DOC_TYPES = [
  { value: "health_screening", label: "Health screening" },
  { value: "genetic_tests", label: "Genetic tests" },
  { value: "other_tests", label: "Other tests" },
  { value: "other", label: "Other" },
];

function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanizeKey(key: string): string {
  return key.replace(/[_-]+/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function CaseDetail({ memberId, onBack }: { memberId: string; onBack: () => void }) {
  const [detail, setDetail] = useState<AdminCaseDetail | null>(null);
  const [reports, setReports] = useState<AdminLabReport[]>([]);
  const [doctors, setDoctors] = useState<AdminDoctorRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState(DOC_TYPES[0].value);

  const reload = useCallback(async () => {
    const [d, r] = await Promise.all([
      fetchAdminCaseDetail(memberId),
      fetchAdminLabReports(memberId),
    ]);
    if (d.error) setError(d.error);
    else setDetail(d.data);
    if (!r.error) setReports(r.data ?? []);
  }, [memberId]);

  useEffect(() => {
    void reload();
    fetchAdminDoctors().then(({ data }) => setDoctors(data));
  }, [reload]);

  const resultsStatus: "none" | "draft" | "released" = reports.some((r) => r.status === "released")
    ? "released"
    : reports.length > 0
      ? "draft"
      : "none";
  const carePlanStatus = (detail?.carePlan?.status ?? "none") as "none" | "draft" | "released";

  const openDoc = async (storagePath: string) => {
    const { url } = await createDocumentSignedUrl(storagePath);
    if (url) window.open(url, "_blank", "noopener");
  };

  const onUpload = async (file: File) => {
    setBusy(true);
    setError(null);
    const { error: err } = await uploadDocumentForMember(memberId, file, docType);
    if (err) setError(err);
    else await reload();
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const onStageChange = async (stage: string) => {
    setBusy(true);
    const { error: err } = await setStage(memberId, stage);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  const onAssign = async (doctorId: string) => {
    if (!doctorId) return;
    setBusy(true);
    const { error: err } = await assignDoctor(memberId, doctorId);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  const onUnassign = async () => {
    setBusy(true);
    const { error: err } = await deactivateAssignment(memberId);
    if (err) setError(err);
    else await reload();
    setBusy(false);
  };

  if (error && !detail) {
    return (
      <section className="adm-page">
        <button type="button" className="adm-back" onClick={onBack}>← All cases</button>
        <p role="alert" className="adm-error">Couldn't load case ({error}).</p>
      </section>
    );
  }
  if (!detail) {
    return (
      <section className="adm-page">
        <button type="button" className="adm-back" onClick={onBack}>← All cases</button>
        <p className="adm-muted">Loading…</p>
      </section>
    );
  }

  const activeDoctors = doctors.filter((d) => d.isActive);
  const basics: [string, string][] = [
    ["Preferred name", detail.preferredName ?? "—"],
    ["Age", detail.age != null ? `${detail.age}` : "—"],
    ["Sex", detail.sex ?? "—"],
    ["Height", detail.heightCm != null ? `${detail.heightCm} cm` : "—"],
    ["Weight", detail.weightKg != null ? `${detail.weightKg} kg` : "—"],
    ["Goals", detail.goals && detail.goals.length ? detail.goals.join(", ") : "—"],
    ["Medications", detail.medications ?? "—"],
    ["Conditions", detail.conditions ?? "—"],
  ];

  return (
    <section className="adm-page">
      <button type="button" className="adm-back" onClick={onBack}>← All cases</button>
      {error && <p role="alert" className="adm-error">{error}</p>}

      <header className="adm-case-head">
        <div>
          <h1>{detail.memberName ?? detail.memberEmail ?? "Member"}</h1>
          <p className="adm-muted">{detail.memberEmail}</p>
        </div>
        <label className="adm-stage-correct">
          <span>Stage</span>
          <select
            value={detail.currentStage ?? ""}
            disabled={busy}
            onChange={(e) => void onStageChange(e.target.value)}
          >
            {STAGE_OPTIONS.map((s) => (
              <option key={s} value={s}>{STAGE_LABELS[s]}</option>
            ))}
          </select>
        </label>
      </header>

      <CaseTimeline
        onboardingCompleted={detail.onboardingStatus === "completed"}
        doctorAssigned={!!detail.doctorId}
        resultsStatus={resultsStatus}
        carePlanStatus={carePlanStatus}
      />

      <div className="adm-card">
        <h2>Member profile</h2>
        <dl className="adm-kv">
          {basics.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        {Object.keys(detail.onboarding).length > 0 && (
          <>
            <h3 className="adm-subhead">Onboarding responses</h3>
            <dl className="adm-kv">
              {Object.entries(detail.onboarding).map(([key, value]) => (
                <div key={key}><dt>{humanizeKey(key)}</dt><dd>{formatValue(value)}</dd></div>
              ))}
            </dl>
          </>
        )}
      </div>

      <div className="adm-card">
        <div className="adm-card-head">
          <h2>Documents</h2>
          <div className="adm-upload">
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              ref={fileRef}
              type="file"
              disabled={busy}
              accept=".pdf,.jpg,.jpeg,.png,.csv,.doc,.docx"
              onChange={(e) => e.target.files?.[0] && void onUpload(e.target.files[0])}
            />
          </div>
        </div>
        {detail.documents.length === 0 ? (
          <p className="adm-muted">No documents uploaded.</p>
        ) : (
          <table className="adm-table adm-table-tight">
            <thead>
              <tr><th>File</th><th>Type</th><th>Size</th><th>Uploaded</th></tr>
            </thead>
            <tbody>
              {detail.documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <button type="button" className="adm-link" onClick={() => void openDoc(doc.storage_path)}>
                      {doc.file_name}
                    </button>
                  </td>
                  <td>{doc.doc_type ?? "—"}</td>
                  <td className="adm-num">
                    {doc.size_bytes != null ? `${Math.round(doc.size_bytes / 1024)} KB` : "—"}
                  </td>
                  <td>{new Date(doc.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <LabResultsSection
        memberId={memberId}
        reports={reports}
        documents={detail.documents.map((d) => ({ id: d.id, file_name: d.file_name }))}
        onChange={reload}
      />

      <div className="adm-card">
        <h2>Doctor assignment</h2>
        <p className="adm-assign-current">
          {detail.doctorName ? (
            <>Assigned: <strong>{detail.doctorName}</strong></>
          ) : (
            <span className="adm-warn">No doctor assigned</span>
          )}
        </p>
        <div className="adm-assign-controls">
          <select
            defaultValue=""
            disabled={busy || activeDoctors.length === 0}
            onChange={(e) => {
              void onAssign(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" disabled>
              {detail.doctorId ? "Reassign to…" : "Assign a doctor…"}
            </option>
            {activeDoctors.map((d) => (
              <option key={d.doctorId} value={d.doctorId}>
                {d.fullName ?? d.email} ({d.assignedCount})
              </option>
            ))}
          </select>
          {detail.doctorId && (
            <button type="button" className="adm-btn-ghost" disabled={busy} onClick={() => void onUnassign()}>
              Deactivate
            </button>
          )}
        </div>
      </div>

      <div className="adm-card">
        <h2>Care plan</h2>
        <dl className="adm-kv">
          <div><dt>Status</dt><dd><span className={`adm-pill adm-pill-${carePlanStatus}`}>
            {carePlanStatus === "none" ? "Not started" : carePlanStatus === "draft" ? "Draft" : "Released"}
          </span></dd></div>
          <div><dt>Doctor</dt><dd>{detail.carePlan?.doctorName ?? detail.doctorName ?? "—"}</dd></div>
          <div><dt>Last updated</dt><dd>
            {detail.carePlan?.updatedAt ? new Date(detail.carePlan.updatedAt).toLocaleString() : "—"}
          </dd></div>
          <div><dt>Released</dt><dd>
            {detail.carePlan?.releasedAt ? new Date(detail.carePlan.releasedAt).toLocaleString() : "—"}
          </dd></div>
        </dl>
        <p className="adm-hint">Care plans are authored and released by the assigned doctor.</p>
      </div>
    </section>
  );
}

export default CaseDetail;
