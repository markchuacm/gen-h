import { FileText } from "lucide-react";
import profileBriefHeroImage from "../../../../assets/dashboard/profile-brief-hero.png";
import { REPORT_CATEGORY_LABELS, STEPS } from "./profileQuestions";
import type { ProfileAnswers, StepId } from "./profileQuestions";

type ProfileSummaryProps = {
  answers: ProfileAnswers;
  onEditStep: (stepId: StepId) => void;
};

function stepIndexOf(stepId: StepId) {
  return STEPS.findIndex((step) => step.id === stepId);
}

function sleepLabel(hours: number) {
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function exerciseLabel(days: string) {
  if (days === "0") return "Rarely";
  return `${days} / week`;
}

function conciseHabit(value: string) {
  return value.split(" / ")[0];
}

function listSummary(items: string[], empty = "Nothing selected") {
  return items.length > 0 ? items.join(" / ") : empty;
}

function reportSummary(answers: ProfileAnswers) {
  const count = answers.uploadedReports.length;
  if (count > 0) return `${count} report${count === 1 ? "" : "s"} uploaded`;
  if (answers.reportSelections.includes("no_tests")) return "No previous tests shared";

  const selectedLabels = answers.reportSelections
    .filter((selection): selection is keyof typeof REPORT_CATEGORY_LABELS => selection !== "no_tests")
    .map((selection) => REPORT_CATEGORY_LABELS[selection]);

  if (selectedLabels.length > 0) return `${selectedLabels.join(" / ")} selected; no files uploaded`;
  return "None uploaded";
}

function contextReportSummary(answers: ProfileAnswers) {
  if (answers.uploadedReports.length > 0) return reportSummary(answers);
  if (answers.reportSelections.includes("no_tests")) return "None shared";
  return "None uploaded";
}

function BriefFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="pf-brief-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function HeroPill({ value }: { value: string }) {
  return <span className="pf-brief-hero-pill">{value}</span>;
}

function ConcernList({ items }: { items: string[] }) {
  if (items.length === 0) return <span>Nothing selected</span>;
  return (
    <span className="pf-brief-concern-list">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </span>
  );
}

function shouldTopAlignList(items: string[]) {
  return items.length > 1 || listSummary(items).length > 72;
}

function DetailRow({
  stepId,
  label,
  value,
  icon,
  topAlign = false,
  onEditStep,
}: {
  stepId: StepId;
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  topAlign?: boolean;
  onEditStep: (stepId: StepId) => void;
}) {
  return (
    <div className={`pf-brief-detail-row ${topAlign ? "is-top-aligned" : ""}`}>
      <dt>{label}</dt>
      <dd>
        {icon}
        <span>{value}</span>
      </dd>
      <div>
        <button className="pf-brief-edit" type="button" onClick={() => onEditStep(stepId)}>
          Edit
        </button>
      </div>
    </div>
  );
}

function ProfileSummary({ answers, onEditStep }: ProfileSummaryProps) {
  const { basics, lifestyle, habits } = answers;

  const supplements = answers.supplementsOther.trim()
    ? [...answers.supplements, answers.supplementsOther.trim()]
    : answers.supplements;
  const mainConcern =
    answers.reason[0] || "A doctor review of my goals, lifestyle, history and previous results.";
  const concernLabel = basics.preferredName.trim()
    ? `${basics.preferredName.trim()}'s main concern`
    : "Main concern";

  return (
    <article className="pf-brief" aria-label="Your health profile">
      <header className="pf-brief-title">
        <span className="p-eyebrow">PROFILE</span>
        <h1>
          A <em>short brief</em> for your doctor
        </h1>
      </header>

      <section className="pf-brief-hero" aria-label="Main concern">
        <img className="pf-brief-hero-image" src={profileBriefHeroImage} alt="" aria-hidden="true" />
        <div className="pf-brief-concern">
          <p className="pf-brief-label">{concernLabel}</p>
          <h2>{mainConcern}</h2>
        </div>
        <div className="pf-brief-hero-stats" aria-label="Profile basics">
          <HeroPill value={`${basics.age}`} />
          <HeroPill value={basics.sex.toLowerCase()} />
          <HeroPill value={`${basics.heightCm} cm`} />
          <HeroPill value={`${basics.weightKg} kg`} />
        </div>
      </section>

      <div className="pf-brief-context-grid">
        <section className="pf-brief-panel" aria-labelledby="profile-lifestyle">
          <h2 id="profile-lifestyle">Lifestyle</h2>
          <div className="pf-brief-facts">
            <BriefFact label="Sleep" value={sleepLabel(lifestyle.sleepHours)} />
            <BriefFact label="Exercise" value={exerciseLabel(lifestyle.exerciseDays)} />
            <BriefFact label="Stress" value={`${lifestyle.stress} / 5`} />
            <BriefFact label="Meals" value={lifestyle.diet.replace("Mostly ", "")} />
          </div>
        </section>

        <section className="pf-brief-panel" aria-labelledby="profile-health-context">
          <h2 id="profile-health-context">Health context</h2>
          <div className="pf-brief-facts">
            <BriefFact label="Alcohol" value={conciseHabit(habits.alcohol)} />
            <BriefFact label="Smoking" value={habits.smoking} />
            <BriefFact label="Reports" value={contextReportSummary(answers)} />
          </div>
        </section>
      </div>

      <section className="pf-brief-details" aria-labelledby="profile-more-details">
        <h2 id="profile-more-details">More details</h2>
        <dl>
          <DetailRow
            stepId="reason"
            label="All Concerns"
            value={<ConcernList items={answers.reason} />}
            topAlign={shouldTopAlignList(answers.reason)}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="goals"
            label="Goals"
            value={listSummary(answers.goals)}
            topAlign={shouldTopAlignList(answers.goals)}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="symptoms"
            label="What feels off"
            value={listSummary(answers.symptoms)}
            topAlign={shouldTopAlignList(answers.symptoms)}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="family"
            label="Family history"
            value={listSummary(answers.family)}
            topAlign={shouldTopAlignList(answers.family)}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="supplements"
            label="Supplements & medications"
            value={listSummary(supplements)}
            topAlign={shouldTopAlignList(supplements)}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="reports"
            label="Previous reports"
            value={reportSummary(answers)}
            icon={<FileText aria-hidden="true" />}
            onEditStep={onEditStep}
          />
        </dl>
      </section>
    </article>
  );
}

export { stepIndexOf };
export default ProfileSummary;
