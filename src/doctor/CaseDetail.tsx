import { useCallback, useEffect, useState } from "react";
import { fetchCaseDetail } from "../lib/api/doctor";
import type { DoctorCase, DoctorCaseDetail } from "../lib/api/doctor";
import CarePlanEditor from "./CarePlanEditor";
import CaseProfile from "./CaseProfile";
import CaseResults from "./CaseResults";
import PanelBuilder from "./PanelBuilder";

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
          // Saving advanced the member's stage; refresh so the brief reflects it.
          load();
          setView("brief");
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
              <span className="doc-eyebrow">CASE</span>
              <h1>{detail.memberName ?? detail.memberEmail ?? "Member"}</h1>
              <p className="doc-sub">
                {[detail.age ? `${detail.age}y` : null, detail.sex, detail.stage]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
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

          <CaseProfile detail={detail} />
        </>
      )}
    </main>
  );
}

export default CaseDetail;
