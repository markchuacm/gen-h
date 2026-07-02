// ─── Doctor Review Brief · intake shell ───────────────────────────────────────
// Full-screen, calm, warm canvas that houses the whole flow. Desktop shows a
// split (living brief left, one question right); mobile is single-column with a
// sticky "View brief" sheet and gentle "added to your brief" confirmations.

import { useEffect, useRef, useState } from "react";
import { FileText, X } from "lucide-react";
import { LivingBriefPanel } from "./LivingBriefPanel";
import { QuestionPanel } from "./QuestionPanel";
import { BookingConfirmation, BookingView, BriefPreview } from "./BriefPreview";
import { useIntakeState, type Phase } from "./useIntakeState";
import "./doctor-review-brief.css";

function useBriefToast(itemCount: number, queuedCount: number): string | null {
  const [toast, setToast] = useState<string | null>(null);
  const prevItems = useRef(itemCount);
  const prevQueued = useRef(queuedCount);
  useEffect(() => {
    let message: string | null = null;
    if (queuedCount > prevQueued.current) {
      message = "New question based on your results";
    } else if (itemCount > prevItems.current) {
      message = "Added to your brief";
    }
    prevItems.current = itemCount;
    prevQueued.current = queuedCount;
    if (message) {
      setToast(message);
      const t = setTimeout(() => setToast(null), 2200);
      return () => clearTimeout(t);
    }
  }, [itemCount, queuedCount]);
  return toast;
}

export function IntakeShell({
  onExit,
  startAt,
}: {
  onExit: () => void;
  startAt?: Phase;
}) {
  const c = useIntakeState(startAt ? { initialPhase: startAt } : undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const itemCount = c.sections.reduce((n, s) => n + s.items.length, 0);
  const toast = useBriefToast(itemCount, c.dynamicQuestionQueue.length);

  const isIntake = c.phase === "intake";

  return (
    <div
      className="drb-shell"
      role="dialog"
      aria-modal="true"
      aria-label="Doctor Review Brief intake"
    >
      <header className="drb-topbar">
        <button type="button" className="drb-exit" onClick={onExit}>
          <X strokeWidth={2} aria-hidden="true" />
          Exit to profile
        </button>
        <span className="drb-topbar-brand">Doctor Review Brief</span>
        <span className="drb-topbar-spacer" aria-hidden="true" />
      </header>

      <div
        className={`drb-body ${isIntake ? "drb-body--split" : "drb-body--single"}`}
      >
        {isIntake ? (
          <>
            <aside className="drb-brief-col">
              <LivingBriefPanel
                sections={c.sections}
                summary={c.summary}
                attachments={c.attachments}
                synthesis={c.briefSynthesis}
                agentSteps={c.agentSteps}
                pipelineRunning={
                  c.pipelineStatus === "running" &&
                  c.currentStep?.kind !== "preparing"
                }
                onEdit={c.goToQuestion}
                onRemoveAttachment={c.removeFile}
              />
            </aside>
            <main className="drb-question-col">
              <QuestionPanel c={c} />
            </main>
          </>
        ) : (
          <main className="drb-single-col">
            {c.phase === "preview" && <BriefPreview c={c} />}
            {c.phase === "booking" && <BookingView c={c} />}
            {c.phase === "confirmation" && (
              <BookingConfirmation c={c} onExit={onExit} />
            )}
          </main>
        )}
      </div>

      {/* Mobile: sticky view-brief control + sheet */}
      {isIntake && (
        <button
          type="button"
          className="drb-view-brief"
          onClick={() => setSheetOpen(true)}
        >
          <FileText strokeWidth={1.8} aria-hidden="true" />
          View brief{itemCount > 0 ? ` · ${itemCount}` : ""}
        </button>
      )}

      {sheetOpen && (
        <div
          className="drb-sheet"
          role="dialog"
          aria-label="Your Doctor Review Brief"
        >
          <div className="drb-sheet-head">
            <strong>Your brief</strong>
            <button
              type="button"
              className="drb-exit"
              onClick={() => setSheetOpen(false)}
            >
              <X strokeWidth={2} aria-hidden="true" />
              Close
            </button>
          </div>
          <div className="drb-sheet-body">
            <LivingBriefPanel
              sections={c.sections}
              summary={c.summary}
              attachments={c.attachments}
              synthesis={c.briefSynthesis}
              agentSteps={c.agentSteps}
              pipelineRunning={
                c.pipelineStatus === "running" &&
                c.currentStep?.kind !== "preparing"
              }
              onRemoveAttachment={c.removeFile}
              onEdit={(q) => {
                setSheetOpen(false);
                c.goToQuestion(q);
              }}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className="drb-toast" role="status">
          {toast}
        </div>
      )}
    </div>
  );
}

export default IntakeShell;
