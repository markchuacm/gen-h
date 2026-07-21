import { useEffect, useState } from "react";
import { apiError, apiRequest } from "../apiClient";
import type {
  Biomarker,
  BiomarkerCategory,
  ContextRequirement,
  Directionality,
  ScoringMode,
} from "../../member-v2/screens/results/types";

// The biomarker catalog used to be a bundled constant every screen imported.
// It now comes from app.biomarkers, so retiring a marker is an admin toggle
// rather than a deploy. Five screens need it, so the fetch is cached at module
// level and shared: it is reference data, identical for every actor, and it
// does not change within a session.

type CatalogRow = {
  id: string;
  name: string;
  display_name: string;
  aliases: string[];
  description: string;
  what_it_measures: string;
  why_it_matters: string;
  unit: string;
  scoring_mode: ScoringMode;
  context_requirements: ContextRequirement[];
  optimal_range_label: string;
  suboptimal_range_label: string;
  out_of_range_label: string;
  lower_optimal: string | number | null;
  upper_optimal: string | number | null;
  lower_reference: string | number | null;
  upper_reference: string | number | null;
  directionality: Directionality;
  categories: string[];
};

type CategoryRow = { id: string; name: string; description: string; display_order: number };
type RiskAreaRow = {
  id: string;
  name: string;
  description: string;
  display_order: number;
  biomarker_ids: string[];
};

export type BiomarkerRiskArea = {
  id: string;
  name: string;
  description: string;
  biomarkerIds: string[];
};

export type BiomarkerCatalog = {
  categories: BiomarkerCategory[];
  /** Clinical coverage areas for the doctor panel builder. Advanced Baseline
      is deliberately a UI shortcut for the full active catalog, not a row. */
  riskAreas: BiomarkerRiskArea[];
  biomarkers: Biomarker[];
  byCode: Map<string, Biomarker>;
  /** Codes deliberately taken out of the panel. A result row for one of these
      is dropped rather than shown as an unrecognised extra. */
  retiredCodes: Set<string>;
};

/** pg returns `numeric` as a string to avoid precision loss; the dashboard's
    range maths needs real numbers. */
function num(value: string | number | null): number | null {
  if (value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBiomarker(row: CatalogRow): Biomarker {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    category: row.categories[0] ?? "",
    categories: row.categories,
    aliases: row.aliases,
    description: row.description,
    whatItMeasures: row.what_it_measures,
    whyItMatters: row.why_it_matters,
    unit: row.unit,
    scoringMode: row.scoring_mode,
    contextRequirements: row.context_requirements,
    optimalRangeLabel: row.optimal_range_label,
    suboptimalRangeLabel: row.suboptimal_range_label,
    outOfRangeLabel: row.out_of_range_label,
    lowerOptimal: num(row.lower_optimal),
    upperOptimal: num(row.upper_optimal),
    lowerReference: num(row.lower_reference),
    upperReference: num(row.upper_reference),
    directionality: row.directionality,
    // Patient state never comes from the catalog; results are merged in later.
    status: "not_available",
    latestValue: null,
    latestDate: null,
    historicalValues: [],
  };
}

let inflight: Promise<BiomarkerCatalog> | null = null;

async function fetchCatalog(): Promise<BiomarkerCatalog> {
  const { data } = await apiRequest<{
    data: {
      categories: CategoryRow[];
      riskAreas: RiskAreaRow[];
      biomarkers: CatalogRow[];
      retiredCodes: string[];
    };
  }>("/v1/catalog/biomarkers");

  const biomarkers = data.biomarkers.map(toBiomarker);
  const byCode = new Map(biomarkers.map((marker) => [marker.id, marker]));
  const byCategory = new Map<string, string[]>();
  for (const marker of biomarkers) {
    for (const name of marker.categories) {
      const bucket = byCategory.get(name);
      if (bucket) bucket.push(marker.id);
      else byCategory.set(name, [marker.id]);
    }
  }

  return {
    categories: data.categories.map((category) => ({
      name: category.name,
      description: category.description,
      biomarkerIds: byCategory.get(category.name) ?? [],
    })),
    riskAreas: data.riskAreas.map((area) => ({
      id: area.id,
      name: area.name,
      description: area.description,
      biomarkerIds: area.biomarker_ids.filter((id) => byCode.has(id)),
    })),
    biomarkers,
    byCode,
    retiredCodes: new Set(data.retiredCodes),
  };
}

/** Shared, cached catalog fetch. Safe to call from anywhere; only the first
    call hits the network. */
export function loadCatalog(): Promise<BiomarkerCatalog> {
  inflight ??= fetchCatalog().catch((error) => {
    // Don't cache a failure — a transient network error would otherwise leave
    // every screen permanently empty for the rest of the session.
    inflight = null;
    throw error;
  });
  return inflight;
}

/** Call after an admin activates or deactivates a marker so the doctor and
    member views pick up the change without a reload. */
export function invalidateCatalog(): void {
  inflight = null;
}

const EMPTY: BiomarkerCatalog = {
  categories: [],
  riskAreas: [],
  biomarkers: [],
  byCode: new Map(),
  retiredCodes: new Set(),
};

export function useBiomarkerCatalog(): {
  loading: boolean;
  error: string | null;
  catalog: BiomarkerCatalog;
} {
  const [state, setState] = useState<{ loading: boolean; error: string | null; catalog: BiomarkerCatalog }>({
    loading: true,
    error: null,
    catalog: EMPTY,
  });

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then((catalog) => {
        if (!cancelled) setState({ loading: false, error: null, catalog });
      })
      .catch((error) => {
        if (!cancelled) setState({ loading: false, error: apiError(error), catalog: EMPTY });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
