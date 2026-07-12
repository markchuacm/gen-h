import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { fetchDoctorCases } from "../lib/api/doctor";
import type { DoctorCase } from "../lib/api/doctor";
import CaseDetail from "./CaseDetail";
import DoctorNav from "./DoctorNav";
import { STAGE_LABELS } from "./stageLabels";
import "../member-v2/shell/shell.css";
import "./doctor.css";

function DoctorApp() {
  const { profile } = useAuth();
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
      <>
        <DoctorNav />
        <CaseDetail
          memberId={openMemberId}
          caseSummary={activeCase}
          onBack={() => setOpenMemberId(null)}
        />
      </>
    );
  }

  const firstName = profile?.full_name?.split(" ")[0];

  return (
    <>
      <DoctorNav />
      <main className="p-page doc-page">
        <header className="doc-head">
          <div>
            <span className="p-eyebrow">Doctor console</span>
            <h1 className="p-h1">
              Your <em>cases</em>
            </h1>
            {firstName && <p className="doc-sub">Welcome back, {firstName}.</p>}
          </div>
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
                <span className="p-chip">{STAGE_LABELS[c.stage ?? ""] ?? c.stage ?? "—"}</span>
              </button>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

export default DoctorApp;
