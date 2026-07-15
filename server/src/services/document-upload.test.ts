import { describe, expect, it } from "vitest";
import { validateDocumentContent } from "./document-upload.js";

describe("validateDocumentContent", () => {
  it("accepts an exact binary upload", () => {
    const body = Buffer.from("synthetic-pdf");
    expect(validateDocumentContent(body, "application/pdf", "application/pdf", body.length)).toEqual({ ok: true, bytes: body });
  });

  it("rejects a mismatched content type", () => {
    const result = validateDocumentContent(Buffer.from("data"), "image/png", "application/pdf", 4);
    expect(result).toMatchObject({ ok: false, statusCode: 415, code: "UPLOAD_TYPE_MISMATCH" });
  });

  it("rejects a mismatched or non-binary body", () => {
    expect(validateDocumentContent(Buffer.from("short"), "application/pdf", "application/pdf", 100)).toMatchObject({
      ok: false,
      statusCode: 409,
      code: "UPLOAD_SIZE_MISMATCH",
    });
    expect(validateDocumentContent({}, "application/pdf", "application/pdf", 0)).toMatchObject({ ok: false });
  });
});
