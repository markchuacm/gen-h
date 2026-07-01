// ─── Doctor Review Brief · question panel ─────────────────────────────────────
// Renders one focused step at a time — a question, the upload step, the calm
// "preparing" moment, or the no-report reassurance — with Back / Skip / Continue.

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, FolderCheck, HelpCircle, Loader2, Sparkles, TriangleAlert } from "lucide-react";
import {
  FileUpload,
  LifestyleSnapshotInput,
  MultiSelectQuestion,
  QuickReplyGroup,
  SupplementsForm,
  TextAnswer,
} from "./QuestionInputs";
import { REPORT_FORK_VALUES } from "./questions";
import type { FlowStep } from "./questions";
import type { IntakeController } from "./useIntakeState";
import type { Question } from "./types";

function WhyWeAsk({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="drb-why">
      <button type="button" className="drb-why-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <HelpCircle strokeWidth={1.7} aria-hidden="true" />
        Why we're asking
      </button>
      {open && <p className="drb-why-body">{text}</p>}
    </div>
  );
}

function QuestionBody({ question, c }: { question: Question; c: IntakeController }) {
  switch (question.type) {
    case "single":
      return (
        <QuickReplyGroup
          options={question.options ?? []}
          selectedIndex={c.state.hasReports ? REPORT_FORK_VALUES.indexOf(c.state.hasReports) : undefined}
          onSelect={c.setReportFork}
        />
      );
    case "multi": {
      const field = question.id as "reason" | "goals" | "symptoms";
      const freeField = `${field}FreeText` as "reasonFreeText" | "goalsFreeText" | "symptomsFreeText";
      return (
        <MultiSelectQuestion
          options={question.options ?? []}
          selected={c.state[field]}
          onToggle={(v) => c.toggleMulti(field, v)}
          freeText={c.state[freeField]}
          freeTextLabel={question.freeTextLabel}
          onFreeText={question.allowFreeText ? (v) => c.setFreeText(freeField, v) : undefined}
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
    case "snapshot":
      return <LifestyleSnapshotInput value={c.state.lifestyle} onChange={c.patchLifestyle} />;
    case "supplements":
      return <SupplementsForm value={c.state.supplementsAndMeds} onChange={c.patchSupplements} />;
    default:
      return null;
  }
}

function canContinue(step: FlowStep, c: IntakeController): boolean {
  if (step.kind !== "question") return true;
  const q = step.question;
  if (!q.required) return true;
  if (q.id === "reportFork") return !!c.state.hasReports;
  if (q.id === "reason") return c.state.reason.length > 0 || !!c.state.reasonFreeText?.trim();
  return true;
}

function StepHeader({ eyebrow, title, helper }: { eyebrow?: string; title: string; helper?: string }) {
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
        <StepHeader title={q.prompt} helper={q.helper} />
        <QuestionBody question={q} c={c} />
        {q.whyWeAsk && <WhyWeAsk key={q.id} text={q.whyWeAsk} />}
      </>
    );
  } else if (step.kind === "upload") {
    content = (
      <>
        <StepHeader
          eyebrow="Your reports"
          title="Upload what you already have"
          helper="You don't need to know what matters. We'll organise it for your doctor."
        />
        <FileUpload
          files={c.state.uploadedFiles}
          insights={c.state.aiDocumentInsights}
          onAdd={c.addFiles}
          onRemove={c.removeFile}
        />
      </>
    );
  } else if (step.kind === "preparing") {
    const files = c.state.uploadedFiles;
    const insights = c.state.aiDocumentInsights ?? {};
    content = (
      <>
        <StepHeader
          eyebrow="Preparing your brief"
          title={c.aiAnalyzing ? "Reviewing your documents…" : "Ready for your doctor"}
          helper={c.aiAnalyzing ? "We're reading the document structure so we can ask you the right questions." : undefined}
        />
        {files.length > 0 ? (
          <ul className="drb-prepare-cards">
            {files.map((f) => {
	              const ins = insights[f.id];
	              const isAnalyzing = ins?.status === "analyzing";
	              const isDone = ins?.status === "done";
	              const needsReview = ins?.status === "needs_review" || ins?.status === "error";
	              return (
	                <li key={f.id} className={`drb-prepare-file ${isAnalyzing ? "is-analyzing" : ""}`}>
	                  {isAnalyzing ? (
	                    <Loader2 strokeWidth={1.7} aria-hidden="true" className="drb-spin" />
	                  ) : isDone ? (
                    <Sparkles strokeWidth={1.7} aria-hidden="true" />
                  ) : (
                    <FolderCheck strokeWidth={1.7} aria-hidden="true" />
                  )}
                  <div className="drb-prepare-file-info">
                    <strong>{f.name}</strong>
                    <span>
	                      {isAnalyzing
	                        ? "Reviewing document structure…"
	                        : isDone
	                          ? `${ins.documentType} · added to brief`
	                          : needsReview
	                            ? "Needs doctor review"
	                            : "Uploaded for doctor review"}
	                    </span>
	                  </div>
	                </li>
	              );
            })}
          </ul>
        ) : (
          <ul className="drb-prepare-cards">
            <li>
              <FolderCheck strokeWidth={1.7} aria-hidden="true" />
              <span>No files uploaded — that's okay, we'll continue with your answers</span>
            </li>
          </ul>
        )}
	        {!c.aiAnalyzing && Object.values(insights).some((i) => i.status === "error" || i.status === "needs_review") && (
	          <p className="drb-prepare-note">
	            <TriangleAlert strokeWidth={1.7} aria-hidden="true" />
	            Some documents need doctor review before details can be summarized.
	          </p>
	        )}
      </>
    );
  } else if (step.kind === "reassurance") {
    content = (
      <>
        <StepHeader eyebrow="No reports? No problem" title="We'll prepare your review from what you know" />
        <p className="drb-prose">
          Your doctor helps decide what baseline is worth building. We'll prepare your review from your goals, symptoms,
          lifestyle and history — then your doctor can advise what testing is actually worth doing.
        </p>
      </>
    );
  }

  const proceed = canContinue(step, c) && !(step.kind === "preparing" && c.aiAnalyzing);
  const showSkip = step.kind === "question" && !step.question.required;
  const continueLabel =
    step.kind === "preparing" && c.aiAnalyzing
      ? "Reviewing…"
      : c.isLastIntakeStep
        ? "See my brief"
        : "Continue";

  return (
    <div className="drb-question">
      <div className="drb-question-body">{content}</div>
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
          <button type="button" className="drb-continue" disabled={!proceed} onClick={c.next}>
            {continueLabel}
            <ChevronRight strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
