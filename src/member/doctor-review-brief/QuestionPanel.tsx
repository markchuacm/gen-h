// ─── Doctor Review Brief · question panel ─────────────────────────────────────
// Renders one focused step at a time — a question, the upload step, or the calm
// "preparing" moment — with Back / Skip / Continue.

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  File as FileIcon,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Table as TableIcon,
  TriangleAlert,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AgentActivityFeed } from "./AgentActivityFeed";
import type { FeedDoc } from "./AgentActivityFeed";
import {
  DynamicQuestionInput,
  FileUpload,
  LifestyleSnapshotInput,
  MultiSelectQuestion,
  QuickReplyGroup,
  SupplementsForm,
  TextAnswer,
} from "./QuestionInputs";
import { FindingsReveal } from "./FindingsReveal";
import { GeneratingBrief } from "./GeneratingBrief";
import { REPORT_FORK_VALUES } from "./questions";
import type { FlowStep } from "./questions";
import { ackForAnswer } from "./questionRules";
import type {
  Question,
  ReportUploadType,
  AttachmentCard,
  AttachmentKind,
  UploadCategory,
} from "./types";
import type { IntakeController } from "./useIntakeState";

const UPLOAD_GROUPS: Array<{
  value: ReportUploadType;
  title: string;
  category: UploadCategory;
}> = [
  {
    value: "reports",
    title: "Blood & urine tests",
    category: "blood",
  },
  {
    value: "genetic_reports",
    title: "Genetic tests",
    category: "dna",
  },
  {
    value: "wearable_only",
    title: "Other health data",
    category: "other",
  },
];

function reportForkSelectedIndices(selections: ReportUploadType[] = []) {
  return selections
    .map((value) => (REPORT_FORK_VALUES as readonly string[]).indexOf(value))
    .filter((index) => index >= 0);
}

function selectedUploadGroups(selections: ReportUploadType[] = []) {
  return UPLOAD_GROUPS.filter((group) => selections.includes(group.value));
}

const PREPARE_KIND_ICON: Record<AttachmentKind, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  sheet: TableIcon,
  doc: FileIcon,
};

function PrepareAttachmentTile({
  card,
  onRemove,
}: {
  card: AttachmentCard;
  onRemove?: (fileId: string) => void;
}) {
  const Icon = PREPARE_KIND_ICON[card.kind];
  return (
    <div className={`drb-attachment drb-attachment--prepare drb-attachment--${card.kind}`}>
      {onRemove && (
        <button
          type="button"
          className="drb-attachment-remove drb-attachment-remove--always"
          aria-label={`Remove ${card.fileName}`}
          onClick={() => onRemove(card.fileId)}
        >
          <X strokeWidth={1.9} aria-hidden="true" />
        </button>
      )}
      <div className="drb-attachment-thumb">
        <Icon strokeWidth={1.5} aria-hidden="true" />
        <span className="drb-attachment-ext">{card.ext}</span>
      </div>
      <div className="drb-attachment-meta">
        <p className="drb-attachment-name" title={card.fileName}>
          {card.fileName}
        </p>
        <p className="drb-attachment-sub">Ready for review</p>
      </div>
    </div>
  );
}

function WhyWeAsk({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="drb-why">
      <button
        type="button"
        className="drb-why-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle strokeWidth={1.7} aria-hidden="true" />
        Why we're asking
      </button>
      {open && <p className="drb-why-body">{text}</p>}
    </div>
  );
}

