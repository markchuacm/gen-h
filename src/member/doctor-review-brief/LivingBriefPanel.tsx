// ─── Doctor Review Brief · living brief panel ─────────────────────────────────
// The doctor-facing brief that assembles live while the member shares context.
// Reveals only sections that hold content, in clinician-priority order:
// narrative · out-of-range markers · marker patterns · lifestyle context ·
// doctor questions · key themes · the member's own answers · attachments.
//
// Streaming: the narrative grows token-by-token from SSE deltas (terracotta
// caret while live); cards cascade in with staggered reveals. All motion is
// gated behind prefers-reduced-motion.

import {
  ArrowDown,
  ArrowUp,
  File as FileIcon,
  FileText,
  Image as ImageIcon,
  Minus,
  Pencil,
  ShieldCheck,
  Table as TableIcon,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AgentActivityFeed } from "./AgentActivityFeed";
import { RevealText } from "./RevealText";
import { STATUS_LABEL } from "./briefEngine";
import type { BriefSummary } from "./briefEngine";
import { SOURCE_LABEL } from "./types";
import type {
  AgentStep,
  AttachmentCard,
  AttachmentKind,
  BriefSynthesis,
  BriefTheme,
  MarkerFinding,
  MarkerRelationship,
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
  const progress = synthesis?.progress;
  const synthesisCounts =
    progress && synthesis?.status === "ready"
      ? [
          progress.markersRead > 0
            ? `${progress.markersRead} markers read`
            : null,
          progress.outOfRangeCount > 0
            ? `${progress.outOfRangeCount} outside ranges`
            : null,
        ].filter(Boolean)
      : [];
  const counts = [
    ...synthesisCounts,
    summary.areasCaptured > 0
      ? `${summary.areasCaptured} areas captured`
      : null,
    summary.filesUploaded > 0 ? `${summary.filesUploaded} uploaded` : null,
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

// ─── Narrative (streams token-by-token) ───────────────────────────────────────

function BriefNarrative({ synthesis }: { synthesis?: BriefSynthesis }) {
  const narrative = synthesis?.narrative?.trim();
  const streaming = synthesis?.status === "synthesizing";
  if (!narrative && !streaming) return null;
  return (
    <section className="drb-narrative" aria-label="What we understand so far">
      <span className="drb-highlights-eyebrow">What we understand so far</span>
      <p aria-live="polite">
        {narrative ? (
          synthesis?.degraded && !streaming ? (
            <RevealText text={narrative} />
          ) : (
            narrative
          )
        ) : (
          "Reading across your uploads and answers…"
        )}
        {streaming && <span className="drb-caret" aria-hidden="true" />}
      </p>
    </section>
  );
}

// ─── Doctor-facing sections ───────────────────────────────────────────────────

function DoctorSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="drb-doctor-section" aria-label={title}>
      <header className="drb-highlights-head">
        <span className="drb-highlights-eyebrow">{eyebrow}</span>
        <h4>{title}</h4>
      </header>
      {children}
    </section>
  );
}

const FLAG_LABEL: Record<string, string> = {
  high: "Above range",
  low: "Below range",
  abnormal: "Marked abnormal",
};

function FlagChip({ flag }: { flag: MarkerFinding["flag"] }) {
  if (!flag) return null;
  const Icon = flag === "high" ? ArrowUp : flag === "low" ? ArrowDown : Minus;
  return (
    <span className={`drb-oor-flag drb-oor-flag--${flag}`}>
      <Icon strokeWidth={2.2} aria-hidden="true" />
      {FLAG_LABEL[flag]}
    </span>
  );
}

function OutOfRangeSection({ findings }: { findings: MarkerFinding[] }) {
  if (findings.length === 0) return null;
  return (
    <DoctorSection eyebrow="From your reports" title="Outside printed ranges">
      <ul className="drb-oor-list">
        {findings.map((finding, index) => (
          <li
            key={finding.id}
            className="drb-oor-row drb-reveal"
            style={{ animationDelay: `${Math.min(index, 10) * 70}ms` }}
          >
            <div className="drb-oor-main">
              <span className="drb-oor-name">{finding.name}</span>
              <FlagChip flag={finding.flag} />
            </div>
            <div className="drb-oor-values">
              {finding.value && (
                <span className="drb-oor-value">
                  {finding.value}
                  {finding.unit ? ` ${finding.unit}` : ""}
                </span>
              )}
              {finding.referenceRange && (
                <span className="drb-oor-range">
                  ref {finding.referenceRange}
                </span>
              )}
            </div>
            {finding.sourceLabel && (
              <span className="drb-oor-source">{finding.sourceLabel}</span>
            )}
          </li>
        ))}
      </ul>
      <p className="drb-highlights-note">
        These restate what your report itself marks against its printed
        reference ranges — your doctor interprets them in context.
      </p>
    </DoctorSection>
  );
}

