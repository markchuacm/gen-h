import { describe, expect, it } from "vitest";
import { mergeResults } from "./useMemberResults";
import type { BiomarkerCatalog } from "../../../lib/api/catalog";
import type { Biomarker } from "./types";
import type { BiomarkerResultRow, LabReportRow } from "../../../lib/api/results";

// Deactivating a marker has to hide it everywhere. The failure mode this guards
// is subtle: without the retired-code check, a released result for a retired
// marker doesn't disappear — it falls through to the unknown-code path and
// reappears under "Other results", which is the opposite of what was intended.

function catalogMarker(id: string, category: string): Biomarker {
  return {
    id,
    name: id,
    displayName: id,
    category,
    categories: [category],
    aliases: [],
    description: "",
    whatItMeasures: "",
    whyItMatters: "",
    unit: "",
    scoringMode: "THREE_TIER",
    contextRequirements: [],
    optimalRangeLabel: "",
    suboptimalRangeLabel: "",
    outOfRangeLabel: "",
    lowerOptimal: null,
    upperOptimal: null,
    lowerReference: null,
    upperReference: null,
    directionality: "range_based",
    status: "not_available",
    latestValue: null,
    latestDate: null,
    historicalValues: [],
  };
}

function makeCatalog(retiredCodes: string[]): BiomarkerCatalog {
  const biomarkers = [catalogMarker("glucose", "Metabolic")];
  return {
    categories: [{ name: "Metabolic", description: "", biomarkerIds: ["glucose"] }],
    riskAreas: [],
    biomarkers,
    byCode: new Map(biomarkers.map((m) => [m.id, m])),
    retiredCodes: new Set(retiredCodes),
  };
}

function result(code: string, value: number): BiomarkerResultRow {
  return {
    id: `r-${code}`,
    biomarker_code: code,
    biomarker_name: code,
    category: null,
    value_numeric: value,
    value_text: null,
    unit: "mmol/L",
    ref_low: null,
    ref_high: null,
    optimal_low: null,
    optimal_high: null,
    status: "optimal",
    notes: null,
  };
}

function report(rows: BiomarkerResultRow[]): LabReportRow {
  return {
    id: "report-1",
    lab_name: null,
    panel_name: null,
    collected_at: "2026-07-01",
    released_at: "2026-07-02",
    biomarker_results: rows,
  };
}

describe("mergeResults", () => {
  it("drops released results for retired markers", () => {
    const { biomarkers, categories } = mergeResults(
      [report([result("glucose", 5), result("omega-3-total", 2)])],
      makeCatalog(["omega-3-total"]),
    );

    expect(biomarkers.map((m) => m.id)).toEqual(["glucose"]);
    expect(categories.map((c) => c.name)).not.toContain("Other results");
  });

  it("still surfaces unrecognised lab codes under Other results", () => {
    const { biomarkers, categories } = mergeResults(
      [report([result("glucose", 5), result("some-new-lab-code", 7)])],
      makeCatalog(["omega-3-total"]),
    );

    expect(biomarkers.map((m) => m.id).sort()).toEqual(["glucose", "some-new-lab-code"]);
    expect(categories.find((c) => c.name === "Other results")?.biomarkerIds).toEqual(["some-new-lab-code"]);
  });

  it("merges the newest value and keeps older ones as history", () => {
    const older = { ...report([result("glucose", 5)]), id: "r1", collected_at: "2026-01-01" };
    const newer = { ...report([result("glucose", 6)]), id: "r2", collected_at: "2026-07-01" };

    const { biomarkers } = mergeResults([older, newer], makeCatalog([]));
    const glucose = biomarkers.find((m) => m.id === "glucose");

    expect(glucose?.latestValue).toBe(6);
    expect(glucose?.latestDate).toBe("2026-07-01");
    expect(glucose?.historicalValues).toEqual([{ value: 5, testDate: "2026-01-01" }]);
  });

  it("does not mutate the shared catalog objects", () => {
    const catalog = makeCatalog([]);
    mergeResults([report([result("glucose", 5)])], catalog);

    // The catalog is a module-level cache shared by every screen; merging one
    // member's results must not leave their values on it.
    expect(catalog.byCode.get("glucose")?.latestValue).toBeNull();
    expect(catalog.categories[0].biomarkerIds).toEqual(["glucose"]);
  });
});
