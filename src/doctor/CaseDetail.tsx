import { useCallback, useEffect, useState } from "react";
import { fetchCaseDetail } from "../lib/api/doctor";
import type { DoctorCase, DoctorCaseDetail } from "../lib/api/doctor";
import CarePlanEditor from "./CarePlanEditor";
import CaseBrief from "./CaseBrief";
import CaseResults from "./CaseResults";
import PanelBuilder from "./PanelBuilder";
import { stageLabel } from "./stageLabels";

// The doctor moves through the case in order: the health-profile brief, then —
// depending on whether results exist yet — the blood-panel order or the
// results review, then the care plan.
type CaseView = "brief" | "panel" | "results" | "carePlan";

function CaseDetail({
  memberId,
  caseSummary,
  onBack,
}: {
  memberId: string;
  caseSummary?: DoctorCase;
  onBack: () => void;
}) {
  const [detail, setDetail] = useState<DoctorCaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<CaseView>("brief");

  const load = useCallback(() => {
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
      <CarePlanEditor
        memberId={memberId}
        memberName={memberName}
        onBack={() => setView(detail?.hasResults ? "results" : "brief")}
      />
    );
  }

  if (view === "panel" && detail) {
    return (
      <PanelBuilder
        memberId={memberId}
        detail={detail}
        onBack={() => setView("brief")}
        onSaved={() => {
          // Saving advanced the member's stage; refresh, then move straight into
          // authoring the care plan.
          load();
          setView("carePlan");
        }}
      />
    );
  }

  if (view === "results") {
    return (
      <CaseResults
        memberId={memberId}
        memberName={memberName}
        onBack={() => setView("brief")}
        onEditCarePlan={() => setView("carePlan")}
      />
    );
  }

  return (
    <main className="doc-page">
      <button type="button" className="doc-back" onClick={onBack}>
        ← All cases
      </button>

      {error && <p role="alert" className="doc-error">Couldn't load case ({error}).</p>}
      {!detail && !error && <p className="doc-muted">Loading…</p>}

      {detail && (
        <>
          <header className="doc-head">
            <div>
              <span className="doc-eyebrow">Case</span>
              <h1>{detail.memberName ?? detail.memberEmail ?? "Member"}</h1>
              {/* Age/sex live in the brief's vitals line, so only the journey
                  stage belongs up here. */}
              <p className="doc-sub">{stageLabel(detail.stage)}</p>
            </div>
            {detail.hasResults ? (
              <button type="button" className="doc-primary" onClick={() => setView("results")}>
                View results
              </button>
            ) : (
              <button type="button" className="doc-primary" onClick={() => setView("panel")}>
                Order blood panel
              </button>
            )}
          </header>

          <CaseBrief detail={detail} />
        </>
      )}
    </main>
  );
}

export default CaseDetail;
