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
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { buildBriefSections } from "./briefEngine";
import type {
  AttachmentCard,
  AttachmentKind,
  BriefSynthesis,
  IntakeState,
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

export function FlagChip({ flag }: { flag: MarkerFinding["flag"] }) {
  if (!flag) return null;
  const Icon = flag === "high" ? ArrowUp : flag === "low" ? ArrowDown : Minus;
  return (
    <span className={`drb-oor-flag drb-oor-flag--${flag}`}>
      <Icon strokeWidth={2.2} aria-hidden="true" />
      {FLAG_LABEL[flag]}
    </span>
  );
}

export function OutOfRangeSection({
  findings,
}: {
  findings: MarkerFinding[];
}) {
  if (findings.length === 0) return null;
  const sources = Array.from(
    new Set(findings.map((finding) => finding.sourceLabel).filter(Boolean)),
  ) as string[];
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
          </li>
        ))}
      </ul>
      {sources.length > 0 && (
        <p className="drb-oor-source-summary">
          Sources: {sources.length} uploaded report{sources.length === 1 ? "" : "s"}
        </p>
      )}
    </DoctorSection>
  );
}

function RelationshipsSection({
  relationships,
}: {
  relationships: MarkerRelationship[];
}) {
  const investigationAreas = relationships.filter(isInvestigationArea);
  if (investigationAreas.length === 0) return null;
  return (
    <DoctorSection eyebrow="Areas" title="Areas of investigation">
      <ul className="drb-rel-list">
        {investigationAreas.map((relationship, index) => (
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

function isInvestigationArea(relationship: MarkerRelationship): boolean {
  const text = `${relationship.title} ${relationship.note}`.toLowerCase();
  const isOnlyRangeRestatement =
    /\b(above|below|outside|within)\b/.test(text) &&
    /\b(reference range|printed range|range)\b/.test(text) &&
    !/\b(could|may|possible|context|because|cause|contribut|driven|related|investigat|follow up|missing|apob|apo b|lp\(a\)|lipoprotein|hydration|creatine|training|exercise|sleep|diet|supplement|work|indoor|sun|alcohol|medication|kidney|renal|thyroid|iron|inflammation)\b/.test(
      text,
    );
  if (isOnlyRangeRestatement) return false;
  return /\b(could|may|possible|context|cause|contribut|driven|related|investigat|follow up|missing|apob|apo b|lp\(a\)|lipoprotein|hydration|creatine|training|exercise|sleep|diet|supplement|work|indoor|sun|alcohol|medication|kidney|renal|thyroid|iron|inflammation)\b/.test(
    text,
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

const KIND_ICON: Record<AttachmentKind, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  sheet: TableIcon,
  doc: FileIcon,
};

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
  return (
    <div className={`drb-attachment drb-attachment--${card.kind}`}>
      <div className="drb-attachment-thumb">
        <Icon strokeWidth={1.5} aria-hidden="true" />
        <span className="drb-attachment-ext">{card.ext}</span>
        {card.flaggedCount > 0 && (
          <span className="drb-attachment-flag">{card.flaggedCount}</span>
        )}
      </div>
      <div className="drb-attachment-meta">
        <p className="drb-attachment-name" title={card.fileName}>
          {card.fileName}
        </p>
        <p className="drb-attachment-sub">{card.typeLabel}</p>
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
            <Pencil strokeWidth={1.8} aria-hidden="true" />
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

function BriefSectionView({
  section,
  onEdit,
}: {
  section: RenderSection;
  onEdit?: (questionId: string) => void;
}) {
  const isFollowUpSection = section.title === "Follow-up answers";
  return (
    <section
      className={`drb-brief-section${isFollowUpSection ? " drb-brief-section--followups" : ""}`}
    >
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
              {it.label && (
                <strong className="drb-brief-label">
                  {it.label}
                  {isFollowUpSection ? "" : ": "}
                </strong>
              )}
              {it.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function BriefDocument({
  state,
  synthesis,
  attachments,
  onEdit,
  onRemoveAttachment,
}: {
  state: IntakeState;
  synthesis?: BriefSynthesis;
  attachments: AttachmentCard[];
  onEdit?: (questionId: string) => void;
  onRemoveAttachment?: (fileId: string) => void;
}) {
  const sections = buildBriefSections(state);
  const preparedDate = synthesis?.updatedAt
    ? new Date(synthesis.updatedAt).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <article className="drb-document">
      <div className="drb-document-head" aria-label="Brief metadata">
        <span>Prepared {preparedDate}</span>
        <span>
          {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
        </span>
        <span>{synthesis?.progress.markersRead ?? 0} markers captured</span>
      </div>

      {synthesis?.narrative && (
        <section className="drb-narrative">
          <span className="drb-highlights-eyebrow">Summary</span>
          <p>{synthesis.narrative}</p>
        </section>
      )}

      <OutOfRangeSection findings={synthesis?.outOfRange ?? []} />
      <RelationshipsSection relationships={synthesis?.relationships ?? []} />
      <ListSection
        eyebrow="From you"
        title="Patient-reported context"
        items={synthesis?.patientContext ?? []}
        keyPrefix="pc"
      />

      {sections.length > 0 && (
        <details className="drb-answers-collapsed">
          <summary>Everything on record</summary>
          <div className="drb-brief-sections">
            {sections.map((section) => (
              <BriefSectionView
                key={section.id}
                section={section}
                onEdit={onEdit}
              />
            ))}
          </div>
        </details>
      )}

      <Attachments
        attachments={attachments}
        onRemove={onRemoveAttachment}
      />
      <SafetyNote />
    </article>
  );
}