function RelationshipsSection({
  relationships,
}: {
  relationships: MarkerRelationship[];
}) {
  if (relationships.length === 0) return null;
  return (
    <DoctorSection eyebrow="Patterns" title="Reviewed together by your doctor">
      <ul className="drb-rel-list">
        {relationships.map((relationship, index) => (
          <li
            key={relationship.id}
            className="drb-rel drb-reveal"
            style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
          >
            <p className="drb-highlight-title">{relationship.title}</p>
            {relationship.note && (
              <p className="drb-highlight-detail">{relationship.note}</p>
            )}
            <div className="drb-theme-evidence">
              {relationship.markers.slice(0, 6).map((marker) => (
                <span key={marker} className="drb-evidence-chip">
                  {marker}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </DoctorSection>
  );
}

function ListSection({
  eyebrow,
  title,
  items,
  keyPrefix,
}: {
  eyebrow: string;
  title: string;
  items: string[];
  keyPrefix: string;
}) {
  if (items.length === 0) return null;
  return (
    <DoctorSection eyebrow={eyebrow} title={title}>
      <ul className="drb-doctor-list">
        {items.map((item, index) => (
          <li
            key={`${keyPrefix}-${index}`}
            className="drb-reveal"
            style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
          >
            {item}
          </li>
        ))}
      </ul>
    </DoctorSection>
  );
}

function SynthesisThemes({ synthesis }: { synthesis?: BriefSynthesis }) {
  const themes = synthesis?.themes ?? [];
  if (themes.length === 0 && synthesis?.status !== "error") return null;
  return (
    <section className="drb-themes" aria-label="Top of mind for your doctor">
      <header className="drb-highlights-head">
        <span className="drb-highlights-eyebrow">Top of mind</span>
        <h4>For your doctor to review</h4>
      </header>
      {themes.length > 0 ? (
        <ul className="drb-theme-list">
          {themes.map((theme, index) => (
            <li
              key={theme.id}
              className={`drb-theme drb-theme--${theme.confidence} drb-reveal`}
              style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
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
          <p className="drb-highlight-title">Themes need another pass</p>
          <p className="drb-highlight-detail">
            Your attachments are still in the brief. Continue answering — the
            brief retries as you go.
          </p>
        </div>
      )}
      {synthesis?.degraded && (
        <p className="drb-degraded-note">
          Prepared with basic matching — your doctor still sees everything you
          uploaded.
        </p>
      )}
      <p className="drb-highlights-note">
        These are doctor-prep themes based on extracted report facts and your
        answers. They are not diagnoses, treatment recommendations, or urgency
        labels.
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
          {analyzing ? "Reading…" : card.typeLabel}
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
  agentSteps = [],
  pipelineRunning = false,
  onEdit,
  onRemoveAttachment,
  showStatus = true,
}: {
  sections: RenderSection[];
  summary: BriefSummary;
  attachments?: AttachmentCard[];
  synthesis?: BriefSynthesis;
  agentSteps?: AgentStep[];
  pipelineRunning?: boolean;
  onEdit?: (questionId: string) => void;
  onRemoveAttachment?: (fileId: string) => void;
  showStatus?: boolean;
}) {
  const isEmpty =
    sections.length === 0 &&
    attachments.length === 0 &&
    !synthesis?.narrative &&
    !synthesis?.themes?.length &&
    !synthesis?.outOfRange?.length;

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

      {pipelineRunning && (
        <AgentActivityFeed steps={agentSteps} condensed />
      )}

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
          <OutOfRangeSection findings={synthesis?.outOfRange ?? []} />
          <RelationshipsSection
            relationships={synthesis?.relationships ?? []}
          />
          <ListSection
            eyebrow="Worth exploring"
            title="Lifestyle context to investigate"
            items={synthesis?.lifestyleContext ?? []}
            keyPrefix="lc"
          />
          <ListSection
            eyebrow="In the room"
            title="Questions your doctor may ask"
            items={synthesis?.doctorQuestions ?? []}
            keyPrefix="dq"
          />
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
