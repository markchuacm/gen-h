import { describe, expect, it } from "vitest";
import { unitsEquivalent } from "./lab-processor.js";

describe("lab unit mappings", () => {
  it("allows absent or formatting-only normalized units", () => {
    expect(unitsEquivalent("mg/dL", null)).toBe(true);
    expect(unitsEquivalent("mg / dL", "MG/dL")).toBe(true);
  });

  it("rejects unit relabeling without a conversion", () => {
    expect(unitsEquivalent("mg/dL", "mmol/L")).toBe(false);
    expect(unitsEquivalent(null, "mmol/L")).toBe(false);
  });
});
