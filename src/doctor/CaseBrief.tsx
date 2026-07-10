import { AlertTriangle } from "lucide-react";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import CaseAttachments from "./CaseAttachments";
import { CLEAR_ANSWERS, deriveRedFlags, toAnswers } from "./caseSignals";

// The doctor's read of the case, ordered for triage: what needs attention
// first, then the member's own words, then supporting detail. Deliberately not
// the member-facing ProfileSummary — that screen reassures the patient; this
// one prioritises for the clinician.
function CaseBrief({ detail }: { detail: DoctorCaseDetail }) {
  const hasProfile = Object.keys(detail.onboarding).length > 0;
  if (!hasProfile) {
    return (
      <>
        <p className="doc-muted">No onboarding responses yet.</p>
        <CaseAttachments documents={detail.documents} />
      </>
    );
  }

  const answers = toAnswers(detail.onboarding);
  const flags = deriveRedFlags(answers);

  const vitals: Array<[string, string]> = [];
  if (detail.age) vitals.push(["Age", `${detail.age}`]);
  if (detail.sex) vitals.push(["Sex", detail.sex]);
  if (answers.basics.heightCm) vitals.push(["Height", `${answers.basics.heightCm} cm`]);
  if (answers.basics.weightKg) vitals.push(["Weight", `${answers.basics.weightKg} kg`]);

  const lifestyleFacts: Array<[string, string]> = [
    ["Sleep", `~${answers.lifestyle.sleepHours}h per night`],
    ["Exercise", `${answers.lifestyle.exerciseDays} days per week`],
    ["Diet", answers.lifestyle.diet],
    ["Stress", `${answers.lifestyle.stress} out of 5`],
    ["Alcohol", answers.habits.alcohol],
    ["Smoking", answers.habits.smoking],
  ];

  const supplements = answers.supplements.filter((item) => !CLEAR_ANSWERS.has(item));

  return (
    <>
      <section className="doc-card" aria-label="At a glance">
        {vitals.length > 0 && (
          <div className="doc-facts">
            {vitals.map(([label, value]) => (
              <div className="doc-fact" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        )}
        {flags.length > 0 ? (
          <div className="doc-tag-group">
            <span className="doc-label">Flags from intake</span>
            <ul className="doc-chips">
              {flags.map((flag) => (
                <li key={flag} className="is-flag">
                  <AlertTriangle strokeWidth={1.9} aria-hidden="true" />
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="doc-tag-group">
            <span className="doc-label">Flags from intake</span>
            <p className="doc-muted">Nothing flagged from intake.</p>
          </div>
        )}
        {answers.reason.length > 0 && (
          <div className="doc-reason doc-tag-group">
            <span className="doc-label">Why they're here</span>
            <ul>
              {answers.reason.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <CaseAttachments documents={detail.documents} />

      <section className="doc-card" aria-label="Goals and symptoms">
        <TagGroup label="Main goals" items={answers.goals} />
        <TagGroup label="What feels off" items={answers.symptoms} />
        <TagGroup label="Family history" items={answers.family} flagRisks />
      </section>

      <section className="doc-card" aria-label="Lifestyle and habits">
        <span className="doc-label">Lifestyle &amp; habits</span>
        <dl className="doc-answers">
          {lifestyleFacts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="doc-card" aria-label="Supplements and medications">
        <span className="doc-label">Supplements &amp; medications</span>
        {supplements.length === 0 && !answers.supplementsOther ? (
          <p className="doc-muted">Nothing at the moment.</p>
        ) : (
          <>
            {supplements.length > 0 && (
              <ul className="doc-chips">
                {supplements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {answers.supplementsOther && (
              <dl className="doc-answers">
                <div>
                  <dt>Details</dt>
                  <dd>{answers.supplementsOther}</dd>
                </div>
              </dl>
            )}
          </>
        )}
      </section>
    </>
  );
}

function TagGroup({
  label,
  items,
  flagRisks = false,
}: {
  label: string;
  items: string[];
  flagRisks?: boolean;
}) {
  if (items.length === 0) return null;
  return (
    <div className="doc-tag-group">
      <span className="doc-label">{label}</span>
      <ul className="doc-chips">
        {items.map((item) => (
          <li key={item} className={flagRisks && !CLEAR_ANSWERS.has(item) ? "is-flag" : ""}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CaseBrief;
