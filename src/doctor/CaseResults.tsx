import ResultsDashboard from "../member-v2/screens/results/ResultsDashboard";
import "../member-v2/shell/shell.css";
import "../member-v2/screens/results/results.css";

// The doctor sees the member's biomarkers in the exact same visualization the
// member gets — the shared ResultsDashboard, scoped to this member's released
// results. Only the surrounding chrome (back / proceed to care plan) differs.
function CaseResults({
  memberId,
  memberName,
  onBack,
  onEditCarePlan,
}: {
  memberId: string;
  memberName: string | null;
  onBack: () => void;
  onEditCarePlan: () => void;
}) {
  return (
    <main className="p-page doc-page">
      <button type="button" className="doc-back" onClick={onBack}>
        ← Case brief
      </button>

      <header className="doc-head">
        <div>
          <h1 className="p-h1">
            Results for <em>{memberName?.split(" ")[0] ?? "member"}</em>
          </h1>
        </div>
        <button type="button" className="p-btn" onClick={onEditCarePlan}>
          Open care plan
        </button>
      </header>

      {/* The shared dashboard brings its own member-voiced heading ("Your
          results / Core biomarker overviews") — redundant under ours, so the
          doc-results scope hides it. */}
      <div className="doc-results">
        <ResultsDashboard memberId={memberId} />
      </div>
    </main>
  );
}

export default CaseResults;
