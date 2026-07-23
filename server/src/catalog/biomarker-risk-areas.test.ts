import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BIOMARKER_RISK_AREAS, validateRiskAreaMembership } from "./biomarker-risk-areas.js";

type SeedBiomarker = {
  id: string;
  name: string;
  unit: string;
  scoringMode: string;
  optimalRangeLabel: string;
  suboptimalRangeLabel: string;
  outOfRangeLabel: string;
  categories: string[];
  isActive: boolean;
};
type SeedFile = { biomarkers: SeedBiomarker[] };
const seed = JSON.parse(
  readFileSync(new URL("../../seeds/biomarker-catalog.json", import.meta.url), "utf8"),
) as SeedFile;
const activeIds = seed.biomarkers.filter((marker) => marker.isActive).map((marker) => marker.id);

describe("biomarker risk-area catalog", () => {
  it("maps every active biomarker to at least one clinically meaningful risk area", () => {
    expect(() => validateRiskAreaMembership(activeIds)).not.toThrow();
    const mapped = new Set(BIOMARKER_RISK_AREAS.flatMap((area) => area.biomarkerIds));
    expect(mapped).toEqual(new Set(activeIds));
  });

  it("keeps Advanced Baseline as a complete-panel shortcut rather than a partial mapping", () => {
    expect(BIOMARKER_RISK_AREAS.map((area) => area.name)).not.toContain("Advanced Baseline");
    expect(BIOMARKER_RISK_AREAS).toHaveLength(9);
  });

  it("adds Folate and Vitamin B12 with their requested thresholds and tile coverage", () => {
    const byId = new Map(seed.biomarkers.map((marker) => [marker.id, marker]));
    expect(byId.get("folate")).toMatchObject({
      name: "Folate",
      unit: "nmol/L",
      scoringMode: "THREE_TIER",
      optimalRangeLabel: ">=10",
      suboptimalRangeLabel: "7-<10",
      outOfRangeLabel: "<7",
      categories: ["Nutrients"],
      isActive: true,
    });
    expect(byId.get("vitamin-b12")).toMatchObject({
      name: "Vitamin B12",
      unit: "pmol/L",
      scoringMode: "THREE_TIER",
      optimalRangeLabel: ">258",
      suboptimalRangeLabel: "133-258",
      outOfRangeLabel: "<133",
      categories: ["Nutrients"],
      isActive: true,
    });

    const areaMarkers = (id: string) => BIOMARKER_RISK_AREAS.find((area) => area.id === id)?.biomarkerIds ?? [];
    expect(areaMarkers("nutrients-bone-health")).toEqual(expect.arrayContaining(["folate", "vitamin-b12"]));
    expect(areaMarkers("blood-inflammation-immunity")).toEqual(expect.arrayContaining(["folate", "vitamin-b12"]));
    expect(areaMarkers("cardiovascular-risk")).toEqual(expect.arrayContaining(["folate", "vitamin-b12"]));
    expect(areaMarkers("life-stage-risk")).toContain("folate");
    expect(areaMarkers("life-stage-risk")).not.toContain("vitamin-b12");
  });
});
