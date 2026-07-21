import { FileText } from "lucide-react";
import profileBriefHeroImage from "../../../../assets/dashboard/profile-brief-hero.png";
import { OTHER_OPTION, REPORT_CATEGORY_LABELS, STEPS } from "./profileQuestions";
import type { ProfileAnswers, StepId } from "./profileQuestions";

type ProfileSummaryProps = {
  answers: ProfileAnswers;
  /** Omitted in read-only contexts (e.g. the doctor case view) — hides the
      per-row Edit buttons. */
  onEditStep?: (stepId: StepId) => void;
  /** The member-facing title header. Hidden when the brief is embedded under a
      page that already has its own heading (doctor case view). */
  showTitle?: boolean;
  /** The built-in "Previous reports" text row in "More details". The doctor
      view hides it and renders prominent, clickable attachment tiles instead. */
  showReports?: boolean;
};

function stepIndexOf(stepId: StepId) {
  return STEPS.findIndex((step) => step.id === stepId);
}

function sleepLabel(hours: number) {
  if (hours < 4) return "<4h";
  if (hours > 10) return ">10h";
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

function ageLabel(age: number) {
  return age > 80 ? ">80" : `${age}`;
}

function heightLabel(heightCm: number) {
  if (heightCm < 140) return "<140 cm";
  if (heightCm > 220) return ">220 cm";
  return `${heightCm} cm`;
}

function weightLabel(weightKg: number) {
  if (weightKg < 30) return "<30 kg";
  if (weightKg > 200) return ">200 kg";
  return `${weightKg} kg`;
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

function withOther(items: string[], other: string) {
  const namedItems = items.filter((item) => item !== OTHER_OPTION);
  return other.trim() ? [...namedItems, other.trim()] : namedItems;
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

// Answers can themselves contain "/" (e.g. "Focus / brain fog"), so joining
// with " / " reads ambiguously. Render each answer as its own tag instead.
function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="pf-brief-muted">Nothing selected</span>;
  return (
    <span className="pf-brief-tags">
      {items.map((item) => (
        <span className="pf-brief-tag" key={item}>
          {item}
        </span>
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
  onEditStep?: (stepId: StepId) => void;
}) {
  return (
    <div
      className={`pf-brief-detail-row ${topAlign ? "is-top-aligned" : ""} ${
        onEditStep ? "" : "is-readonly"
      }`}
    >
      <dt>{label}</dt>
      <dd>
        {icon}
        <span>{value}</span>
      </dd>
      {onEditStep && (
        <div>
          <button className="pf-brief-edit" type="button" onClick={() => onEditStep(stepId)}>
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

function ProfileSummary({
  answers,
  onEditStep,
  showTitle = true,
  showReports = true,
}: ProfileSummaryProps) {
  const { basics, lifestyle, habits } = answers;

  const reason = withOther(answers.reason, answers.reasonOther);
  const goals = withOther(answers.goals, answers.goalsOther);
  const symptoms = withOther(answers.symptoms, answers.symptomsOther);
  const family = withOther(answers.family, answers.familyOther);
  const supplements = [
    ...withOther(answers.supplements, answers.supplementsOther),
    ...(answers.prescriptionMedicationDetails.trim()
      ? [`Prescription medications and doses: ${answers.prescriptionMedicationDetails.trim()}`]
      : []),
  ];
  const allergies = withOther(answers.allergies, answers.allergiesOther);
  const mainConcern =
    reason[0] || "A doctor review of my goals, lifestyle, history and previous results.";
  const concernLabel = basics.preferredName.trim()
    ? `${basics.preferredName.trim()}'s main concern`
    : "Main concern";

  return (
    <article className="pf-brief" aria-label="Your health profile">
      {showTitle && (
        <header className="pf-brief-title">
          <span className="p-eyebrow">PROFILE</span>
          <h1>
            A <em>short brief</em> for your doctor
          </h1>
        </header>
      )}

      <section className="pf-brief-hero" aria-label="Main concern">
        <img className="pf-brief-hero-image" src={profileBriefHeroImage} alt="" aria-hidden="true" />
        <div className="pf-brief-concern">
          <p className="pf-brief-label">{concernLabel}</p>
          <h2>{mainConcern}</h2>
        </div>
        <div className="pf-brief-hero-stats" aria-label="Profile basics">
          <HeroPill value={ageLabel(basics.age)} />
          <HeroPill value={basics.sex.toLowerCase()} />
          <HeroPill value={heightLabel(basics.heightCm)} />
          <HeroPill value={weightLabel(basics.weightKg)} />
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
          <div className="pf-brief-facts pf-brief-health-facts">
            <BriefFact label="Alcohol" value={conciseHabit(habits.alcohol)} />
            <BriefFact label="Smoking and/or vaping" value={habits.smoking} />
          </div>
        </section>
      </div>

      <section className="pf-brief-details" aria-labelledby="profile-more-details">
        <h2 id="profile-more-details">More details</h2>
        <dl>
          <DetailRow
            stepId="reason"
            label="All Concerns"
            value={<ConcernList items={reason} />}
            topAlign={shouldTopAlignList(reason)}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="goals"
            label="Goals"
            value={<TagList items={goals} />}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="symptoms"
            label="What feels off"
            value={<TagList items={symptoms} />}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="family"
            label="Family history"
            value={<TagList items={family} />}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="supplements"
            label="Supplements & medications"
            value={<TagList items={supplements} />}
            onEditStep={onEditStep}
          />
          <DetailRow
            stepId="allergies"
            label="Allergies to medication"
            value={<TagList items={allergies} />}
            onEditStep={onEditStep}
          />
          {showReports && (
            <DetailRow
              stepId="reports"
              label="Previous reports"
              value={reportSummary(answers)}
              icon={<FileText aria-hidden="true" />}
              onEditStep={onEditStep}
            />
          )}
        </dl>
      </section>
    </article>
  );
}

export { stepIndexOf };
export default ProfileSummary;
