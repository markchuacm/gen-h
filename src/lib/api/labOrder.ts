import { apiError, apiRequest } from "../apiClient";

export type LabOrderQuote = {
  pricingVersion: number;
  currency: "MYR";
  catalogCount: number;
  selectedCount: number;
  baseAmountMinor: number;
  personalizationDiscountMinor: number;
  foundingDiscountMinor: number;
  isFoundingMember: boolean;
  totalAmountMinor: number;
  quotedAt: string;
};

export type LabOrderRow = {
  member_id: string;
  biomarker_codes: string[];
  status: "draft" | "ordered" | "collected" | "completed" | "cancelled";
  ordered_at: string | null;
  quote: LabOrderQuote | null;
};

/** The member's current blood panel, or a specific member's when memberId is
    passed (a doctor viewing an assigned case). Null when no panel exists yet.
    RLS scopes the read either way. */
export async function fetchLabOrder(memberId?: string): Promise<{
  data: LabOrderRow | null;
  error: string | null;
}> {
  try {
    const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
    const { data } = await apiRequest<{ data: LabOrderRow | null }>(`/v1/member/lab-orders${query}`);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

/** Persist the doctor's selected panel and advance the member's stage
    (consult_upcoming → blood_form_ready). Writes flow through the
    security-definer RPC so the stage advance stays atomic. */
export async function saveLabOrder(memberId: string, codes: string[]) {
  try {
    const { data } = await apiRequest<{ data: LabOrderRow }>("/v1/member/lab-orders", {
      method: "PUT",
      body: JSON.stringify({ memberId, codes }),
    });
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}
