// ─── Doctor Review Brief · question panel ─────────────────────────────────────
// Renders one focused step at a time — a question, the upload step, or the calm
// "preparing" moment — with Back / Skip / Continue.

import { useState } from "react";
import type { ReactNode } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FolderCheck,
  HelpCircle,
  Loader2,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  DynamicQuestionInput,
  FileUpload,
  LifestyleSnapshotInput,
  MultiSelectQuestion,
  QuickReplyGroup,
  SupplementsForm,
  TextAnswer,
} from "./QuestionInputs";
import { REPORT_FORK_VALUES } from "./questions";
import type { FlowStep } from "./questions";
import type {
  Question,
  ReportUploadType,
  UploadCategory,
  UploadedFile,
} from "./types";
import type { IntakeController } from "./useIntakeState";

const UPLOAD_GROUPS: Array<{
  value: ReportUploadType;
  title: string;
  helper: string;
  category: UploadCategory;
}> = [
  {
    value: "reports",
    title: "Blood & urine tests",
    helper: "Upload lab reports, screening PDFs, or blood/urine result files.",
    category: "blood",
  },
  {
    value: "genetic_reports",
    title: "Genetic tests",
    helper: "Upload DNA, genomics, or genetic risk reports.",
    category: "dna",
  },
  {
    value: "wearable_only",
    title: "Other health data",
    helper:
      "Upload wearable exports, fitness data, body composition, or other health files.",
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

function filesForGroup(
  files: UploadedFile[],
  group: (typeof UPLOAD_GROUPS)[number],
) {
  return files.filter((file) => {
    if (group.value === "reports") {
      return (
        file.detectedCategory === "blood" ||
        file.detectedCategory === "urine" ||
        file.detectedCategory === "screening"
      );
    }
    if (group.value === "genetic_reports")
      return file.detectedCategory === "dna";
    return (
      file.detectedCategory !== "blood" &&
      file.detectedCategory !== "urine" &&
      file.detectedCategory !== "screening" &&
      file.detectedCategory !== "dna"
    );
  });
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
      return (
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
        <StepHeader title={q.prompt} helper={q.helper} />
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
          helper="You don't need to know what matters. We'll organise it for your doctor."
        />
        <div className="drb-upload-groups">
          {groups.map((group) => (
            <section key={group.value} className="drb-upload-group">
              <header className="drb-upload-group-head">
                <h4>{group.title}</h4>
                <p>{group.helper}</p>
              </header>
              <FileUpload
                files={filesForGroup(c.state.uploadedFiles, group)}
                onAdd={(files) => c.addFiles(files, group.category)}
                title={`Upload ${group.title.toLowerCase()}`}
                description={group.helper}
              />
            </section>
          ))}
        </div>
      </>
    );
  } else if (step.kind === "preparing") {
    const files = c.state.uploadedFiles;
    const insights = c.state.aiDocumentInsights ?? {};
    const hasStartedPreparing = !!c.state.uploadsConfirmedAt;
    const hasReviewFallback = Object.values(insights).some(
      (i) => i.status === "error" || i.status === "needs_review",
    );

    content = (
      <>
        <StepHeader
          eyebrow="Preparing your brief"
          title={
            !hasStartedPreparing && files.length > 0
              ? "Ready to prepare your brief"
              : c.aiAnalyzing
                ? "Reviewing your documents…"
                : c.state.synthesisStatus === "synthesizing"
                  ? "Connecting the dots…"
                  : "Ready for your doctor"
          }
          helper={
            !hasStartedPreparing && files.length > 0
              ? "We'll only review your uploaded files after you continue."
              : c.aiAnalyzing
                ? "We're reading the document structure so we can ask you the right questions."
                : c.state.synthesisStatus === "synthesizing"
                  ? "We're turning the extracted report facts into doctor-prep themes."
                  : undefined
          }
        />
        {files.length > 0 ? (
          <ul className="drb-prepare-cards">
            {files.map((f) => {
              const ins = insights[f.id];
              const isAnalyzing = ins?.status === "analyzing";
              const isDone = ins?.status === "done";
              const needsReview =
                ins?.status === "needs_review" || ins?.status === "error";
              return (
                <li
                  key={f.id}
                  className={`drb-prepare-file ${isAnalyzing ? "is-analyzing" : ""}`}
                >
                  {isAnalyzing ? (
                    <Loader2
                      strokeWidth={1.7}
                      aria-hidden="true"
                      className="drb-spin"
                    />
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
                            : hasStartedPreparing
                              ? "Uploaded for doctor review"
                              : "Ready for review"}
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
              <span>
                No files uploaded — that's okay, we'll continue with your
                answers
              </span>
            </li>
          </ul>
        )}
        {!c.aiAnalyzing && hasReviewFallback && (
          <p className="drb-prepare-note">
            <TriangleAlert strokeWidth={1.7} aria-hidden="true" />
            Some documents need doctor review before details can be summarized.
          </p>
        )}
        {!c.aiAnalyzing &&
          hasStartedPreparing &&
          c.briefSynthesis?.status === "ready" &&
          c.briefSynthesis.progress && (
            <p className="drb-prepare-note drb-prepare-note--ready">
              <Sparkles strokeWidth={1.7} aria-hidden="true" />
              {[
                `${c.briefSynthesis.progress.themesPrepared} themes prepared`,
                `${c.briefSynthesis.progress.markersRead} markers read`,
                `${c.briefSynthesis.progress.questionsQueued} context questions queued`,
              ].join(" · ")}
            </p>
          )}
      </>
    );
  }

  const isPreparingBrief =
    step.kind === "preparing" &&
    !!c.state.uploadsConfirmedAt &&
    (c.aiAnalyzing || c.state.synthesisStatus === "synthesizing");
  const proceed = canContinue(step, c) && !isPreparingBrief;
  const showSkip = step.kind === "question" && !step.question.required;
  const continueLabel =
    step.kind === "preparing" && isPreparingBrief
      ? c.aiAnalyzing
        ? "Reviewing…"
        : "Preparing…"
      : step.kind === "question" && step.question.id === "reportFork"
        ? "Continue"
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
