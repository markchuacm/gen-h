// Shared clinical-signal helpers for the doctor console. The case brief and
// the panel builder must agree on what counts as a risk flag, so the logic
// lives here rather than in either screen.
import {
  DEFAULT_ANSWERS,
  EXCLUSIVE_PROFILE_OPTIONS,
} from "../member-v2/screens/profile/profileQuestions";
import type { ProfileAnswers } from "../member-v2/screens/profile/profileQuestions";
import type { Biomarker } from "../member-v2/screens/results/types";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import type { RecommendationInput } from "./recommendedPanel";

// "No concern" answers that shouldn't read as risk flags.
export const CLEAR_ANSWERS = new Set<string>([
  EXCLUSIVE_PROFILE_OPTIONS.family,
  EXCLUSIVE_PROFILE_OPTIONS.symptoms,
  EXCLUSIVE_PROFILE_OPTIONS.supplements,
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
  return {
    ...DEFAULT_ANSWERS,
    basics: { ...DEFAULT_ANSWERS.basics, ...(asObject(onboarding.basics) as ProfileAnswers["basics"]) },
    lifestyle: {
      ...DEFAULT_ANSWERS.lifestyle,
      ...(asObject(onboarding.lifestyle) as ProfileAnswers["lifestyle"]),
    },
    habits: { ...DEFAULT_ANSWERS.habits, ...(asObject(onboarding.habits) as ProfileAnswers["habits"]) },
    reason: asStringList(onboarding.reason),
    goals: asStringList(onboarding.goals),
    symptoms: asStringList(onboarding.symptoms),
    family: asStringList(onboarding.family),
    supplements: asStringList(onboarding.supplements),
    supplementsOther: typeof onboarding.supplementsOther === "string" ? onboarding.supplementsOther : "",
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

/** Intake answers that warrant the doctor's attention first. Conservative and
    purely rule-based — every flag traces to a literal answer the member gave.
    None of the DEFAULT_ANSWERS fallbacks merged in by toAnswers trip a rule,
    so unanswered sections can't produce phantom flags. */
export function deriveRedFlags(answers: ProfileAnswers): string[] {
  const flags: string[] = [];
  for (const item of answers.family) {
    if (!CLEAR_ANSWERS.has(item)) flags.push(`Family history — ${item}`);
  }
  if (answers.habits.smoking === "Current smoker") flags.push("Current smoker");
  if (answers.habits.alcohol === "Most days") flags.push("Alcohol most days");
  if (answers.lifestyle.stress >= 4) flags.push(`High stress (${answers.lifestyle.stress}/5)`);
  if (answers.lifestyle.sleepHours < 6) flags.push(`Short sleep (~${answers.lifestyle.sleepHours}h)`);
  if (answers.lifestyle.exerciseDays === "0") flags.push("No weekly exercise");
  return flags;
}
