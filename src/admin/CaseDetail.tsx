import { useCallback, useEffect, useRef, useState } from "react";
import {
  assignDoctor,
  deactivateAssignment,
  fetchAdminCaseDetail,
  fetchAdminDoctors,
  fetchAdminLabReports,
  setStage,
  setAccountStatus,
  STAGE_LABELS,
  STAGE_OPTIONS,
  uploadDocumentForMember,
} from "../lib/api/admin";
import type { AdminCaseDetail, AdminDoctorRow, AdminLabReport } from "../lib/api/admin";
import { createDocumentSignedUrl } from "../lib/api/healthDocuments";
import { CLEAR_ANSWERS, lifestyleConcerns, toAnswers } from "../doctor/caseSignals";
import LabResultsSection from "./LabResultsSection";
import CaseTimeline from "./CaseTimeline";

const DOC_TYPES = [
  { value: "health_screening", label: "Health screening" },
  { value: "genetic_tests", label: "Genetic tests" },
  { value: "other_tests", label: "Other tests" },
  { value: "other", label: "Other" },
];

function TagGroup({
  label,
  items,
  flagged,
}: {
  label: string;
  items: string[];
  flagged?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="adm-tag-group">
      <span className="adm-group-label">{label}</span>
      <ul className="adm-chips">
        {items.map((item) => (
          <li key={item} className={flagged && !CLEAR_ANSWERS.has(item) ? "is-flag" : ""}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
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

  const onAccountStatusChange = async (accountStatus: "active" | "suspended") => {
    setBusy(true);
    const { error: err } = await setAccountStatus(memberId, accountStatus);
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

  const hasOnboarding = Object.keys(detail.onboarding).length > 0;
  const answers = hasOnboarding ? toAnswers(detail.onboarding) : null;
  const concerns = answers ? lifestyleConcerns(answers) : new Set<string>();

  const vitals: [string, string][] = [];
  if (detail.age != null) vitals.push(["Age", `${detail.age}`]);
  if (detail.sex) vitals.push(["Sex", detail.sex]);
  if (detail.heightCm != null) vitals.push(["Height", `${detail.heightCm} cm`]);
  if (detail.weightKg != null) vitals.push(["Weight", `${detail.weightKg} kg`]);

  const lifestyleFacts: [string, string][] = answers
    ? [
        ["Sleep", `~${answers.lifestyle.sleepHours}h per night`],
        ["Exercise", `${answers.lifestyle.exerciseDays} days per week`],
        ["Diet", answers.lifestyle.diet],
        ["Stress", `${answers.lifestyle.stress} out of 5`],
        ["Alcohol", answers.habits.alcohol],
        ["Smoking", answers.habits.smoking],
      ]
    : [];

  const supplements = answers ? answers.supplements.filter((s) => !CLEAR_ANSWERS.has(s)) : [];
  const subtitle = [
    detail.preferredName ? `Goes by ${detail.preferredName}` : null,
    detail.memberEmail,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="adm-page">
      <button type="button" className="adm-back" onClick={onBack}>← All cases</button>
      {error && <p role="alert" className="adm-error">{error}</p>}

      <header className="adm-case-head">
        <div>
          <p className="p-eyebrow">Member case</p>
          <h1>{detail.memberName ?? detail.memberEmail ?? "Member"}</h1>
          <p className="adm-sub">{subtitle}</p>
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

      {detail.accountStatus !== "active" && (
        <div className="adm-card">
          <h2>Account activation</h2>
          <p className="adm-muted">Confirm the member's Verae invitation or order before granting portal access.</p>
          <button type="button" className="adm-btn" disabled={busy} onClick={() => void onAccountStatusChange("active")}>
            Activate member account
          </button>
        </div>
      )}

      <CaseTimeline
        onboardingCompleted={detail.onboardingStatus === "completed"}
        doctorAssigned={!!detail.doctorId}
        resultsStatus={resultsStatus}
        carePlanStatus={carePlanStatus}
      />

      <div className="adm-card">
        <h2>Member profile</h2>

        {vitals.length > 0 && (
          <div className="adm-facts">
            {vitals.map(([label, value]) => (
              <div className="adm-fact" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}

        {answers && answers.reason.length > 0 && (
          <blockquote className="adm-reason adm-brief-section" aria-label="Why they're here">
            {answers.reason.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </blockquote>
        )}

        {answers ? (
          <>
            <div className="adm-brief-section">
              <div className="adm-brief-cols">
                <div className="adm-brief-col">
                  <TagGroup label="Main goals" items={answers.goals} />
                  <TagGroup label="What feels off" items={answers.symptoms} />
                  <TagGroup label="Family history" items={answers.family} flagged />
                </div>
                <div className="adm-brief-col">
                  <span className="adm-group-label">Lifestyle &amp; habits</span>
                  <dl className="adm-kv">
                    {lifestyleFacts.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd className={concerns.has(label) ? "is-concern" : ""}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>

            <div className="adm-brief-section">
              <span className="adm-group-label">Supplements &amp; medications</span>
              {supplements.length === 0 && !answers.supplementsOther && !detail.medications ? (
                <p className="adm-muted">Nothing at the moment.</p>
              ) : (
                <>
                  {supplements.length > 0 && (
                    <ul className="adm-chips">
                      {supplements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {answers.supplementsOther && <p className="adm-muted">{answers.supplementsOther}</p>}
                  {detail.medications && (
                    <p className="adm-muted">Medications: {detail.medications}</p>
                  )}
                </>
              )}
              {detail.conditions && <p className="adm-muted">Conditions: {detail.conditions}</p>}
            </div>
          </>
        ) : (
          <div className="adm-brief-section">
            <p className="adm-muted">No onboarding responses yet.</p>
            {(detail.goals?.length || detail.medications || detail.conditions) ? (
              <dl className="adm-kv">
                {detail.goals && detail.goals.length > 0 && (
                  <div><dt>Goals</dt><dd>{detail.goals.join(", ")}</dd></div>
                )}
                {detail.medications && <div><dt>Medications</dt><dd>{detail.medications}</dd></div>}
                {detail.conditions && <div><dt>Conditions</dt><dd>{detail.conditions}</dd></div>}
              </dl>
            ) : null}
          </div>
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
        sex={detail.sex}
        age={detail.age}
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
