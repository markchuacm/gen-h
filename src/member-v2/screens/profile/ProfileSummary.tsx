import { File as FileIcon, FileText, Image as ImageIcon, Paperclip, Table as TableIcon } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import farheenAvatarImage from "../../../../assets/dashboard/doctors/farheen-nafisa-avatar.png";
import { REPORT_CATEGORY_LABELS, STEPS } from "./profileQuestions";
import type { ProfileAnswers, StepId, UploadedReport, UploadedReportKind } from "./profileQuestions";

type ProfileSummaryProps = {
  answers: ProfileAnswers;
  completedAt: string | null;
  onEditStep: (stepId: StepId) => void;
};

function stepIndexOf(stepId: StepId) {
  return STEPS.findIndex((step) => step.id === stepId);
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

function ChipList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="pf-brief-sentence">Nothing selected.</p>;
  return (
    <div className="pf-brief-chips">
      {items.map((item) => (
        <span key={item} className="p-chip p-chip--neutral">
          {item}
        </span>
      ))}
    </div>
  );
}

const REPORT_FILE_ICONS: Record<UploadedReportKind, LucideIcon> = {
  pdf: FileText,
  image: ImageIcon,
  sheet: TableIcon,
  doc: FileIcon,
  other: Paperclip,
};

function ReportFileTile({ report }: { report: UploadedReport }) {
  const Icon = REPORT_FILE_ICONS[report.kind];
  const ext = report.name.includes(".") ? report.name.split(".").pop()?.toUpperCase() : report.kind;

  return (
    <article className={`pf-report-file pf-report-file--summary pf-report-file--${report.kind}`}>
      <div className="pf-report-file-thumb" aria-hidden="true">
        <Icon strokeWidth={1.6} />
        <span>{ext}</span>
      </div>
      <div className="pf-report-file-meta">
        <strong title={report.name}>{report.name}</strong>
        <span>{REPORT_CATEGORY_LABELS[report.category]}</span>
      </div>
    </article>
  );
}

function ReportSummary({ answers }: { answers: ProfileAnswers }) {
  if (answers.uploadedReports.length > 0) {
    return (
      <div className="pf-report-file-grid pf-report-file-grid--summary">
        {answers.uploadedReports.map((report) => (
          <ReportFileTile key={report.id} report={report} />
        ))}
      </div>
    );
  }

  if (answers.reportSelections.includes("no_tests")) {
    return <p className="pf-brief-sentence">No previous tests shared.</p>;
  }

  const selectedLabels = answers.reportSelections
    .filter((selection): selection is keyof typeof REPORT_CATEGORY_LABELS => selection !== "no_tests")
    .map((selection) => REPORT_CATEGORY_LABELS[selection]);

  if (selectedLabels.length > 0) {
    return (
      <>
        <ChipList items={selectedLabels} />
        <p className="pf-brief-sentence pf-brief-muted">No files uploaded yet.</p>
      </>
    );
  }

  return <p className="pf-brief-sentence">No previous tests shared.</p>;
}

function Section({
  stepId,
  title,
  onEditStep,
  children,
}: {
  stepId: StepId;
  title: string;
  onEditStep: (stepId: StepId) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="pf-brief-section">
      <div className="pf-brief-section-head">
        <h3>{title}</h3>
        <button className="pf-brief-edit" type="button" onClick={() => onEditStep(stepId)}>
          Edit
        </button>
      </div>
      {children}
    </section>
  );
}

function ProfileSummary({ answers, completedAt, onEditStep }: ProfileSummaryProps) {
  const { basics, lifestyle, habits } = answers;

  const aboutSentence = `Mark, ${basics.age} — ${basics.sex.toLowerCase()}, ${basics.heightCm} cm, ${basics.weightKg} kg.`;

  const lifestyleSentence = `Sleeps around ${lifestyle.sleepHours} hours on weekdays, exercises ${
    lifestyle.exerciseDays === "0" ? "rarely" : `${lifestyle.exerciseDays} days a week`
  }, meals are ${lifestyle.diet.toLowerCase()}, and stress lately sits at ${lifestyle.stress} out of 5.`;

  const habitsSentence = `Alcohol: ${habits.alcohol.toLowerCase()} · Smoking: ${habits.smoking.toLowerCase()}.`;

  const supplements = answers.supplementsOther.trim()
    ? [...answers.supplements, answers.supplementsOther.trim()]
    : answers.supplements;

  return (
    <article className="p-card pf-brief" aria-label="What your doctor will see">
      <header className="pf-brief-head">
        <img src={farheenAvatarImage} alt="" />
        <div>
          <strong>Prepared for your doctor</strong>
          <p>Reviewed before your consult — you can edit any section until then.</p>
        </div>
        {completedAt && <span className="pf-brief-date">{formatDate(completedAt)}</span>}
      </header>
      <div className="pf-brief-body">
        <Section stepId="reports" title="Previous reports" onEditStep={onEditStep}>
          <ReportSummary answers={answers} />
        </Section>
        <Section stepId="basics" title="About you" onEditStep={onEditStep}>
          <p className="pf-brief-sentence">{aboutSentence}</p>
        </Section>
        <Section stepId="reason" title="Why I'm here" onEditStep={onEditStep}>
          <ChipList items={answers.reason} />
        </Section>
        <Section stepId="goals" title="Main goals" onEditStep={onEditStep}>
          <ChipList items={answers.goals} />
        </Section>
        <Section stepId="symptoms" title="What feels off" onEditStep={onEditStep}>
          <ChipList items={answers.symptoms} />
        </Section>
        <Section stepId="lifestyle" title="Lifestyle" onEditStep={onEditStep}>
          <p className="pf-brief-sentence">{lifestyleSentence}</p>
        </Section>
        <Section stepId="habits" title="Habits" onEditStep={onEditStep}>
          <p className="pf-brief-sentence">{habitsSentence}</p>
        </Section>
        <Section stepId="family" title="Family history" onEditStep={onEditStep}>
          <ChipList items={answers.family} />
        </Section>
        <Section stepId="supplements" title="Supplements & medications" onEditStep={onEditStep}>
          <ChipList items={supplements} />
        </Section>
      </div>
      <footer className="pf-brief-foot">
        Dr. Farheen Nafisa reviews this brief before your consult, alongside any reports you share.
      </footer>
    </article>
  );
}

export { stepIndexOf };
export default ProfileSummary;
