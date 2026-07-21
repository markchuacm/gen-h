import { describe, expect, it } from "vitest";
import type { BiomarkerRiskArea } from "../lib/api/catalog";
import {
  clearRiskAreaSelection,
  createRiskAreaSelection,
  selectAdvancedBaseline,
  selectedCodesForRiskAreas,
  setRiskAreaMarkers,
  toggleRiskArea,
} from "./riskAreaSelection";

const areas: BiomarkerRiskArea[] = [
  { id: "cardiovascular-risk", name: "Cardiovascular Risk", description: "", biomarkerIds: ["lipid", "hs-crp"] },
  { id: "metabolic-health", name: "Metabolic Health", description: "", biomarkerIds: ["hs-crp", "glucose"] },
  { id: "kidney-urinary-health", name: "Kidney & Urinary Health", description: "", biomarkerIds: ["creatinine"] },
];
const allCodes = ["lipid", "hs-crp", "glucose", "creatinine"];

describe("risk-area selection", () => {
  it("starts as Advanced Baseline and retains overlap when one area is removed", () => {
    const baseline = createRiskAreaSelection(null, allCodes, areas);
    expect(baseline.advancedBaselineSelected).toBe(true);
    expect(selectedCodesForRiskAreas(baseline, areas)).toEqual(new Set(allCodes));

    const withoutCardiovascular = toggleRiskArea(baseline, areas, "cardiovascular-risk");
    expect(withoutCardiovascular.advancedBaselineSelected).toBe(false);
    expect(selectedCodesForRiskAreas(withoutCardiovascular, areas)).toEqual(
      new Set(["hs-crp", "glucose", "creatinine"]),
    );

    expect(selectedCodesForRiskAreas(clearRiskAreaSelection(), areas)).toEqual(new Set());
  });

  it("returns to Advanced Baseline when every coverage area is selected individually", () => {
    let selection = clearRiskAreaSelection();
    for (const area of areas) selection = toggleRiskArea(selection, areas, area.id);

    expect(selection.advancedBaselineSelected).toBe(true);
    expect(selectedCodesForRiskAreas(selection, areas)).toEqual(new Set(allCodes));
  });

  it("keeps individual clinical fine-tuning while preserving the underlying coverage selections", () => {
    const baseline = selectAdvancedBaseline(areas);
    const personalised = setRiskAreaMarkers(baseline, areas, ["hs-crp"], false);
    expect(personalised.advancedBaselineSelected).toBe(false);
    expect(selectedCodesForRiskAreas(personalised, areas)).toEqual(new Set(["lipid", "glucose", "creatinine"]));

    const removedMetabolic = toggleRiskArea(personalised, areas, "metabolic-health");
    expect(selectedCodesForRiskAreas(removedMetabolic, areas)).toEqual(new Set(["lipid", "creatinine"]));

    const restoredMetabolic = toggleRiskArea(removedMetabolic, areas, "metabolic-health");
    expect(selectedCodesForRiskAreas(restoredMetabolic, areas)).toEqual(new Set(allCodes));
  });

  it("reconstructs a saved panel exactly rather than expanding it to a new baseline", () => {
    const restored = createRiskAreaSelection(["lipid", "creatinine"], allCodes, areas);
    expect(restored.advancedBaselineSelected).toBe(false);
    expect(selectedCodesForRiskAreas(restored, areas)).toEqual(new Set(["lipid", "creatinine"]));
  });
});
