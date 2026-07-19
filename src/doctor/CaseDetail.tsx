import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { fetchCaseDetail } from "../lib/api/doctor";
import type { DoctorCase, DoctorCaseDetail } from "../lib/api/doctor";
import CaseBrief from "./CaseBrief";
import { stageLabel } from "./stageLabels";

const CarePlanEditor = lazy(() => import("./CarePlanEditor"));
const CaseResults = lazy(() => import("./CaseResults"));
const PanelBuilder = lazy(() => import("./PanelBuilder"));

// The doctor moves through the case in order: the health-profile brief, then —
// depending on whether results exist yet — the blood-panel order or the
// results review, then the care plan.
export type CaseView = "brief" | "panel" | "results" | "carePlan";

function CaseDetail({
  memberId,
  caseSummary,
  initialView,
  onViewChange,
  onBack,
}: {
  memberId: string;
  caseSummary?: DoctorCase;
  initialView: CaseView;
  onViewChange: (view: CaseView) => void;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<DoctorCaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setViewState] = useState<CaseView>(initialView);
  const setView = (next: CaseView) => {
    setViewState(next);
    onViewChange(next);
  };

  useEffect(() => setViewState(initialView), [initialView]);

  const load = useCallback(() => {
    setError(null);
    fetchCaseDetail(memberId).then(({ data, error: err }) => {
      if (err) setError(err);
      else setDetail(data);
    });
  }, [memberId]);

  useEffect(() => {
    load();
  }, [load]);

  const memberName = detail?.memberName ?? caseSummary?.memberName ?? null;

  if (view === "carePlan") {
    return (
      <Suspense fallback={<main className="p-page doc-page"><p role="status">Loading care plan…</p></main>}><CarePlanEditor
        memberId={memberId}
        memberName={memberName}
        onBack={() => setView("brief")}
      /></Suspense>
    );
  }

  if (view === "panel" && detail) {
    return (
      <Suspense fallback={<main className="p-page doc-page"><p role="status">Loading panel…</p></main>}><PanelBuilder
        memberId={memberId}
        detail={detail}
        onBack={() => setView("brief")}
        onSaved={() => {
          // Saving advances the member's stage; return to the brief where the
          // ordered state is visible instead of opening an empty results view.
          load();
          setView("brief");
        }}
      /></Suspense>
    );
  }

  if (view === "results") {
    return (
      <Suspense fallback={<main className="p-page doc-page"><p role="status">Loading results…</p></main>}><CaseResults
        memberId={memberId}
        memberName={memberName}
        onBack={() => setView("brief")}
        onEditCarePlan={() => setView("carePlan")}
      /></Suspense>
    );
  }

  return (
    <main className="p-page doc-page">
      <button type="button" className="doc-back" onClick={onBack}>
        ← All cases
      </button>

      {error && <p role="alert" className="doc-error">Couldn't load case ({error}).</p>}
      {!detail && !error && <p className="doc-muted">Loading…</p>}

      {detail && (
        <>
          <header className="doc-head">
            <div>
              <span className="p-eyebrow">Case brief</span>
              <h1 className="p-h1">{detail.memberName ?? detail.memberEmail ?? "Member"}</h1>
              {/* Age/sex live in the brief's vitals row, so only the journey
                  stage belongs up here. */}
              <p className="doc-sub">{stageLabel(detail.stage)}</p>
            </div>
            <div className="doc-head-actions">
              {detail.appointment && (
                <button
                  type="button"
                  className="p-btn-ghost"
                  disabled={!detail.appointment.meeting_url}
                  title={detail.appointment.meeting_url ? undefined : "The join link hasn't been added yet"}
                  onClick={() => {
                    if (detail.appointment?.meeting_url) window.open(detail.appointment.meeting_url, "_blank", "noopener");
                  }}
                >
                  Join consult
                </button>
              )}
              <button type="button" className="p-btn-ghost" onClick={() => setView("panel")}>
                {detail.labOrder && ["draft", "ordered", "collected"].includes(detail.labOrder.status)
                  ? `View/edit panel (${detail.labOrder.markerCount})`
                  : "Order blood panel"}
              </button>
              {detail.results.releasedReportCount > 0 && (
                <button type="button" className="p-btn-ghost" onClick={() => setView("results")}>
                  Review results ({detail.results.measuredMarkerCount})
                </button>
              )}
              {(detail.carePlan || detail.results.releasedReportCount > 0) && (
                <button type="button" className="p-btn" onClick={() => setView("carePlan")}>
                  {detail.carePlan?.status === "draft"
                    ? "Continue care-plan draft"
                    : detail.carePlan?.status === "released"
                      ? `View care plan v${detail.carePlan.version}`
                      : "Start care plan"}
                </button>
              )}
            </div>
          </header>

          <CaseBrief detail={detail} />
        </>
      )}
    </main>
  );
}

export default CaseDetail;
