import { supabase } from "../supabaseClient";
import type { CarePlanActionData } from "./carePlan";

export type DoctorCase = {
  assignmentId: string;
  memberId: string;
  memberName: string | null;
  memberEmail: string | null;
  stage: string | null;
  onboardingStatus: string | null;
};

/** Assigned members for the signed-in doctor (RLS returns only their rows). */
export async function fetchDoctorCases(): Promise<{ data: DoctorCase[]; error: string | null }> {
  const { data, error } = await supabase
    .from("doctor_assignments")
    .select(
      "id, member_id, status, " +
        "profiles!doctor_assignments_member_id_fkey(full_name, email, " +
        "member_profiles(current_stage, onboarding_status))",
    )
    .eq("status", "active");
  if (error) return { data: [], error: error.message };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []) as any[];
  return {
    data: rows.map((row) => {
      const member = Array.isArray(row.profiles?.member_profiles)
        ? row.profiles?.member_profiles[0]
        : row.profiles?.member_profiles;
      return {
        assignmentId: row.id,
        memberId: row.member_id,
        memberName: row.profiles?.full_name ?? null,
        memberEmail: row.profiles?.email ?? null,
        stage: member?.current_stage ?? null,
        onboardingStatus: member?.onboarding_status ?? null,
      };
    }),
    error: null,
  };
}

export type DoctorCaseDetail = {
  memberName: string | null;
  memberEmail: string | null;
  age: number | null;
  sex: string | null;
  stage: string | null;
  onboarding: Record<string, unknown>;
  documents: Array<{ id: string; file_name: string; storage_path: string; doc_type: string | null }>;
  /** Whether any released biomarker results exist — decides whether the case
      opens the panel builder (order) or the results view (review). */
  hasResults: boolean;
};

/** Everything a doctor needs to review an assigned case. Each query is RLS-gated
    on is_doctor_of, so an unassigned member returns nothing. */
export async function fetchCaseDetail(memberId: string): Promise<{
  data: DoctorCaseDetail | null;
  error: string | null;
}> {
  const [profile, member, responses, docs, results] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", memberId).maybeSingle(),
    supabase
      .from("member_profiles")
      .select("age, sex, current_stage")
      .eq("member_id", memberId)
      .maybeSingle(),
    supabase.from("onboarding_responses").select("question_key, response").eq("member_id", memberId),
    supabase
      .from("health_documents")
      .select("id, file_name, storage_path, doc_type")
      .eq("member_id", memberId),
    // RLS already limits doctor reads to released results, so any row here means
    // the member has results to review.
    supabase
      .from("biomarker_results")
      .select("id", { count: "exact", head: true })
      .eq("member_id", memberId),
  ]);

  const firstError = profile.error || member.error || responses.error || docs.error || results.error;
  if (firstError) return { data: null, error: firstError.message };

  const onboarding = Object.fromEntries(
    (responses.data ?? []).map((row) => [row.question_key, row.response]),
  );

  // The onboarding answers are the member's live source of truth for age/sex;
  // member_profiles is a copy taken at completion that can go stale if they
  // edit afterwards. Prefer the answers so the header matches the brief's hero.
  const basics =
    onboarding.basics && typeof onboarding.basics === "object" && !Array.isArray(onboarding.basics)
      ? (onboarding.basics as Record<string, unknown>)
      : {};
  const basicsAge = typeof basics.age === "number" ? basics.age : null;
  const basicsSex = typeof basics.sex === "string" ? basics.sex : null;

  return {
    data: {
      memberName: profile.data?.full_name ?? null,
      memberEmail: profile.data?.email ?? null,
      age: basicsAge ?? member.data?.age ?? null,
      sex: basicsSex ?? member.data?.sex ?? null,
      stage: member.data?.current_stage ?? null,
      onboarding,
      documents: docs.data ?? [],
      hasResults: (results.count ?? 0) > 0,
    },
    error: null,
  };
}

// ---- Care-plan authoring -------------------------------------------------

export type DraftSection = {
  id?: string;
  sort_order: number;
  title: string;
  summary: string;
  markers: string[];
  doctor_note: string;
  actions: CarePlanActionData[];
};

/** The doctor's working plan for a member (latest, any status). */
export async function fetchEditablePlan(memberId: string) {
  const { data, error } = await supabase
    .from("care_plans")
    .select("id, title, summary, status, care_plan_sections(*)")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .limit(1);
  return { data: data?.[0] ?? null, error: error?.message ?? null };
}

export async function createDraftPlan(memberId: string, title: string) {
  const { data: sessionData } = await supabase.auth.getSession();
  const doctorId = sessionData.session?.user.id;
  if (!doctorId) return { data: null, error: "not signed in" };
  const { data, error } = await supabase
    .from("care_plans")
    .insert({ member_id: memberId, doctor_id: doctorId, title, status: "draft" })
    .select("id")
    .single();
  return { data, error: error?.message ?? null };
}

export async function savePlanSections(planId: string, sections: DraftSection[]) {
  // Replace-all: simplest correct sync for a small section set.
  const del = await supabase.from("care_plan_sections").delete().eq("care_plan_id", planId);
  if (del.error) return { error: del.error.message };
  if (sections.length === 0) return { error: null };
  const rows = sections.map((section) => ({
    care_plan_id: planId,
    sort_order: section.sort_order,
    title: section.title,
    summary: section.summary,
    markers: section.markers,
    doctor_note: section.doctor_note,
    actions: section.actions,
  }));
  const { error } = await supabase.from("care_plan_sections").insert(rows);
  return { error: error?.message ?? null };
}

export async function updatePlanMeta(planId: string, patch: { title?: string; summary?: string }) {
  const { error } = await supabase.from("care_plans").update(patch).eq("id", planId);
  return { error: error?.message ?? null };
}

export async function releaseCarePlan(planId: string) {
  const { error } = await supabase.rpc("release_care_plan", { plan_id: planId });
  return { error: error?.message ?? null };
}
