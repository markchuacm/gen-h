import { apiError, apiRequest } from "../apiClient";

export type BiomarkerResultRow = {
  id: string;
  biomarker_code: string;
  biomarker_name: string | null;
  category: string | null;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  ref_low: number | null;
  ref_high: number | null;
  optimal_low: number | null;
  optimal_high: number | null;
  status: "optimal" | "at_risk" | "needs_attention";
  notes: string | null;
};

export type LabReportRow = {
  id: string;
  lab_name: string | null;
  panel_name: string | null;
  collected_at: string | null;
  released_at: string | null;
  biomarker_results: BiomarkerResultRow[];
};

/** Released reports only — drafts are filtered out by RLS, not by us.
    Pass memberId to scope to a specific member (a doctor's RLS grant spans all
    their assigned members, so the filter is required to view just one case);
    omit it and RLS returns the signed-in member's own reports. */
export async function fetchReleasedReports(memberId?: string) {
  try {
    const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
    return await apiRequest<{ data: LabReportRow[] }>(`/v1/member/lab-reports${query}`)
      .then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: { message: apiError(error) } };
  }
}
