import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { fetchDoctorCases } from "../lib/api/doctor";
import type { DoctorCase } from "../lib/api/doctor";
import CaseDetail from "./CaseDetail";
import "./doctor.css";

const STAGE_LABELS: Record<string, string> = {
  profile_incomplete: "Profile incomplete",
  consult_upcoming: "Consult upcoming",
  blood_form_ready: "Blood draw",
  results_pending: "Results pending",
  results_ready: "Results ready",
  care_plan_ready: "Care plan released",
};

function DoctorApp() {
  const { profile, signOut } = useAuth();
  const [cases, setCases] = useState<DoctorCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMemberId, setOpenMemberId] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctorCases().then(({ data, error: err }) => {
      if (err) setError(err);
      else setCases(data);
    });
  }, []);

  if (openMemberId) {
    const activeCase = cases?.find((c) => c.memberId === openMemberId);
    return (
      <CaseDetail
        memberId={openMemberId}
        caseSummary={activeCase}
        onBack={() => setOpenMemberId(null)}
      />
    );
  }

  return (
    <main className="doc-page">
      <header className="doc-head">
        <div>
          <span className="doc-eyebrow">GEN-H · DOCTOR</span>
          <h1>Your cases</h1>
          <p className="doc-sub">
            {profile?.full_name ? `Signed in as ${profile.full_name}` : profile?.email}
          </p>
        </div>
        <button type="button" className="doc-signout" onClick={() => void signOut()}>
          Sign out
        </button>
      </header>

      {error && <p role="alert" className="doc-error">Couldn't load cases ({error}).</p>}

      {cases === null && !error && <p className="doc-muted">Loading cases…</p>}

      {cases !== null && cases.length === 0 && (
        <p className="doc-muted">No members assigned to you yet.</p>
      )}

      <ul className="doc-case-list">
        {cases?.map((c) => (
          <li key={c.assignmentId}>
            <button type="button" className="doc-case" onClick={() => setOpenMemberId(c.memberId)}>
              <div className="doc-case-main">
                <strong>{c.memberName ?? c.memberEmail ?? "Member"}</strong>
                <span>{c.memberEmail}</span>
              </div>
              <span className="doc-stage-chip">{STAGE_LABELS[c.stage ?? ""] ?? c.stage ?? "—"}</span>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default DoctorApp;
