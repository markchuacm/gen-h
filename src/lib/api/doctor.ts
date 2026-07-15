import { apiError, apiRequest } from "../apiClient";
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
  try {
    const { data } = await apiRequest<{ data: DoctorCase[] }>("/v1/doctor/cases");
    return { data, error: null };
  } catch (error) {
    return { data: [], error: apiError(error) };
  }
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
  try {
    return await apiRequest<{ data: DoctorCaseDetail | null }>(
      `/v1/doctor/cases/${encodeURIComponent(memberId)}`,
    ).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

// ---- Care-plan authoring -------------------------------------------------

export type DraftSection = {
  id?: string;
  sort_order: number;
  title: string;
  summary: string;
  markers: string[];
  doctor_note: string;
  /** Doctor-chosen member-facing image; null falls back to the order cycle. */
  image_key: string | null;
  actions: CarePlanActionData[];
};

export type EditablePlan = {
  id: string;
  title: string | null;
  summary: string | null;
  status: string;
  care_plan_sections: DraftSection[];
};

/** The doctor's working plan for a member (latest, any status). */
export async function fetchEditablePlan(memberId: string) {
  try {
    return await apiRequest<{ data: EditablePlan | null }>(`/v1/doctor/care-plans/${encodeURIComponent(memberId)}`)
      .then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export async function createDraftPlan(memberId: string, title: string) {
  try {
    return await apiRequest<{ data: { id: string } }>("/v1/doctor/care-plans", {
      method: "POST",
      body: JSON.stringify({ memberId, title }),
    }).then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export async function savePlanSections(planId: string, sections: DraftSection[]) {
  try {
    await apiRequest(`/v1/doctor/care-plans/${encodeURIComponent(planId)}/sections`, {
      method: "PUT", body: JSON.stringify({ sections }),
    });
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
}

export async function updatePlanMeta(planId: string, patch: { title?: string; summary?: string }) {
  try {
    await apiRequest(`/v1/doctor/care-plans/${encodeURIComponent(planId)}`, {
      method: "PATCH", body: JSON.stringify(patch),
    });
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
}

export async function releaseCarePlan(planId: string) {
  try {
    await apiRequest(`/v1/doctor/care-plans/${encodeURIComponent(planId)}/release`, { method: "POST" });
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
}
