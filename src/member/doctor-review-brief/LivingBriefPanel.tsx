// ─── Doctor Review Brief · living brief panel ─────────────────────────────────
// The warm "document" that fills in as the member shares context. Reveals only
// the sections that hold content, tags each item's source, and offers an edit
// affordance that jumps back to the relevant question.

import { Pencil, ShieldCheck } from "lucide-react";
import { STATUS_LABEL } from "./briefEngine";
import type { BriefSummary } from "./briefEngine";
import { SOURCE_LABEL } from "./types";
import type { RenderSection } from "./types";

export const SAFETY_NOTE =
  "Gen-H uses your information to prepare a structured brief for clinician review. This brief is not a diagnosis, treatment plan, or substitute for medical advice. Your doctor will review your information and confirm appropriate next steps during your consultation.";

export function SafetyNote() {
  return (
    <p className="drb-safety" role="note">
      <ShieldCheck strokeWidth={1.7} aria-hidden="true" />
      <span>{SAFETY_NOTE}</span>
    </p>
  );
}

export function BriefStatusIndicator({ summary }: { summary: BriefSummary }) {
  const counts = [
    summary.areasCaptured > 0 ? `${summary.areasCaptured} areas captured` : null,
    summary.filesUploaded > 0 ? `${summary.filesUploaded} uploaded` : null,
    summary.reviewAreas > 0 ? `${summary.reviewAreas} for your doctor` : null,
  ].filter(Boolean);

  return (
    <div className={`drb-status drb-status--${summary.status}`}>
      <span className="drb-status-label">Brief status</span>
      <strong>{STATUS_LABEL[summary.status]}</strong>
      {counts.length > 0 && <span className="drb-status-counts">{counts.join(" · ")}</span>}
    </div>
  );
}

function BriefSectionView({ section, onEdit }: { section: RenderSection; onEdit?: (questionId: string) => void }) {
  return (
    <section className="drb-brief-section">
      <header>
        <h4>{section.title}</h4>
        {section.editQuestionId && onEdit && (
          <button type="button" className="drb-edit" onClick={() => onEdit(section.editQuestionId!)}>
            <Pencil strokeWidth={1.8} aria-hidden="true" />
            Edit
          </button>
        )}
      </header>
      <ul>
        {section.items.map((it) => (
          <li key={it.id}>
            <span className="drb-brief-value">
              {it.label && <strong>{it.label}: </strong>}
              {it.value}
            </span>
            <span className={`drb-source drb-source--${it.source}`}>{SOURCE_LABEL[it.source]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LivingBriefPanel({
  sections,
  summary,
  onEdit,
  showStatus = true,
}: {
  sections: RenderSection[];
  summary: BriefSummary;
  onEdit?: (questionId: string) => void;
  showStatus?: boolean;
}) {
  return (
    <div className="drb-brief">
      <div className="drb-brief-head">
        <div>
          <span className="drb-brief-eyebrow">Doctor Review Brief</span>
          <span className="drb-brief-badge">Draft · Pending doctor review</span>
        </div>
        {showStatus && <BriefStatusIndicator summary={summary} />}
      </div>

      {sections.length === 0 ? (
        <div className="drb-brief-empty">
          <p className="drb-brief-empty-title">We'll build this as you share context.</p>
          <p className="drb-brief-empty-body">
            As you answer, your Gen-H doctor's brief takes shape here — your reasons, goals, and anything you upload.
          </p>
        </div>
      ) : (
        <div className="drb-brief-sections">
          {sections.map((section) => (
            <BriefSectionView key={section.id} section={section} onEdit={onEdit} />
          ))}
        </div>
      )}

      <SafetyNote />
    </div>
  );
}
