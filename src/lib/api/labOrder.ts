import { supabase } from "../supabaseClient";

export type LabOrderRow = {
  member_id: string;
  biomarker_codes: string[];
  status: "draft" | "ordered";
  ordered_at: string | null;
};

/** The member's current blood panel, or a specific member's when memberId is
    passed (a doctor viewing an assigned case). Null when no panel exists yet.
    RLS scopes the read either way. */
export async function fetchLabOrder(memberId?: string): Promise<{
  data: LabOrderRow | null;
  error: string | null;
}> {
  const query = supabase
    .from("lab_orders")
    .select("member_id, biomarker_codes, status, ordered_at");
  const { data, error } = await (memberId ? query.eq("member_id", memberId) : query).maybeSingle<LabOrderRow>();
  return { data: data ?? null, error: error?.message ?? null };
}

/** Persist the doctor's selected panel and advance the member's stage
    (consult_upcoming → blood_form_ready). Writes flow through the
    security-definer RPC so the stage advance stays atomic. */
export async function saveLabOrder(memberId: string, codes: string[]) {
  const { error } = await supabase.rpc("save_lab_order", {
    p_member_id: memberId,
    p_codes: codes,
  });
  return { error: error?.message ?? null };
}
