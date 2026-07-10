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

  const vitals = [
    detail.age ? `${detail.age} years` : null,
    detail.sex,
    answers.basics.heightCm ? `${answers.basics.heightCm} cm` : null,
    answers.basics.weightKg ? `${answers.basics.weightKg} kg` : null,
  ].filter(Boolean);

  const lifestyleFacts: Array<[string, string]> = [
    ["Sleep", `~${answers.lifestyle.sleepHours}h per night`],
    ["Exercise", `${answers.lifestyle.exerciseDays} days per week`],
    ["Diet", answers.lifestyle.diet],
    ["Stress", `${answers.lifestyle.stress}/5`],
    ["Alcohol", answers.habits.alcohol],
    ["Smoking", answers.habits.smoking],
  ];

  const supplements = answers.supplements.filter((item) => !CLEAR_ANSWERS.has(item));

  return (
    <>
      <section className="doc-card" aria-labelledby="brief-glance">
        <h2 id="brief-glance">At a glance</h2>
        {vitals.length > 0 && <p className="doc-vitals">{vitals.join(" · ")}</p>}
        {flags.length > 0 ? (
          <ul className="doc-chips" aria-label="Flags from intake">
            {flags.map((flag) => (
              <li key={flag} className="is-flag">
                <AlertTriangle strokeWidth={1.9} aria-hidden="true" />
                {flag}
              </li>
            ))}
          </ul>
        ) : (
          <p className="doc-muted">No flags from intake.</p>
        )}
        {answers.reason.length > 0 && (
          <div className="doc-reason">
            <h3>Why they're here</h3>
            <ul>
              {answers.reason.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <CaseAttachments documents={detail.documents} />

      <section className="doc-card" aria-labelledby="brief-concerns">
        <h2 id="brief-concerns">Goals &amp; symptoms</h2>
        <TagGroup label="Main goals" items={answers.goals} />
        <TagGroup label="What feels off" items={answers.symptoms} />
        <TagGroup label="Family history" items={answers.family} flagRisks />
      </section>

      <section className="doc-card" aria-labelledby="brief-lifestyle">
        <h2 id="brief-lifestyle">Lifestyle &amp; habits</h2>
        <dl className="doc-answers">
          {lifestyleFacts.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="doc-card" aria-labelledby="brief-supplements">
        <h2 id="brief-supplements">Supplements &amp; medications</h2>
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
      <h3>{label}</h3>
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
