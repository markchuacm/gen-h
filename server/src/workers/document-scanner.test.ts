import { describe, expect, it } from "vitest";
import { matchesDeclaredFileType } from "./document-scanner.js";

describe("document signature validation", () => {
  it("accepts valid UTF-8 CSV and rejects binary bytes declared as CSV", async () => {
    expect(await matchesDeclaredFileType(Buffer.from("marker,value\nHbA1c,5.4\n"), "text/csv")).toBe(true);
    expect(await matchesDeclaredFileType(Buffer.from([0, 1, 2, 3]), "text/csv")).toBe(false);
  });

  it("rejects a text body declared as PDF", async () => {
    expect(await matchesDeclaredFileType(Buffer.from("not a PDF"), "application/pdf")).toBe(false);
  });
});
