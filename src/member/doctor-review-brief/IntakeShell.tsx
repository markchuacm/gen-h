// ─── Doctor Review Brief · intake shell ───────────────────────────────────────
// Full-screen, calm, warm canvas that houses the focused single-column flow.

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { QuestionPanel } from "./QuestionPanel";
import { BookingConfirmation, BookingView, BriefPreview } from "./BriefPreview";
import { useIntakeState, type Phase } from "./useIntakeState";
import "./doctor-review-brief.css";

function useBriefTick(itemCount: number): boolean {
  const [toast, setToast] = useState<string | null>(null);
  const prevItems = useRef(itemCount);
  useEffect(() => {
    const message = itemCount > prevItems.current ? "Added to your brief" : null;
    prevItems.current = itemCount;
    if (message) {
      setToast(message);
      const t = setTimeout(() => setToast(null), 1600);
      return () => clearTimeout(t);
    }
  }, [itemCount]);
  return !!toast;
}

export function IntakeShell({
  onExit,
  startAt,
}: {
  onExit: () => void;
  startAt?: Phase;
}) {
  const c = useIntakeState(startAt ? { initialPhase: startAt } : undefined);
  const itemCount = c.sections.reduce((n, s) => n + s.items.length, 0);
  const showTick = useBriefTick(itemCount);

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
      {isIntake && (
        <div className="drb-progress" aria-hidden="true">
          <span
            className="drb-progress-fill"
            style={{
              width: `${Math.round((c.progress.current / c.progress.total) * 100)}%`,
            }}
          />
        </div>
      )}

      <div
        className={`drb-body ${isIntake ? "drb-body--single" : "drb-body--single"}`}
      >
        {isIntake ? (
          <main className="drb-flow-col">
            <QuestionPanel c={c} />
          </main>
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

      {showTick && (
        <div className="drb-commit-tick" role="status">
          Added to your brief ✓
        </div>
      )}
    </div>
  );
}

export default IntakeShell;
