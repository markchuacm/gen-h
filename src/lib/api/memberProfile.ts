import { supabase } from "../supabaseClient";

export type MemberStage =
  | "profile_incomplete"
  | "consult_upcoming"
  | "blood_form_ready"
  | "results_pending"
  | "results_ready"
  | "care_plan_ready";

export type MemberProfileRow = {
  member_id: string;
  preferred_name: string | null;
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  onboarding_status: "not_started" | "in_progress" | "completed";
  current_stage: MemberStage;
  profile_confirmed_at: string | null;
};

/** The member's assigned doctor's public identity (name/avatar). Readable via
    the is_my_doctor profile policy. */
export async function fetchDoctorProfile(doctorId: string) {
  return supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .eq("id", doctorId)
    .maybeSingle<{ id: string; full_name: string | null; avatar_url: string | null }>();
}

export async function fetchMemberProfile() {
  return supabase
    .from("member_profiles")
    .select(
      "member_id, preferred_name, age, sex, height_cm, weight_kg, onboarding_status, current_stage, profile_confirmed_at",
    )
    .maybeSingle<MemberProfileRow>();
}

/** All saved onboarding responses, keyed by question_key. */
export async function fetchOnboardingResponses(): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
}> {
  const { data, error } = await supabase
    .from("onboarding_responses")
    .select("question_key, response");
  if (error) return { data: null, error: error.message };
  if (!data.length) return { data: null, error: null };
  return {
    data: Object.fromEntries(data.map((row) => [row.question_key, row.response])),
    error: null,
  };
}

/** Upsert one row per question/section key. The DB is the source of truth;
    localStorage stays as an offline draft cache.
    memberId is the id the calling hook was bound to (not "whoever is
    currently signed in"): a debounced write can outlive an account switch in
    the same tab, and binding to the session at call time would silently
    write one member's answers under a different member's row. Passing it
    explicitly means a stale write targets the original member_id — if that
    no longer matches the live session, RLS rejects it instead of misfiling
    it. */
export async function upsertOnboardingResponses(entries: Record<string, unknown>, memberId: string) {
  const rows = Object.entries(entries).map(([question_key, response]) => ({
    member_id: memberId,
    question_key,
    response,
  }));
  const { error } = await supabase
    .from("onboarding_responses")
    .upsert(rows, { onConflict: "member_id,question_key" });
  return { error: error?.message ?? null };
}

/** Finishing the profile flow: persist basics, mark onboarding complete, and
    advance the journey (profile_incomplete → consult_upcoming). memberId is
    bound at the call site for the same reason as upsertOnboardingResponses. */
export async function completeOnboarding(
  basics: {
    preferredName: string;
    age: number;
    sex: string;
    heightCm: number;
    weightKg: number;
  },
  memberId: string,
) {
  const { error } = await supabase
    .from("member_profiles")
    .update({
      preferred_name: basics.preferredName || null,
      age: basics.age,
      sex: basics.sex,
      height_cm: basics.heightCm,
      weight_kg: basics.weightKg,
      onboarding_status: "completed",
      current_stage: "consult_upcoming",
      profile_confirmed_at: new Date().toISOString(),
    })
    .eq("member_id", memberId)
    .eq("current_stage", "profile_incomplete");
  return { error: error?.message ?? null };
}
