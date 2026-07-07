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
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  onboarding_status: "not_started" | "in_progress" | "completed";
  current_stage: MemberStage;
  profile_confirmed_at: string | null;
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

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
      "member_id, age, sex, height_cm, weight_kg, onboarding_status, current_stage, profile_confirmed_at",
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
    localStorage stays as an offline draft cache. */
export async function upsertOnboardingResponses(entries: Record<string, unknown>) {
  const memberId = await currentUserId();
  if (!memberId) return { error: "not signed in" };
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
    advance the journey (profile_incomplete → consult_upcoming). */
export async function completeOnboarding(basics: {
  age: number;
  sex: string;
  heightCm: number;
  weightKg: number;
}) {
  const memberId = await currentUserId();
  if (!memberId) return { error: "not signed in" };
  const { error } = await supabase
    .from("member_profiles")
    .update({
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
