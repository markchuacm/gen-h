// ─── Doctor Review Brief · preview, booking & confirmation ────────────────────

import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
} from "lucide-react";
import { BriefDocument, SafetyNote } from "./BriefDocument";
import type { IntakeController } from "./useIntakeState";

export function BriefPreview({ c }: { c: IntakeController }) {
  return (
    <div className="drb-preview">
      <header className="drb-preview-head">
        <span className="drb-step-eyebrow">Draft summary</span>
        <h2>Your brief is ready</h2>
        <p>
          We've organised your reports and context into a clinician-ready
          summary for your Gen-H doctor.
        </p>
      </header>

      <BriefDocument
        state={c.state}
        attachments={c.attachments}
        synthesis={c.briefSynthesis}
        onEdit={c.goToQuestion}
        onRemoveAttachment={c.removeFile}
      />

      <div className="drb-booking-cta">
        <h3>Book your doctor review</h3>
        <p>
          <strong>RM99</strong> to book your Gen-H doctor review. Fully
          refundable if you don't feel the consult was useful. Your doctor
          receives your brief before the call.
        </p>
        <button
          type="button"
          className="drb-continue drb-continue--block"
          onClick={c.next}
        >
          Book for RM99
          <ChevronRight strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      <button
        type="button"
        className="drb-back drb-back--center"
        onClick={c.back}
      >
        <ChevronLeft strokeWidth={2} aria-hidden="true" />
        Back to questions
      </button>
    </div>
  );
}

export function BookingView({ c }: { c: IntakeController }) {
  return (
    <div className="drb-booking">
      <header className="drb-preview-head">
        <span className="drb-step-eyebrow">Doctor review</span>
        <h2>Confirm your Gen-H doctor review</h2>
        <p>
          A focused teleconsult with a Gen-H doctor who has already read your
          brief.
        </p>
      </header>

      <div className="drb-booking-card">
        <ul className="drb-booking-list">
          <li>
            <Check strokeWidth={2} aria-hidden="true" />
            Your Doctor Review Brief shared before the call
          </li>
          <li>
            <Check strokeWidth={2} aria-hidden="true" />
            Doctor validates priorities and flags any missing tests
          </li>
          <li>
            <Check strokeWidth={2} aria-hidden="true" />
            Clear, confirmed next steps for your care plan
          </li>
        </ul>
        <div className="drb-price-row">
          <span>Doctor review</span>
          <strong>RM99</strong>
        </div>
        <p className="drb-refund">
          Fully refundable if you don't feel the consult was useful.
        </p>
        <button
          type="button"
          className="drb-continue drb-continue--block"
          onClick={c.next}
        >
          Book for RM99
          <ChevronRight strokeWidth={2} aria-hidden="true" />
        </button>
        <p className="drb-placeholder-note">
          Placeholder booking — no payment is taken in this version.
        </p>
      </div>

      <SafetyNote />

      <button
        type="button"
        className="drb-back drb-back--center"
        onClick={c.back}
      >
        <ChevronLeft strokeWidth={2} aria-hidden="true" />
        Back to brief
      </button>
    </div>
  );
}

export function BookingConfirmation({
  c,
  onExit,
}: {
  c: IntakeController;
  onExit: () => void;
}) {
  return (
    <div className="drb-confirm">
      <div className="drb-confirm-badge" aria-hidden="true">
        <Check strokeWidth={2.5} />
      </div>
      <h2>Your doctor review is booked</h2>
      <p>
        Your Doctor Review Brief will be shared with your Gen-H doctor before
        the consult. During the call, your doctor will validate the priorities,
        identify any missing tests, and confirm your next steps.
      </p>

      <ul className="drb-confirm-list">
        <li>
          <CalendarClock strokeWidth={1.7} aria-hidden="true" />
          <div>
            <strong>Appointment</strong>
            <span>
              We'll confirm your teleconsult time by WhatsApp shortly.
            </span>
          </div>
        </li>
        <li>
          <FileCheck2 strokeWidth={1.7} aria-hidden="true" />
          <div>
            <strong>Your brief</strong>
            <span>
              {c.summary.areasCaptured} areas captured ·{" "}
              {c.summary.filesUploaded} uploaded · shared with your doctor
            </span>
          </div>
        </li>
      </ul>

      <button
        type="button"
        className="drb-continue drb-continue--block"
        onClick={onExit}
      >
        Back to my profile
      </button>
    </div>
  );
}
