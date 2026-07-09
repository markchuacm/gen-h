// Human-readable labels for member_profiles.current_stage — shared so the case
// list, case header and elsewhere never surface the raw snake_case value.
export const STAGE_LABELS: Record<string, string> = {
  profile_incomplete: "Profile incomplete",
  consult_upcoming: "Consult upcoming",
  blood_form_ready: "Blood draw",
  results_pending: "Results pending",
  results_ready: "Results ready",
  care_plan_ready: "Care plan released",
};

export function stageLabel(stage: string | null | undefined): string | null {
  if (!stage) return null;
  return STAGE_LABELS[stage] ?? stage;
}
