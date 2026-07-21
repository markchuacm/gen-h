import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BASELINE_CODES, PANEL_BUNDLES, offerableBundles, recommendedCodes } from "./recommendedPanel";

// The recommended panel is a list of catalog ids with nothing to typecheck it
// against, so retiring a marker can silently gut the baseline or leave a bundle
// ordering a test that no longer exists. These tests are the only thing that
// catches that.

const seedPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../server/seeds/biomarker-catalog.json",
);
const seed = JSON.parse(readFileSync(seedPath, "utf8")) as {
  biomarkers: { id: string; displayName: string; isActive: boolean }[];
};
const activeCodes = new Set(seed.biomarkers.filter((m) => m.isActive).map((m) => m.id));
const knownCodes = new Set(seed.biomarkers.map((m) => m.id));

describe("recommended panel references the live catalog", () => {
  it("orders only markers that exist", () => {
    const all = [...BASELINE_CODES, ...PANEL_BUNDLES.flatMap((b) => b.codes)];
    expect(all.filter((code) => !knownCodes.has(code))).toEqual([]);
  });

  it("orders only markers that are active", () => {
    expect(BASELINE_CODES.filter((code) => !activeCodes.has(code))).toEqual([]);
    for (const bundle of PANEL_BUNDLES) {
      expect({ bundle: bundle.id, retired: bundle.codes.filter((c) => !activeCodes.has(c)) }).toEqual({
        bundle: bundle.id,
        retired: [],
      });
    }
  });

  it("keeps every bundle non-empty", () => {
    for (const bundle of PANEL_BUNDLES) expect(bundle.codes.length).toBeGreaterThan(0);
  });
});

describe("sex-appropriate recommendations", () => {
  const input = {
    age: 50,
    goals: ["Libido / hormones"],
    symptoms: [] as string[],
    family: [] as string[],
  };

  // The doctor's picker no longer hides the opposite sex's category, so this
  // flag is the only thing keeping PSA off a female member's draft panel.
  it("offers PSA to men and not to women", () => {
    expect(offerableBundles("male").map((b) => b.id)).toContain("prostate");
    expect(offerableBundles("female").map((b) => b.id)).not.toContain("prostate");
    expect(recommendedCodes({ ...input, sex: "male" })).toContain("prostate-specific-antigen-psa-total");
    expect(recommendedCodes({ ...input, sex: "female" })).not.toContain("prostate-specific-antigen-psa-total");
  });

  it("offers every bundle when sex is unknown", () => {
    expect(offerableBundles("")).toEqual(PANEL_BUNDLES);
  });
});
