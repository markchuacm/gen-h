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
    <main className="doc-page">
      <button type="button" className="doc-back" onClick={onBack}>
        ← Case brief
      </button>

      <header className="doc-head">
        <div>
          <span className="doc-eyebrow">RESULTS</span>
          <h1>{memberName ?? "Member"}</h1>
        </div>
        <button type="button" className="doc-primary" onClick={onEditCarePlan}>
          Edit care plan
        </button>
      </header>

      <ResultsDashboard memberId={memberId} />
    </main>
  );
}

export default CaseResults;
