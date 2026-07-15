export const MAX_DOCUMENT_UPLOAD_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type UploadValidation =
  | { ok: true; bytes: Buffer }
  | { ok: false; statusCode: 409 | 415; error: string; code: string };

export function validateDocumentContent(
  body: unknown,
  receivedContentType: string | undefined,
  expectedContentType: string,
  expectedSize: number,
): UploadValidation {
  const contentType = receivedContentType?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== expectedContentType) {
    return { ok: false, statusCode: 415, error: "Document type does not match", code: "UPLOAD_TYPE_MISMATCH" };
  }
  if (!Buffer.isBuffer(body) || body.length !== expectedSize) {
    return { ok: false, statusCode: 409, error: "Document size does not match", code: "UPLOAD_SIZE_MISMATCH" };
  }
  return { ok: true, bytes: body };
}
