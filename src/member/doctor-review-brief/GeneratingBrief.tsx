import { RefreshCw } from "lucide-react";
import { AgentActivityFeed } from "./AgentActivityFeed";
import type { IntakeController } from "./useIntakeState";

export function GeneratingBrief({ c }: { c: IntakeController }) {
  const synthesis = c.briefSynthesis;
  const isError = synthesis?.status === "error" || c.pipelineStatus === "error";
  const isReady = synthesis?.status === "ready";

  return (
    <div className="drb-generating">
      <header className="drb-step-head">
        <span className="drb-step-eyebrow">Finale</span>
        <h3>Generating your doctor's brief</h3>
        <p className="drb-step-helper">
          We're turning your reports and answers into one clinician-ready
          summary.
        </p>
      </header>

      <AgentActivityFeed steps={c.agentSteps} />

      <section className="drb-generating-narrative" aria-live="polite">
        <span className="drb-highlights-eyebrow">Drafting now</span>
        <p>
          {synthesis?.narrative?.trim() ||
            (isReady
              ? "Your brief is ready."
              : "Starting the final synthesis…")}
          {!isReady && !isError && <span className="drb-caret" aria-hidden="true" />}
        </p>
      </section>

      {isError && (
        <div className="drb-generate-error" role="alert">
          <p>
            {synthesis?.error ??
              "The final brief could not be generated. Your uploads and answers are safe."}
          </p>
          <button
            type="button"
            className="drb-continue"
            onClick={() => void c.generateBrief()}
          >
            <RefreshCw strokeWidth={1.8} aria-hidden="true" />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