function QuestionBody({
  question,
  c,
}: {
  question: Question;
  c: IntakeController;
}) {
  switch (question.type) {
    case "single":
      return (
        <QuickReplyGroup
          options={question.options ?? []}
          selectedIndices={reportForkSelectedIndices(c.state.reportSelections)}
          onSelect={(index) => {
            c.setReportFork(index);
            if (REPORT_FORK_VALUES[index] === "no_reports") {
              window.setTimeout(() => c.next(), 0);
            }
          }}
        />
      );
    case "multi": {
      const field = question.id as "reason" | "goals" | "symptoms";
      const freeField = `${field}FreeText` as
        | "reasonFreeText"
        | "goalsFreeText"
        | "symptomsFreeText";
      return (
        <MultiSelectQuestion
          options={question.options ?? []}
          selected={c.state[field]}
          onToggle={(v) => c.toggleMulti(field, v)}
          freeText={c.state[freeField]}
          freeTextLabel={question.freeTextLabel}
          onFreeText={
            question.allowFreeText
              ? (v) => c.setFreeText(freeField, v)
              : undefined
          }
        />
      );
    }
    case "text":
      return (
        <TextAnswer
          value={c.state.contextAnswers[question.id] ?? ""}
          onChange={(v) => c.setContextAnswer(question.id, v)}
        />
      );
    case "dynamic": {
      const value = c.state.contextAnswers[question.id] ?? "";
      const dynamicQuestion = c.dynamicQuestionQueue.find(
        (candidate) => candidate.id === question.dynamicQuestionId,
      );
      return (
        <>
          <DynamicQuestionInput
            options={question.options ?? []}
            value={value}
            allowFreeText={question.allowFreeText}
            freeTextLabel={question.freeTextLabel}
            onChange={(v) => {
              c.setContextAnswer(question.id, v);
              if (question.dynamicQuestionId)
                c.setDynamicAnswer(
                  question.dynamicQuestionId,
                  question.prompt,
                  v,
                );
            }}
          />
          {dynamicQuestion && value.trim() && (
            <p className="drb-ack">
              {ackForAnswer(dynamicQuestion, value)}
            </p>
          )}
        </>
      );
    }
    case "snapshot":
      return (
        <LifestyleSnapshotInput
          value={c.state.lifestyle}
          onChange={c.patchLifestyle}
        />
      );
    case "supplements":
      return (
        <SupplementsForm
          value={c.state.supplementsAndMeds}
          onChange={c.patchSupplements}
        />
      );
    default:
      return null;
  }
}

function canContinue(step: FlowStep, c: IntakeController): boolean {
  if (step.kind !== "question") return true;
  const q = step.question;
  if (!q.required) return true;
  if (q.id === "reportFork")
    return (
      (c.state.reportSelections?.length ?? 0) > 0 ||
      c.state.hasReports === "no_reports"
    );
  if (q.id === "reason")
    return c.state.reason.length > 0 || !!c.state.reasonFreeText?.trim();
  if (q.type === "dynamic") return !!c.state.contextAnswers[q.id]?.trim();
  return true;
}

function StepHeader({
  eyebrow,
  title,
  helper,
}: {
  eyebrow?: string;
  title: string;
  helper?: string;
}) {
  return (
    <header className="drb-step-head">
      {eyebrow && <span className="drb-step-eyebrow">{eyebrow}</span>}
      <h3>{title}</h3>
      {helper && <p className="drb-step-helper">{helper}</p>}
    </header>
  );
}

