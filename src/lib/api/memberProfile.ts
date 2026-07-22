import { apiError, apiRequest } from "../apiClient";

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
  full_name: string | null;
  date_of_birth: string | null;
  ic_passport_no: string | null;
  address: string | null;
  phone: string | null;
};

/** Identity details the member can self-edit (name to match their IC, plus the
    fields the Innoquest request form requires). Any subset may be sent. */
export type MemberIdentityInput = {
  fullName?: string;
  dateOfBirth?: string | null;
  icPassportNo?: string | null;
  address?: string | null;
  phone?: string | null;
};

export async function updateMemberIdentity(input: MemberIdentityInput): Promise<{
  data: MemberProfileRow | null;
  error: string | null;
}> {
  try {
    const { data } = await apiRequest<{ data: MemberProfileRow | null }>("/v1/member/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

/** The member's assigned doctor's public identity (name/avatar). Readable via
    the is_my_doctor profile policy. */
export async function fetchDoctorProfile(doctorId: string) {
  try {
    return await apiRequest<{ data: { id: string; full_name: string | null; avatar_url: string | null } | null }>(
      `/v1/profiles/${encodeURIComponent(doctorId)}/public`,
    ).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

/** The signed-in member's profile, or a specific member's when memberId is
    passed (a doctor viewing an assigned case — RLS still gates the read). */
export async function fetchMemberProfile(memberId?: string) {
  try {
    const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
    return await apiRequest<{ data: MemberProfileRow | null }>(`/v1/member/profile${query}`)
      .then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

/** All saved onboarding responses, keyed by question_key. */
export async function fetchOnboardingResponses(): Promise<{
  data: Record<string, unknown> | null;
  error: string | null;
}> {
  try {
    const { data } = await apiRequest<{ data: Record<string, unknown> }>("/v1/member/onboarding");
    return { data: Object.keys(data).length ? data : null, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
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
  try {
    await apiRequest("/v1/member/onboarding", {
      method: "PUT",
      body: JSON.stringify({ memberId, entries }),
    });
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
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
  try {
    await apiRequest("/v1/member/onboarding/complete", {
      method: "POST",
      body: JSON.stringify({ memberId, ...basics }),
    });
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
}
