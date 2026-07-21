// Shared clinical-signal helpers for the doctor console. The case brief and
// the panel builder must agree on what counts as a risk flag, so the logic
// lives here rather than in either screen.
import {
  DEFAULT_ANSWERS,
  EXCLUSIVE_PROFILE_OPTIONS,
  normalizeHabits,
  NOTHING_MAJOR_OPTION,
} from "../member-v2/screens/profile/profileQuestions";
import type { ProfileAnswers } from "../member-v2/screens/profile/profileQuestions";
import type { Biomarker } from "../member-v2/screens/results/types";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import type { RecommendationInput } from "./recommendedPanel";

// "No concern" answers that shouldn't read as risk flags.
export const CLEAR_ANSWERS = new Set<string>([
  EXCLUSIVE_PROFILE_OPTIONS.family,
  EXCLUSIVE_PROFILE_OPTIONS.supplements,
  EXCLUSIVE_PROFILE_OPTIONS.allergies,
  NOTHING_MAJOR_OPTION,
]);

export function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

// The onboarding record is untyped jsonb, so every section is coerced back into
// a ProfileAnswers shape defensively before doctor screens render it.
export function toAnswers(onboarding: Record<string, unknown>): ProfileAnswers {
  const basics = {
    ...DEFAULT_ANSWERS.basics,
    ...(asObject(onboarding.basics) as ProfileAnswers["basics"]),
  };
  return {
    ...DEFAULT_ANSWERS,
    basics,
    lifestyle: {
      ...DEFAULT_ANSWERS.lifestyle,
      ...(asObject(onboarding.lifestyle) as ProfileAnswers["lifestyle"]),
    },
    habits: normalizeHabits(
      asObject(onboarding.habits) as Partial<ProfileAnswers["habits"]>,
      basics.sex,
    ),
    reason: asStringList(onboarding.reason),
    reasonOther: typeof onboarding.reasonOther === "string" ? onboarding.reasonOther : "",
    goals: asStringList(onboarding.goals),
    goalsOther: typeof onboarding.goalsOther === "string" ? onboarding.goalsOther : "",
    symptoms: asStringList(onboarding.symptoms),
    symptomsOther: typeof onboarding.symptomsOther === "string" ? onboarding.symptomsOther : "",
    family: asStringList(onboarding.family),
    familyOther: typeof onboarding.familyOther === "string" ? onboarding.familyOther : "",
    supplements: asStringList(onboarding.supplements),
    supplementsOther: typeof onboarding.supplementsOther === "string" ? onboarding.supplementsOther : "",
    prescriptionMedicationDetails:
      typeof onboarding.prescriptionMedicationDetails === "string"
        ? onboarding.prescriptionMedicationDetails
        : "",
    allergies: asStringList(onboarding.allergies),
    allergiesOther: typeof onboarding.allergiesOther === "string" ? onboarding.allergiesOther : "",
  };
}

/** Alias-aware biomarker search used by the panel builder and marker picker. */
export function matchesQuery(marker: Biomarker | undefined, query: string) {
  if (!query) return true;
  if (!marker) return false;
  const haystack = [marker.displayName, marker.name, ...marker.aliases].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function toRecommendationInput(detail: DoctorCaseDetail): RecommendationInput {
  return {
    sex: detail.sex ?? "",
    age: detail.age,
    goals: asStringList(detail.onboarding.goals),
    symptoms: asStringList(detail.onboarding.symptoms),
    family: asStringList(detail.onboarding.family),
  };
}

/** Lifestyle/habit answers that warrant the doctor's attention, keyed by the
    brief's row label so the concern is highlighted on the fact itself instead
    of repeated in a separate flags block. Conservative and purely rule-based —
    every concern traces to a literal answer the member gave. None of the
    DEFAULT_ANSWERS fallbacks merged in by toAnswers trip a rule, so unanswered
    sections can't produce phantom flags. */
export function lifestyleConcerns(answers: ProfileAnswers): Set<string> {
  const concerns = new Set<string>();
  if (answers.lifestyle.sleepHours < 6) concerns.add("Sleep");
  if (answers.lifestyle.exerciseDays === "0") concerns.add("Exercise");
  if (answers.lifestyle.stress >= 4) concerns.add("Stress");
  if (answers.habits.alcohol.endsWith("or more drinks a week")) concerns.add("Alcohol");
  if (answers.habits.smoking === "Daily / regularly") concerns.add("Smoking and/or vaping");
  return concerns;
}
