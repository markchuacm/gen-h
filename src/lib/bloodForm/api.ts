import { apiError, apiRequest } from "../apiClient";
import { fillInnoquestForm } from "./innoquestForm";
import type { BloodFormPayload } from "./types";

export type { BloodFormPayload } from "./types";

/** Fetch the request-form payload. Members receive it only once the admin has
    released the form (null otherwise); admins may pass a memberId to build the
    pre-release preview. */
export async function fetchBloodForm(memberId?: string): Promise<{
  data: BloodFormPayload | null;
  error: string | null;
}> {
  try {
    const query = memberId ? `?memberId=${encodeURIComponent(memberId)}` : "";
    const { data } = await apiRequest<{ data: BloodFormPayload | null }>(`/v1/member/blood-form${query}`);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

function triggerDownload(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoke on the next tick so the download has committed to the URL.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function fileName(payload: BloodFormPayload): string {
  const name = payload.patient.fullName?.trim().replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "") || "patient";
  return `innoquest-request-form-${name}.pdf`;
}

/** Generate the filled PDF and download it to the member's device. */
export async function downloadBloodFormPdf(payload: BloodFormPayload): Promise<void> {
  const bytes = await fillInnoquestForm(payload);
  triggerDownload(bytes, fileName(payload));
}

/** Generate the filled PDF and open it in a new tab (admin preview). */
export async function openBloodFormPdf(payload: BloodFormPayload): Promise<void> {
  const bytes = await fillInnoquestForm(payload);
  const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
