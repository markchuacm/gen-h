import type { DoctorCaseDetail } from "../lib/api/doctor";
import CaseAttachments from "./CaseAttachments";
import { bmiLabel, OTHER_OPTION } from "../member-v2/screens/profile/profileQuestions";
import { CLEAR_ANSWERS, lifestyleConcerns, toAnswers } from "./caseSignals";

function withOther(items: string[], other: string) {
  const namedItems = items.filter((item) => item !== OTHER_OPTION);
  return other.trim() ? [...namedItems, other.trim()] : namedItems;
}

function boundaryValue(value: number, low: number, high: number, unit = "") {
  if (value < low) return `<${low}${unit}`;
  if (value > high) return `>${high}${unit}`;
  return `${value}${unit}`;
}

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
  const bmi = bmiLabel(answers.basics.heightCm, answers.basics.weightKg);

  const vitals: Array<[string, string]> = [];
  if (detail.age) vitals.push(["Age", boundaryValue(detail.age, 18, 80)]);
  if (detail.sex) vitals.push(["Sex", detail.sex]);
  if (answers.basics.heightCm) vitals.push(["Height", boundaryValue(answers.basics.heightCm, 140, 220, " cm")]);
  if (answers.basics.weightKg) vitals.push(["Weight", boundaryValue(answers.basics.weightKg, 30, 200, " kg")]);
  if (bmi) vitals.push(["BMI", bmi]);

  const lifestyleFacts: Array<[string, string]> = [
    [
      "Sleep",
      answers.lifestyle.sleepHours < 4
        ? "<4h per night"
        : answers.lifestyle.sleepHours > 10
          ? ">10h per night"
          : `~${answers.lifestyle.sleepHours}h per night`,
    ],
    ["Exercise", `${answers.lifestyle.exerciseDays} days per week`],
    ["Diet", answers.lifestyle.diet],
    ["Stress", `${answers.lifestyle.stress} out of 5`],
    ["Alcohol", answers.habits.alcohol],
    ["Smoking and/or vaping", answers.habits.smoking],
    ...(answers.habits.smokingProducts.length > 0
      ? [["Product types", answers.habits.smokingProducts.join(", ")]] as Array<[string, string]>
      : []),
  ];

  const reasons = withOther(answers.reason, answers.reasonOther);
  const goals = withOther(answers.goals, answers.goalsOther);
  const symptoms = withOther(answers.symptoms, answers.symptomsOther);
  const family = withOther(answers.family, answers.familyOther);
  const supplements = withOther(answers.supplements, answers.supplementsOther).filter(
    (item) => !CLEAR_ANSWERS.has(item),
  );
  const prescriptionMedicationDetails = answers.prescriptionMedicationDetails.trim();
  const allergies = withOther(answers.allergies, answers.allergiesOther);
  const hasHistory = goals.length + symptoms.length + family.length > 0;

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
        {reasons.length > 0 && (
          <blockquote className="doc-reason" aria-label="Why they're here">
            {reasons.map((item) => (
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
              <TagGroup label="Main goals" items={goals} />
              <TagGroup label="What feels off" items={symptoms} />
            </section>
          )}

          {family.length > 0 && (
            <section className="doc-card" aria-label="Family history">
              <h2 className="doc-card-title">Family history</h2>
              <ul className="doc-chips">
                {family.map((item) => (
                  <li key={item} className={CLEAR_ANSWERS.has(item) ? "" : "is-flag"}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="doc-card" aria-label="Supplements and medications">
            <h2 className="doc-card-title">Supplements &amp; medications</h2>
            {supplements.length === 0 ? (
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
                {prescriptionMedicationDetails && (
                  <p className="doc-muted">
                    Prescription medications and doses: {prescriptionMedicationDetails}
                  </p>
                )}
              </>
            )}
          </section>

          <section className="doc-card" aria-label="Allergies to medication">
            <h2 className="doc-card-title">Allergies to medication</h2>
            {allergies.length === 0 ? (
              <p className="doc-muted">None shared.</p>
            ) : (
              <ul className="doc-chips">
                {allergies.map((item) => (
                  <li key={item} className={CLEAR_ANSWERS.has(item) ? "" : "is-flag"}>{item}</li>
                ))}
              </ul>
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
