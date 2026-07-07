import { supabase } from "../supabaseClient";

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
  let query = supabase
    .from("care_plans")
    .select(
      "id, member_id, doctor_id, title, summary, status, released_at, " +
        "care_plan_sections(id, care_plan_id, sort_order, title, summary, markers, doctor_note, actions)",
    )
    .order("created_at", { ascending: false })
    .limit(1);
  if (memberId) query = query.eq("member_id", memberId);
  const { data, error } = await query.returns<CarePlanRow[]>();
  if (error) return { data: null, error: error.message };
  const plan = data?.[0] ?? null;
  if (plan) plan.care_plan_sections.sort((a, b) => a.sort_order - b.sort_order);
  return { data: plan, error: null };
}
