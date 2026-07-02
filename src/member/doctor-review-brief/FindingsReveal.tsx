import { Sparkles } from "lucide-react";
import { findingsFromInsights } from "./briefEngine";
import { OutOfRangeSection, SAFETY_NOTE } from "./BriefDocument";
import type { IntakeController } from "./useIntakeState";

export function FindingsReveal({ c }: { c: IntakeController }) {
  const findings = findingsFromInsights(c.state);
  const outOfRange = findings.filter((finding) => finding.flag);
  const documentsRead = Object.values(c.state.aiDocumentInsights ?? {}).filter(
    (insight) => insight.status === "done" || insight.status === "needs_review",
  ).length;

  return (
    <div className="drb-findings">
      <header className="drb-step-head">
        <span className="drb-step-eyebrow">Here's what we read</span>
        <h3>Your reports are in the brief</h3>
        <p className="drb-step-helper">
          We captured the printed facts first. The next few questions come from
          these results.
        </p>
      </header>

      <div className="drb-findings-stats" aria-label="Extraction summary">
        <span>
          <strong>{documentsRead}</strong>
          docs read
        </span>
        <span>
          <strong>{findings.length}</strong>
          markers captured
        </span>
        <span>
          <strong>{outOfRange.length}</strong>
          outside printed ranges
        </span>
      </div>

      {outOfRange.length > 0 ? (
        <OutOfRangeSection findings={outOfRange} />
      ) : (
        <div className="drb-findings-zero">
          <Sparkles strokeWidth={1.8} aria-hidden="true" />
          <p>
            No markers were captured outside their printed ranges. Your doctor
            will still review the uploaded documents with your answers.
          </p>
        </div>
      )}

      <p className="drb-safety" role="note">
        {SAFETY_NOTE}
      </p>
    </div>
  );
}
