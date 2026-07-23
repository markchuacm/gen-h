import { apiError, apiRequest } from "../apiClient";

export type CarePlanActionData = {
  id: string;
  title: string;
  lifestyleCategory: "Nutrition" | "Exercise" | "Supplements" | "Sleep";
  instruction: string;
  rationale: string;
  moreGuidance: string;
  sourceTemplateId?: string;
  clinicianConfirmed?: boolean;
};

export type CarePlanEvidenceData = {
  biomarkerCode: string;
  displayName: string;
  value: number | string | null;
  unit: string | null;
  status: "optimal" | "at_risk" | "needs_attention";
  reportId: string;
  collectedAt: string | null;
};

export type ProposedCarePlanAction = Omit<CarePlanActionData, "clinicianConfirmed"> & {
  templateId: string;
  doctorRecommended: boolean;
  safetyNote?: string;
};

export type CarePlanSectionRow = {
  id: string;
  care_plan_id: string;
  sort_order: number;
  title: string | null;
  summary: string | null;
  markers: string[];
  doctor_note: string | null;
  /** Doctor-chosen member-facing image; null falls back to the order cycle. */
  image_key: string | null;
  actions: CarePlanActionData[];
  template_key?: string | null;
  basis_type?: "results" | "prevention" | "manual" | "legacy";
  evidence_snapshot?: CarePlanEvidenceData[];
  profile_basis?: string[];
};

export type CarePlanRow = {
  id: string;
  member_id: string;
  doctor_id: string;
  title: string | null;
  summary: string | null;
  status: "draft" | "released" | "archived";
  version: number;
  released_at: string | null;
  review_date: string | null;
  ruleset_version: string | null;
  care_plan_sections: CarePlanSectionRow[];
};

/** For a member: their released plan (RLS filters to released + own). For a
    doctor viewing an assigned member: pass memberId to scope the query. */
export async function fetchCarePlan(memberId?: string) {
  try {
    const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
    const { data } = await apiRequest<{ data: CarePlanRow | null }>(`/v1/member/care-plans${query}`);
    if (data) data.care_plan_sections.sort((a, b) => a.sort_order - b.sort_order);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export async function fetchCarePlanProgress(planId: string) {
  try {
    const { data } = await apiRequest<{ data: Record<string, boolean> }>(
      `/v1/member/care-plans/${encodeURIComponent(planId)}/progress`,
    );
    return { data, error: null };
  } catch (error) {
    return { data: {}, error: apiError(error) };
  }
}

export async function setCarePlanActionProgress(planId: string, actionId: string, completed: boolean) {
  try {
    await apiRequest(
      `/v1/member/care-plans/${encodeURIComponent(planId)}/actions/${encodeURIComponent(actionId)}/progress`,
      { method: "PUT", body: JSON.stringify({ completed }) },
    );
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
}
