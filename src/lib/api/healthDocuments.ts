import { supabase } from "../supabaseClient";

const BUCKET = "health-documents";
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Allowed types mirror the bucket config (which enforces them server-side).
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

/** Upload to {member_id}/{uuid}.{ext} then record the metadata row (the row
    is the source of truth for listing). */
export async function uploadHealthDocument(
  file: File,
  docType: string,
): Promise<{ data: HealthDocumentRow | null; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const memberId = sessionData.session?.user.id;
  if (!memberId) return { data: null, error: "not signed in" };

  const ext = extensionOf(file.name);
  const storagePath = `${memberId}/${crypto.randomUUID()}.${ext}`;

  const upload = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: ALLOWED[ext] ?? file.type,
    upsert: false,
  });
  if (upload.error) return { data: null, error: upload.error.message };

  const { data, error } = await supabase
    .from("health_documents")
    .insert({
      member_id: memberId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: ALLOWED[ext] ?? file.type,
      size_bytes: file.size,
      doc_type: docType,
      uploaded_by: memberId,
    })
    .select()
    .single<HealthDocumentRow>();

  if (error) {
    // Best-effort cleanup; a stray object without a row is acceptable.
    void supabase.storage.from(BUCKET).remove([storagePath]);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function removeHealthDocument(documentId: string, storagePath: string) {
  const { error } = await supabase.from("health_documents").delete().eq("id", documentId);
  if (error) return { error: error.message };
  const removed = await supabase.storage.from(BUCKET).remove([storagePath]);
  return { error: removed.error?.message ?? null };
}

export async function listHealthDocuments() {
  return supabase
    .from("health_documents")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<HealthDocumentRow[]>();
}

/** Private bucket: viewing always goes through a short-lived signed URL. */
export async function createDocumentSignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 60 * 60);
  return { url: data?.signedUrl ?? null, error: error?.message ?? null };
}
