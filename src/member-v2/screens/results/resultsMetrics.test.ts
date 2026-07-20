import { describe, expect, it } from "vitest";
import { panelEntries, resultKind } from "./ResultsDashboard";
import { constrainToPanel } from "./useMemberResults";
import type { Biomarker, BiomarkerCategory } from "./types";

const marker = (id: string, latestValue: number | string | null, optimalRangeLabel = "") => ({
  id,
  name: id,
  displayName: id,
  category: "Example",
  categories: ["Example"],
  aliases: [],
  description: "",
  whatItMeasures: "",
  whyItMatters: "",
  unit: "",
  ruleType: "NUMERIC_FIXED",
  optimalRangeLabel,
  suboptimalRangeLabel: "",
  outOfRangeLabel: "",
  lowerOptimal: null,
  upperOptimal: null,
  lowerReference: null,
  upperReference: null,
  directionality: "range_based",
  status: "not_available",
  latestValue,
  latestDate: null,
  historicalValues: [],
}) as Biomarker;

describe("results overview metrics", () => {
  it("counts overlapping category membership once", () => {
    const categories: BiomarkerCategory[] = [
      { name: "A", description: "", biomarkerIds: ["one", "two"] },
      { name: "B", description: "", biomarkerIds: ["two", "three"] },
    ];
    expect(panelEntries(categories).map((entry) => entry.biomarkerId)).toEqual(["one", "two", "three"]);
  });

  it("does not call a blank contextual marker doctor-reviewed", () => {
    expect(resultKind(marker("context", null, "CONTEXT_REQUIRED"))).toBe("awaiting");
    expect(resultKind(marker("context", 4.2, "CONTEXT_REQUIRED"))).toBe("contextual");
  });

  it("shows the full educational catalog until a released measurement exists", () => {
    const categories: BiomarkerCategory[] = [
      { name: "A", description: "", biomarkerIds: ["one", "two"] },
    ];
    const biomarkers = [marker("one", null), marker("two", null)];
    expect(constrainToPanel(categories, biomarkers, null)).toEqual(categories);
    expect(constrainToPanel(categories, biomarkers, [])).toEqual(categories);
    expect(constrainToPanel(categories, biomarkers, ["unknown-code"])).toEqual(categories);
    expect(constrainToPanel(categories, biomarkers, ["two"])).toEqual(categories);

    const released = [marker("one", 4.2), marker("two", null)];
    expect(constrainToPanel(categories, released, ["two"])[0]?.biomarkerIds).toEqual(["one", "two"]);
  });
});
