// ─── Doctor Review Brief · agent activity feed ────────────────────────────────
// The visible reasoning rail: one row per pipeline stage (pending → active with
// a live detail line → done, collapsing to a summary), plus per-document chips
// under the extract step. Powered by real SSE `stage` / `doc` events — never
// theatre.

import { Check, FileText, Loader2, TriangleAlert } from "lucide-react";
import type { AgentStep, DocumentInsightStatus } from "./types";

export type FeedDoc = {
  fileId: string;
  name: string;
  status: DocumentInsightStatus | "uploaded";
  detail?: string;
};

function StepGlyph({ status }: { status: AgentStep["status"] }) {
  if (status === "done")
    return (
      <span className="drb-feed-glyph drb-feed-glyph--done" aria-hidden="true">
        <Check strokeWidth={2.6} />
      </span>
    );
  if (status === "error")
    return (
      <span className="drb-feed-glyph drb-feed-glyph--error" aria-hidden="true">
        <TriangleAlert strokeWidth={2} />
      </span>
    );
  return (
    <span
      className={`drb-feed-glyph drb-feed-glyph--${status}`}
      aria-hidden="true"
    />
  );
}

function DocChip({ doc }: { doc: FeedDoc }) {
  const analyzing = doc.status === "analyzing";
  return (
    <li
      className={`drb-feed-doc drb-feed-doc--${doc.status} ${analyzing ? "is-analyzing" : ""}`}
    >
      {analyzing ? (
        <Loader2 strokeWidth={1.8} aria-hidden="true" className="drb-spin" />
      ) : (
        <FileText strokeWidth={1.6} aria-hidden="true" />
      )}
      <span className="drb-feed-doc-name">{doc.name}</span>
      {doc.detail && <span className="drb-feed-doc-detail">{doc.detail}</span>}
    </li>
  );
}

/**
 * `condensed` renders a single quiet line (used atop the brief panel during a
 * later re-synthesis); the full rail is the main "preparing" moment.
 */
export function AgentActivityFeed({
  steps,
  docs = [],
  condensed = false,
  onRetry,
}: {
  steps: AgentStep[];
  docs?: FeedDoc[];
  condensed?: boolean;
  onRetry?: () => void;
}) {
  if (steps.length === 0) return null;

  if (condensed) {
    const active =
      steps.find((s) => s.status === "active") ??
      steps.find((s) => s.status === "error") ??
      steps[steps.length - 1];
    return (
      <div
        className={`drb-feed-condensed drb-feed-condensed--${active.status}`}
        role="status"
      >
        <StepGlyph status={active.status} />
        <span>{active.label}</span>
        {active.status === "active" && (
          <span className="drb-feed-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        )}
      </div>
    );
  }

  return (
    <ol className="drb-feed" aria-label="Preparing your brief">
      {steps.map((step) => (
        <li key={step.id} className={`drb-feed-step is-${step.status}`}>
          <StepGlyph status={step.status} />
          <div className="drb-feed-body">
            <div className="drb-feed-label-row">
              <span className="drb-feed-label">{step.label}</span>
              {step.status === "active" && (
                <span className="drb-feed-dots" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>
            {step.detail && (
              <span className="drb-feed-detail">{step.detail}</span>
            )}
            {step.status === "error" && onRetry && (
              <button type="button" className="drb-feed-retry" onClick={onRetry}>
                Try again
              </button>
            )}
            {step.id === "extract" &&
              step.status !== "pending" &&
              docs.length > 0 && (
                <ul className="drb-feed-docs">
                  {docs.map((doc) => (
                    <DocChip key={doc.fileId} doc={doc} />
                  ))}
                </ul>
              )}
          </div>
        </li>
      ))}
    </ol>
  );
}
