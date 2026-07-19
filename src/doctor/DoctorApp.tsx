import { useEffect, useState } from "react";
import { Video } from "lucide-react";
import { useAuth } from "../auth/AuthProvider";
import { fetchDoctorAppointments, fetchDoctorCases } from "../lib/api/doctor";
import type { DoctorAppointment, DoctorCase } from "../lib/api/doctor";
import { formatConsultDate, formatConsultTime } from "../lib/api/appointments";
import CaseDetail from "./CaseDetail";
import DoctorNav from "./DoctorNav";
import { STAGE_LABELS } from "./stageLabels";
import "../member-v2/shell/shell.css";
import "./doctor.css";

function DoctorApp() {
  const { profile } = useAuth();
  const [cases, setCases] = useState<DoctorCase[] | null>(null);
  const [appointments, setAppointments] = useState<DoctorAppointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const caseFromUrl = () => {
    const match = window.location.pathname.match(/^\/member\/doctor\/cases\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  };
  const [openMemberId, setOpenMemberId] = useState<string | null>(() => caseFromUrl());
  const [caseView, setCaseView] = useState<"brief" | "panel" | "results" | "carePlan">(() => {
    const value = new URLSearchParams(window.location.search).get("view");
    return value === "panel" || value === "results" || value === "carePlan" ? value : "brief";
  });

  const navigateToCase = (memberId: string | null, view: typeof caseView = "brief", replace = false) => {
    const url = memberId
      ? `/member/doctor/cases/${encodeURIComponent(memberId)}?view=${encodeURIComponent(view)}`
      : "/member";
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    setOpenMemberId(memberId);
    setCaseView(view);
  };

  useEffect(() => {
    const restore = () => {
      setOpenMemberId(caseFromUrl());
      const value = new URLSearchParams(window.location.search).get("view");
      setCaseView(value === "panel" || value === "results" || value === "carePlan" ? value : "brief");
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  useEffect(() => {
    fetchDoctorCases().then(({ data, error: err }) => {
      if (err) setError(err);
      else setCases(data);
    });
    fetchDoctorAppointments().then(({ data }) => setAppointments(data));
  }, []);

  if (openMemberId) {
    const activeCase = cases?.find((c) => c.memberId === openMemberId);
    return (
      <>
        <DoctorNav />
        <CaseDetail
          memberId={openMemberId}
          caseSummary={activeCase}
          initialView={caseView}
          onViewChange={(view) => navigateToCase(openMemberId, view)}
          onBack={() => navigateToCase(null)}
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

        {appointments.length > 0 && (
          <section className="doc-consults" aria-label="Upcoming consults">
            <h2 className="p-eyebrow">Upcoming consults</h2>
            <ul className="doc-consult-list">
              {appointments.map((appt) => (
                <li key={appt.id} className="doc-consult">
                  <button type="button" className="doc-consult-main" onClick={() => navigateToCase(appt.memberId)}>
                    <strong>{appt.memberName ?? "Member"}</strong>
                    <span>{formatConsultDate(appt.scheduledAt)} · {formatConsultTime(appt.scheduledAt)}</span>
                  </button>
                  <button
                    type="button"
                    className="p-btn-ghost doc-consult-join"
                    disabled={!appt.meetingUrl}
                    title={appt.meetingUrl ? undefined : "The join link hasn't been added yet"}
                    onClick={() => {
                      if (appt.meetingUrl) window.open(appt.meetingUrl, "_blank", "noopener");
                    }}
                  >
                    <Video strokeWidth={1.7} aria-hidden="true" />
                    Join
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {cases === null && !error && <p className="doc-muted">Loading cases…</p>}

        {cases !== null && cases.length === 0 && (
          <p className="doc-muted">No members assigned to you yet.</p>
        )}

        <ul className="doc-case-list">
          {cases?.map((c) => (
            <li key={c.assignmentId}>
              <button type="button" className="doc-case" onClick={() => navigateToCase(c.memberId)}>
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
