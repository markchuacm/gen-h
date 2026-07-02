// ─── Doctor Review Brief · living brief panel ─────────────────────────────────
// The warm "document" that fills in as the member shares context. Reveals only
// the sections that hold content, tags each item's source, and offers an edit
// affordance that jumps back to the relevant question.
//
// Layout, top → bottom: status head · "Top of mind highlights to doctor" hero ·
// derived answer sections · Attachments (Claude-style file cards) · safety note.

import {
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Pencil,
  ShieldCheck,
  Table as TableIcon,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { STATUS_LABEL } from "./briefEngine";
import type { BriefSummary } from "./briefEngine";
import { SOURCE_LABEL } from "./types";
import type {
  AttachmentCard,
  AttachmentKind,
  BriefSynthesis,
  BriefTheme,
  RenderSection,
} from "./types";

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

export function BriefStatusIndicator({
  summary,
  synthesis,
}: {
  summary: BriefSummary;
  synthesis?: BriefSynthesis;
}) {
  const synthesisCounts = synthesis?.progress
    ? [
        synthesis.progress.themesPrepared > 0
          ? `${synthesis.progress.themesPrepared} themes prepared`
          : null,
        synthesis.progress.markersRead > 0
          ? `${synthesis.progress.markersRead} markers read`
          : null,
        synthesis.progress.questionsQueued > 0
          ? `${synthesis.progress.questionsQueued} context questions queued`
          : null,
      ].filter(Boolean)
    : [];
  const counts = [
    ...synthesisCounts,
    summary.areasCaptured > 0
      ? `${summary.areasCaptured} areas captured`
      : null,
    summary.filesUploaded > 0 ? `${summary.filesUploaded} uploaded` : null,
    synthesisCounts.length === 0 && summary.reviewAreas > 0
      ? `${summary.reviewAreas} for your doctor`
      : null,
  ].filter(Boolean);

  return (
    <div className={`drb-status drb-status--${summary.status}`}>
      <span className="drb-status-label">Brief status</span>
      <strong>{STATUS_LABEL[summary.status]}</strong>
      {counts.length > 0 && (
        <span className="drb-status-counts">{counts.join(" · ")}</span>
      )}
    </div>
  );
}

// ─── Top of mind highlights ───────────────────────────────────────────────────

function BriefNarrative({ synthesis }: { synthesis?: BriefSynthesis }) {
  const narrative = synthesis?.narrative?.trim();
  if (!narrative && synthesis?.status !== "synthesizing") return null;
  return (
    <section className="drb-narrative" aria-label="What we understand so far">
      <span className="drb-highlights-eyebrow">What we understand so far</span>
      <p>
        {narrative ||
          "Preparing a grounded doctor-prep summary from your uploads and answers."}
      </p>
    </section>
  );
}

function ThemeEvidence({ theme }: { theme: BriefTheme }) {
  if (!theme.evidence.length) return null;
  return (
    <div
      className="drb-theme-evidence"
      aria-label={`Evidence for ${theme.title}`}
    >
      {theme.evidence.slice(0, 5).map((evidence, index) => (
        <span
          key={`${theme.id}-${evidence.label}-${index}`}
          className="drb-evidence-chip"
        >
          {evidence.source
            ? `${evidence.source} · ${evidence.label}`
            : evidence.label}
        </span>
      ))}
    </div>
  );
}

function SynthesisThemes({ synthesis }: { synthesis?: BriefSynthesis }) {
  const themes = synthesis?.themes ?? [];
  if (
    themes.length === 0 &&
    synthesis?.status !== "synthesizing" &&
    synthesis?.status !== "error"
  )
    return null;
  return (
    <section className="drb-themes" aria-label="Top of mind for your doctor">
      <header className="drb-highlights-head">
        <span className="drb-highlights-eyebrow">Top of mind</span>
        <h4>For your doctor to review</h4>
      </header>
      {themes.length > 0 ? (
        <ul className="drb-theme-list">
          {themes.map((theme) => (
            <li
              key={theme.id}
              className={`drb-theme drb-theme--${theme.confidence}`}
            >
              <div className="drb-theme-body">
                <div className="drb-theme-title-row">
                  <p className="drb-highlight-title">{theme.title}</p>
                  <span>{theme.confidence} confidence</span>
                </div>
                <p className="drb-highlight-detail">{theme.summary}</p>
                <ThemeEvidence theme={theme} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="drb-theme drb-theme--pending">
          <p className="drb-highlight-title">
            {synthesis?.status === "error"
              ? "Themes need another pass"
              : "Preparing themes from your uploads"}
          </p>
          <p className="drb-highlight-detail">
            {synthesis?.status === "error"
              ? "Your attachments are still in the brief. Try re-uploading or removing a file to run synthesis again."
              : "We are reading across the uploaded documents before showing doctor-prep priorities."}
          </p>
        </div>
      )}
      <p className="drb-highlights-note">
        These are doctor-prep themes based on extracted report facts and your
        answers. They are not diagnoses, treatment recommendations, or urgency
        labels.
      </p>
    </section>
  );
}

// ─── Attachments (Claude-style file cards) ────────────────────────────────────

const KIND_ICON: Record<AttachmentKind, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  sheet: TableIcon,
  doc: FileIcon,
};

function truncateName(fileName: string, max = 16): string {
  const base = fileName.replace(/\.[^.]+$/, "").trim();
  if (base.length <= max) return base;
  return `${base.slice(0, max).trimEnd()}…`;
}

function AttachmentCardView({
  card,
  manageMode,
  onRemove,
}: {
  card: AttachmentCard;
  manageMode?: boolean;
  onRemove?: (fileId: string) => void;
}) {
  const Icon = KIND_ICON[card.kind];
  const analyzing = card.status === "analyzing";
  return (
    <div
      className={`drb-attachment drb-attachment--${card.kind} ${analyzing ? "is-analyzing" : ""}`}
    >
      <div className="drb-attachment-thumb">
        <Icon strokeWidth={1.5} aria-hidden="true" />
        <span className="drb-attachment-ext">{card.ext}</span>
        {card.flaggedCount > 0 && (
          <span
            className="drb-attachment-flag"
            title={`${card.flaggedCount} flagged for doctor`}
          >
            {card.flaggedCount}
          </span>
        )}
      </div>
      <div className="drb-attachment-meta">
        <p className="drb-attachment-name" title={card.fileName}>
          {truncateName(card.fileName)}
        </p>
        <p className="drb-attachment-sub">
          {analyzing ? "Reviewing…" : card.typeLabel}
        </p>
      </div>
      {manageMode && onRemove && (
        <button
          type="button"
          className="drb-attachment-remove"
          aria-label={`Remove ${card.fileName}`}
          onClick={() => onRemove(card.fileId)}
        >
          <Trash2 strokeWidth={1.8} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function Attachments({
  attachments,
  onRemove,
}: {
  attachments: AttachmentCard[];
  onRemove?: (fileId: string) => void;
}) {
  const [manageMode, setManageMode] = useState(false);
  if (attachments.length === 0) return null;
  return (
    <section className="drb-attachments" aria-label="Attachments">
      <header className="drb-attachments-head">
        <h4>Attachments</h4>
        {onRemove && (
          <button
            type="button"
            className="drb-edit"
            aria-pressed={manageMode}
            onClick={() => setManageMode((v) => !v)}
          >
            {manageMode ? (
              <X strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <Pencil strokeWidth={1.8} aria-hidden="true" />
            )}
            {manageMode ? "Done" : "Manage"}
          </button>
        )}
      </header>
      <div className="drb-attachment-grid">
        {attachments.map((card) => (
          <AttachmentCardView
            key={card.fileId}
            card={card}
            manageMode={manageMode}
            onRemove={onRemove}
          />
        ))}
      </div>
    </section>
  );
}

// ─── Derived answer sections ──────────────────────────────────────────────────

function BriefSectionView({
  section,
  onEdit,
}: {
  section: RenderSection;
  onEdit?: (questionId: string) => void;
}) {
  return (
    <section className="drb-brief-section">
      <header>
        <h4>{section.title}</h4>
        {section.editQuestionId && onEdit && (
          <button
            type="button"
            className="drb-edit"
            onClick={() => onEdit(section.editQuestionId!)}
          >
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
            <span className={`drb-source drb-source--${it.source}`}>
              {SOURCE_LABEL[it.source]}
            </span>
          </li>
        ))}
      </ul>
      {section.id === "reviewAreas" && (
        <p className="drb-brief-section-note">
          These are topics for your doctor to review, not diagnoses or treatment
          recommendations.
        </p>
      )}
    </section>
  );
}

export function LivingBriefPanel({
  sections,
  summary,
  attachments = [],
  synthesis,
  onEdit,
  onRemoveAttachment,
  showStatus = true,
}: {
  sections: RenderSection[];
  summary: BriefSummary;
  attachments?: AttachmentCard[];
  synthesis?: BriefSynthesis;
  onEdit?: (questionId: string) => void;
  onRemoveAttachment?: (fileId: string) => void;
  showStatus?: boolean;
}) {
  const isEmpty =
    sections.length === 0 &&
    attachments.length === 0 &&
    !synthesis?.narrative &&
    !synthesis?.themes?.length;

  return (
    <div className="drb-brief">
      <div className="drb-brief-head">
        <div>
          <span className="drb-brief-eyebrow">Doctor Review Brief</span>
          <span className="drb-brief-badge">Draft · Pending doctor review</span>
        </div>
        {showStatus && (
          <BriefStatusIndicator summary={summary} synthesis={synthesis} />
        )}
      </div>

      {isEmpty ? (
        <div className="drb-brief-empty">
          <p className="drb-brief-empty-title">
            We'll build this as you share context.
          </p>
          <p className="drb-brief-empty-body">
            As you answer, your Gen-H doctor's brief takes shape here — your
            reasons, goals, and anything you upload.
          </p>
        </div>
      ) : (
        <>
          <BriefNarrative synthesis={synthesis} />
          <SynthesisThemes synthesis={synthesis} />

          {sections.length > 0 && (
            <div className="drb-brief-sections">
              {sections.map((section) => (
                <BriefSectionView
                  key={section.id}
                  section={section}
                  onEdit={onEdit}
                />
              ))}
            </div>
          )}

          <Attachments
            attachments={attachments}
            onRemove={onRemoveAttachment}
          />
        </>
      )}

      <SafetyNote />
    </div>
  );
}
