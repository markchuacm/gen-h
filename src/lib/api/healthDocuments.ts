import { apiError, apiRequest } from "../apiClient";

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Allowed types mirror the API validation rules.
const ALLOWED: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  csv: "text/csv",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type HealthDocumentRow = {
  id: string;
  member_id: string;
  storage_path: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  doc_type: string | null;
  created_at: string;
};

function extensionOf(name: string): string {
  return name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
}

/** Returns a user-facing error message, or null if the file is acceptable. */
export function validateHealthFile(file: File): string | null {
  const ext = extensionOf(file.name);
  if (!(ext in ALLOWED)) {
    return `${file.name}: unsupported type — use PDF, JPG, PNG, CSV, DOC or DOCX.`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `${file.name}: larger than 10MB.`;
  }
  return null;
}

/** Request an opaque object key, then upload through the authenticated API. */
export async function uploadHealthDocument(
  file: File,
  docType: string,
): Promise<{ data: HealthDocumentRow | null; error: string | null }> {
  const ext = extensionOf(file.name);
  const mimeType = ALLOWED[ext] ?? file.type;
  try {
    const prepared = await apiRequest<{ data: HealthDocumentRow }>(
      "/v1/member/documents/upload",
      { method: "POST", body: JSON.stringify({ fileName: file.name, mimeType, sizeBytes: file.size, docType }) },
    );
    await apiRequest(`/v1/member/documents/${encodeURIComponent(prepared.data.id)}/content`, {
      method: "PUT",
      headers: { "content-type": mimeType },
      body: file,
    });
    return { data: prepared.data, error: null };
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

export async function removeHealthDocument(documentId: string, storagePath: string) {
  void storagePath;
  try {
    await apiRequest(`/v1/member/documents/${encodeURIComponent(documentId)}`, { method: "DELETE" });
    return { error: null };
  } catch (error) {
    return { error: apiError(error) };
  }
}

export async function listHealthDocuments() {
  try {
    return await apiRequest<{ data: HealthDocumentRow[] }>("/v1/member/documents")
      .then(({ data }) => ({ data, error: null }));
  } catch (error) {
    return { data: null, error: apiError(error) };
  }
}

/** Private bucket: viewing always goes through a short-lived signed URL. */
export async function createDocumentSignedUrl(storagePath: string) {
  try {
    const { url } = await apiRequest<{ url: string }>(
      `/v1/member/documents/download?objectKey=${encodeURIComponent(storagePath)}`,
    );
    return { url, error: null };
  } catch (error) {
    return { url: null, error: apiError(error) };
  }
}
