import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BIOMARKER_RISK_AREAS, validateRiskAreaMembership } from "./biomarker-risk-areas.js";

type SeedFile = { biomarkers: Array<{ id: string; isActive: boolean }> };
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
});
