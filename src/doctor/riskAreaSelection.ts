import type { BiomarkerRiskArea } from "../lib/api/catalog";

/**
 * Area selection remains distinct from the final marker set. Risk areas offer
 * coverage defaults, while doctor-level additions/removals preserve precise
 * clinical judgement without breaking overlapping coverage.
 */
export type RiskAreaSelection = {
  selectedAreaIds: Set<string>;
  manuallyIncluded: Set<string>;
  manuallyExcluded: Set<string>;
  advancedBaselineSelected: boolean;
};

function codesForArea(riskAreas: BiomarkerRiskArea[], areaId: string): string[] {
  return riskAreas.find((area) => area.id === areaId)?.biomarkerIds ?? [];
}

function coveredByAreas(selection: RiskAreaSelection, riskAreas: BiomarkerRiskArea[]): Set<string> {
  const covered = new Set<string>();
  for (const area of riskAreas) {
    if (!selection.selectedAreaIds.has(area.id)) continue;
    for (const id of area.biomarkerIds) covered.add(id);
  }
  return covered;
}

export function selectedCodesForRiskAreas(
  selection: RiskAreaSelection,
  riskAreas: BiomarkerRiskArea[],
): Set<string> {
  const selected = coveredByAreas(selection, riskAreas);
  for (const id of selection.manuallyIncluded) selected.add(id);
  for (const id of selection.manuallyExcluded) selected.delete(id);
  return selected;
}

/** Creates an exact editable representation of a saved panel, or a new
 * Advanced Baseline draft when no lab order exists yet. */
export function createRiskAreaSelection(
  savedCodes: Iterable<string> | null,
  allCodes: Iterable<string>,
  riskAreas: BiomarkerRiskArea[],
): RiskAreaSelection {
  const activeCodes = new Set(allCodes);
  if (savedCodes === null) {
    return {
      selectedAreaIds: new Set(riskAreas.map((area) => area.id)),
      manuallyIncluded: new Set(),
      manuallyExcluded: new Set(),
      advancedBaselineSelected: true,
    };
  }

  const saved = new Set([...savedCodes].filter((id) => activeCodes.has(id)));
  const selectedAreaIds = new Set(
    riskAreas
      .filter((area) => area.biomarkerIds.length > 0 && area.biomarkerIds.every((id) => saved.has(id)))
      .map((area) => area.id),
  );
  const covered = coveredByAreas(
    {
      selectedAreaIds,
      manuallyIncluded: new Set(),
      manuallyExcluded: new Set(),
      advancedBaselineSelected: false,
    },
    riskAreas,
  );

  return {
    selectedAreaIds,
    manuallyIncluded: new Set([...saved].filter((id) => !covered.has(id))),
    manuallyExcluded: new Set(),
    advancedBaselineSelected: saved.size === activeCodes.size && [...activeCodes].every((id) => saved.has(id)),
  };
}

export function selectAdvancedBaseline(riskAreas: BiomarkerRiskArea[]): RiskAreaSelection {
  return {
    selectedAreaIds: new Set(riskAreas.map((area) => area.id)),
    manuallyIncluded: new Set(),
    manuallyExcluded: new Set(),
    advancedBaselineSelected: true,
  };
}

/** The inverse of Advanced Baseline: leave the doctor with an intentionally
 * empty panel and no lingering area or marker overrides. */
export function clearRiskAreaSelection(): RiskAreaSelection {
  return {
    selectedAreaIds: new Set(),
    manuallyIncluded: new Set(),
    manuallyExcluded: new Set(),
    advancedBaselineSelected: false,
  };
}

export function toggleRiskArea(
  selection: RiskAreaSelection,
  riskAreas: BiomarkerRiskArea[],
  areaId: string,
): RiskAreaSelection {
  const selectedAreaIds = new Set(selection.selectedAreaIds);
  const manuallyExcluded = new Set(selection.manuallyExcluded);
  if (selectedAreaIds.has(areaId)) {
    selectedAreaIds.delete(areaId);
  } else {
    selectedAreaIds.add(areaId);
    // Selecting a coverage area restores every marker that area promises;
    // manually added markers remain explicit fine-tuning choices.
    for (const code of codesForArea(riskAreas, areaId)) manuallyExcluded.delete(code);
  }
  const allCoverageAreasSelected = riskAreas.length > 0 && riskAreas.every((area) => selectedAreaIds.has(area.id));
  return {
    selectedAreaIds,
    manuallyIncluded: new Set(selection.manuallyIncluded),
    manuallyExcluded,
    // Deselecting any one area switches the shortcut off. Conversely, once
    // every coverage area is selected again (with no exclusions), the panel
    // has returned to the complete Advanced Baseline and should say so.
    advancedBaselineSelected: allCoverageAreasSelected && manuallyExcluded.size === 0,
  };
}

/** Apply an explicit final marker state. This is shared by marker, category
 * and search interactions, all of which intentionally break the baseline
 * shortcut while preserving selected risk-area coverage underneath. */
export function setRiskAreaMarkers(
  selection: RiskAreaSelection,
  riskAreas: BiomarkerRiskArea[],
  codes: Iterable<string>,
  on: boolean,
): RiskAreaSelection {
  const covered = coveredByAreas(selection, riskAreas);
  const manuallyIncluded = new Set(selection.manuallyIncluded);
  const manuallyExcluded = new Set(selection.manuallyExcluded);
  for (const code of codes) {
    if (on) {
      if (!covered.has(code)) manuallyIncluded.add(code);
      manuallyExcluded.delete(code);
    } else {
      manuallyIncluded.delete(code);
      if (covered.has(code)) manuallyExcluded.add(code);
      else manuallyExcluded.delete(code);
    }
  }
  return {
    selectedAreaIds: new Set(selection.selectedAreaIds),
    manuallyIncluded,
    manuallyExcluded,
    advancedBaselineSelected: false,
  };
}

export function toggleRiskAreaMarker(
  selection: RiskAreaSelection,
  riskAreas: BiomarkerRiskArea[],
  code: string,
): RiskAreaSelection {
  const selected = selectedCodesForRiskAreas(selection, riskAreas);
  return setRiskAreaMarkers(selection, riskAreas, [code], !selected.has(code));
}
