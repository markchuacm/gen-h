// ─── Doctor Review Brief · Profile tab entry ──────────────────────────────────
// Lives inside the member portal Profile tab. A single warm card that invites
// the member into the brief flow (or back into a saved one).

import { CalendarClock, ChevronRight, FileCheck2, ShieldCheck, Sparkles } from "lucide-react";
import { readBriefStatus, readHasSavedProgress } from "./useIntakeState";
import "./doctor-review-brief.css";

export function ProfileTab({ onStart, onViewBrief, onReset }: { onStart: () => void; onViewBrief: () => void; onReset: () => void }) {
  const briefStatus = readBriefStatus();
  const hasProgress = readHasSavedProgress();

  if (briefStatus?.isBooked) {
    return (
      <div className="drb-entry-wrap">
        <section className="dashboard-card drb-entry" aria-labelledby="drb-booked-title">
          <span className="status-pill">Brief submitted</span>
          <h2 id="drb-booked-title">
            Your doctor review <em>is booked</em>
          </h2>
          <p>
            Your Doctor Review Brief has been shared with your Gen-H doctor. They'll review it before your consult.
          </p>

          <ul className="drb-confirm-list">
            <li>
              <CalendarClock strokeWidth={1.7} aria-hidden="true" />
              <div>
                <strong>Appointment</strong>
                <span>We'll confirm your teleconsult time by WhatsApp shortly.</span>
              </div>
            </li>
            <li>
              <FileCheck2 strokeWidth={1.7} aria-hidden="true" />
              <div>
                <strong>Your brief</strong>
                <span>
                  {briefStatus.areasCaptured} area{briefStatus.areasCaptured !== 1 ? "s" : ""} captured
                  {briefStatus.filesUploaded > 0 ? ` · ${briefStatus.filesUploaded} uploaded` : ""}
                  {" · shared with your doctor"}
                </span>
              </div>
            </li>
          </ul>

          <button type="button" className="primary-action drb-entry-cta" onClick={onViewBrief}>
            View my brief
            <ChevronRight strokeWidth={2} aria-hidden="true" />
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="drb-entry-wrap">
      <section className="dashboard-card drb-entry" aria-labelledby="drb-entry-title">
        <span className="status-pill">Doctor review</span>
        <h2 id="drb-entry-title">
          Prepare your <em>doctor review</em>
        </h2>
        <p>
          Upload what you already have, tell us what you want to improve, and we'll prepare a structured brief for your
          Gen-H doctor before the consult.
        </p>

        <ul className="drb-entry-points">
          <li>
            <Sparkles strokeWidth={1.7} aria-hidden="true" />
            Organises your existing reports and context
          </li>
          <li>
            <ShieldCheck strokeWidth={1.7} aria-hidden="true" />
            Prepared for clinician review — not a diagnosis
          </li>
        </ul>

        <div className="drb-entry-actions">
          <button type="button" className="primary-action drb-entry-cta" onClick={onStart}>
            {hasProgress ? "Continue my brief" : "Start my brief"}
            <ChevronRight strokeWidth={2} aria-hidden="true" />
          </button>
          {hasProgress && (
            <button type="button" className="drb-entry-reset" onClick={onReset}>
              Start over
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProfileTab;
