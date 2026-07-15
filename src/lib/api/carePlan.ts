import { apiError, apiRequest } from "../apiClient";

export type CarePlanActionData = {
  id: string;
  title: string;
  lifestyleCategory: "Nutrition" | "Exercise" | "Supplements" | "Sleep";
  instruction: string;
  rationale: string;
  moreGuidance: string;
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
};

export type CarePlanRow = {
  id: string;
  member_id: string;
  doctor_id: string;
  title: string | null;
  summary: string | null;
  status: "draft" | "released" | "archived";
  released_at: string | null;
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
