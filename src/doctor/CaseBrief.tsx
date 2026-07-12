import type { DoctorCaseDetail } from "../lib/api/doctor";
import CaseAttachments from "./CaseAttachments";
import { CLEAR_ANSWERS, lifestyleConcerns, toAnswers } from "./caseSignals";

// The doctor's read of the case, laid out as a single snapshot: who this is
// and why they're here up top, then history/goals beside lifestyle detail in
// two columns. Risk is flagged where the fact lives (red chips in family
// history, red values in lifestyle) rather than repeated in its own block.
// Deliberately not the member-facing ProfileSummary — that screen reassures
// the patient; this one prioritises for the clinician.
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
  const concerns = lifestyleConcerns(answers);

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
  const hasHistory = answers.goals.length + answers.symptoms.length + answers.family.length > 0;

  return (
    <>
      <section className="doc-card doc-hero" aria-label="At a glance">
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
        {answers.reason.length > 0 && (
          <blockquote className="doc-reason" aria-label="Why they're here">
            {answers.reason.map((item) => (
              <p key={item}>{item}</p>
            ))}
          </blockquote>
        )}
      </section>

      <div className="doc-brief-grid">
        <div className="doc-brief-col">
          {hasHistory && (
            <section className="doc-card" aria-label="Goals and symptoms">
              <h2 className="doc-card-title">Goals &amp; symptoms</h2>
              <TagGroup label="Main goals" items={answers.goals} />
              <TagGroup label="What feels off" items={answers.symptoms} />
            </section>
          )}

          {answers.family.length > 0 && (
            <section className="doc-card" aria-label="Family history">
              <h2 className="doc-card-title">Family history</h2>
              <ul className="doc-chips">
                {answers.family.map((item) => (
                  <li key={item} className={CLEAR_ANSWERS.has(item) ? "" : "is-flag"}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="doc-card" aria-label="Supplements and medications">
            <h2 className="doc-card-title">Supplements &amp; medications</h2>
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
                  <p className="doc-supplement-note">{answers.supplementsOther}</p>
                )}
              </>
            )}
          </section>
        </div>

        <div className="doc-brief-col">
          <section className="doc-card" aria-label="Lifestyle and habits">
            <h2 className="doc-card-title">Lifestyle &amp; habits</h2>
            <dl className="doc-answers">
              {lifestyleFacts.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd className={concerns.has(label) ? "is-concern" : ""}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <CaseAttachments documents={detail.documents} />
        </div>
      </div>
    </>
  );
}

function TagGroup({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="doc-tag-group">
      <span className="doc-group-label">{label}</span>
      <ul className="doc-chips">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default CaseBrief;