export function QuestionPanel({ c }: { c: IntakeController }) {
  const step = c.currentStep;
  if (!step) return null;

  let content: ReactNode = null;

  if (step.kind === "question") {
    const q = step.question;
    content = (
      <>
        <StepHeader
          eyebrow={
            c.questionCounter
              ? `Question ${c.questionCounter.n} of ${c.questionCounter.of}`
              : undefined
          }
          title={q.prompt}
          helper={q.helper}
        />
        <QuestionBody question={q} c={c} />
        {q.whyWeAsk && <WhyWeAsk key={q.id} text={q.whyWeAsk} />}
      </>
    );
  } else if (step.kind === "upload") {
    const groups = selectedUploadGroups(c.state.reportSelections);
    content = (
      <>
        <StepHeader
          eyebrow="Your reports"
          title="Upload what you already have"
        />
        <div className="drb-upload-layout">
          {groups.map((group) => (
            <section key={group.value} className="drb-upload-group">
              <FileUpload
                onAdd={(files) => c.addFiles(files, group.category)}
                title={`Upload ${group.title.toLowerCase()}`}
                description="PDF, JPG, PNG, DOCX"
              />
            </section>
          ))}
          <section className="drb-upload-files" aria-label="Files uploaded">
            <h4>Files uploaded</h4>
            {c.attachments.length > 0 ? (
              <div className="drb-upload-file-grid">
                {c.attachments.map((card) => (
                  <PrepareAttachmentTile
                    key={card.fileId}
                    card={card}
                    onRemove={c.removeFile}
                  />
                ))}
              </div>
            ) : (
              <p>No files yet</p>
            )}
          </section>
        </div>
      </>
    );
  } else if (step.kind === "preparing") {
    const files = c.state.uploadedFiles;
    const insights = c.state.aiDocumentInsights ?? {};
    const isWorking = c.pipelineStatus === "running" || c.aiAnalyzing;
    const hasReviewFallback = Object.values(insights).some(
      (i) => i.status === "error" || i.status === "needs_review",
    );

    const feedDocs: FeedDoc[] = files.map((f) => {
      const ins = insights[f.id];
      return {
        fileId: f.id,
        name: f.name,
        status: ins?.status ?? "uploaded",
        detail:
          ins?.status === "done"
            ? ins.documentType
            : ins?.status === "needs_review"
              ? "Attached for doctor review"
              : ins?.status === "error"
                ? "Couldn't be read — re-add to analyze"
                : undefined,
      };
    });

    content = (
      <>
        <StepHeader
          eyebrow="Preparing your brief"
          title={
            isWorking
              ? "Building your doctor's brief…"
              : c.pipelineStatus === "error"
                ? "The brief needs another pass"
                : "Ready for your doctor"
          }
          helper={
            isWorking
              ? "Follow along — each step below is happening right now."
              : undefined
          }
        />
        {c.agentSteps.length > 0 ? (
          <AgentActivityFeed
            steps={c.agentSteps}
            docs={feedDocs}
            onRetry={c.retryExtraction}
          />
        ) : files.length > 0 ? (
          <div className="drb-prepare-attachments" aria-label="Uploaded attachments">
            {c.attachments.map((card) => (
              <PrepareAttachmentTile key={card.fileId} card={card} />
            ))}
          </div>
        ) : (
          <ul className="drb-prepare-cards">
            <li>
              <FileIcon strokeWidth={1.7} aria-hidden="true" />
              <span>
                No files uploaded — that's okay, we'll continue with your
                answers
              </span>
            </li>
          </ul>
        )}
        {!isWorking && hasReviewFallback && (
          <p className="drb-prepare-note">
            <TriangleAlert strokeWidth={1.7} aria-hidden="true" />
            Some documents need doctor review before details can be summarized.
          </p>
        )}
      </>
    );
  } else if (step.kind === "findings") {
    content = <FindingsReveal c={c} />;
  } else if (step.kind === "generating") {
    content = <GeneratingBrief c={c} />;
  }

  const isPreparingBrief =
    step.kind === "preparing" &&
    !!c.state.uploadsConfirmedAt &&
    (c.pipelineStatus === "running" ||
      c.aiAnalyzing);
  const isGenerating =
    step.kind === "generating" &&
    c.briefSynthesis?.status !== "ready" &&
    c.pipelineStatus !== "error";
  const proceed = canContinue(step, c) && !isPreparingBrief && !isGenerating;
  const showSkip = step.kind === "question" && !step.question.required;
  let continueLabel = "Continue";
  if (step.kind === "preparing" && isPreparingBrief) {
    continueLabel = c.aiAnalyzing ? "Reading…" : "Preparing…";
  } else if (step.kind === "preparing" && c.state.uploadsConfirmedAt) {
    continueLabel = "See what we found";
  } else if (step.kind === "findings") {
    continueLabel = "Continue";
  } else if (step.kind === "generating") {
    continueLabel =
      c.briefSynthesis?.status === "ready" ? "See my brief" : "Generating…";
  } else if (step.kind === "question" && step.question.id === "reportFork") {
    continueLabel = "Continue";
  } else if (c.isLastIntakeStep) {
    continueLabel = "See my brief";
  }

  return (
    <div
      className="drb-question"
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        const tag = target.tagName.toLowerCase();
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          (tag === "textarea" || tag === "input") &&
          proceed
        ) {
          event.preventDefault();
          c.next();
        }
      }}
    >
      <div key={step.key} className="drb-question-body drb-step-enter">
        {content}
      </div>
      <div className="drb-question-footer">
        {c.stepIndex > 0 ? (
          <button type="button" className="drb-back" onClick={c.back}>
            <ChevronLeft strokeWidth={2} aria-hidden="true" />
            Back
          </button>
        ) : (
          <span />
        )}
        <div className="drb-footer-right">
          {showSkip && (
            <button type="button" className="drb-skip" onClick={c.next}>
              Skip for now
            </button>
          )}
          <button
            type="button"
            className="drb-continue"
            disabled={!proceed}
            onClick={c.next}
          >
            {continueLabel}
            <ChevronRight strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
