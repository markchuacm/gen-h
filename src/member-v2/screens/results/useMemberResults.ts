import { useEffect, useState } from "react";
import { fetchLabOrder } from "../../../lib/api/labOrder";
import { fetchMemberProfile } from "../../../lib/api/memberProfile";
import { fetchReleasedReports } from "../../../lib/api/results";
import type { BiomarkerResultRow, LabReportRow } from "../../../lib/api/results";
import { BIOMARKER_CATEGORIES, BIOMARKERS } from "./biomarkerData";
import type { Biomarker, BiomarkerCategory, HistoricalValue } from "./types";

const OTHER_CATEGORY = "Other results";

export type MemberResults = {
  loading: boolean;
  error: string | null;
  biomarkers: Biomarker[];
  categories: BiomarkerCategory[];
  /** From member_profiles; null until loaded or when onboarding skipped it. */
  age: number | null;
  sex: "male" | "female" | null;
  hasResults: boolean;
  hasOrder: boolean;
};

/** Catalog entry with the demo values stripped — the shipped baseline is
    "not tested yet" for every marker. */
function bareCatalogEntry(entry: Biomarker): Biomarker {
  return {
    ...entry,
    status: "not_available",
    latestValue: null,
    latestDate: null,
    historicalValues: [],
  };
}

function syntheticEntry(row: BiomarkerResultRow): Biomarker {
  return {
    id: row.biomarker_code,
    name: row.biomarker_name ?? row.biomarker_code,
    displayName: row.biomarker_name ?? row.biomarker_code,
    category: row.category ?? OTHER_CATEGORY,
    categories: [row.category ?? OTHER_CATEGORY],
    aliases: [],
    description: "",
    whatItMeasures: "",
    whyItMatters: "",
    unit: row.unit ?? "",
    ruleType: "NUMERIC_FIXED",
    optimalRangeLabel: "",
    suboptimalRangeLabel: "",
    outOfRangeLabel: "",
    lowerOptimal: row.optimal_low,
    upperOptimal: row.optimal_high,
    lowerReference: row.ref_low,
    upperReference: row.ref_high,
    directionality: "range_based",
    status: row.status,
    latestValue: null,
    latestDate: null,
    historicalValues: [],
  };
}

/** Merge released biomarker rows (reports ordered oldest→newest) into the
    static catalog: newest value becomes latest, older numeric values become
    trend history, admin-entered ranges override catalog defaults. */
export function mergeResults(reports: LabReportRow[]): {
  biomarkers: Biomarker[];
  categories: BiomarkerCategory[];
} {
  const merged = new Map<string, Biomarker>(
    BIOMARKERS.map((entry) => [entry.id, bareCatalogEntry(entry)]),
  );
  const extraIds: string[] = [];

  for (const report of reports) {
    for (const row of report.biomarker_results) {
      let entry = merged.get(row.biomarker_code);
      if (!entry) {
        entry = syntheticEntry(row);
        merged.set(row.biomarker_code, entry);
        extraIds.push(row.biomarker_code);
      }

      // Reports are ordered oldest→newest: push the previous latest into
      // history, then take this row as latest.
      const history: HistoricalValue[] = [...entry.historicalValues];
      if (typeof entry.latestValue === "number" && entry.latestDate) {
        history.push({ value: entry.latestValue, testDate: entry.latestDate });
      }

      merged.set(row.biomarker_code, {
        ...entry,
        status: row.status,
        latestValue: row.value_numeric ?? row.value_text,
        latestDate: report.collected_at,
        historicalValues: history,
        unit: row.unit ?? entry.unit,
        lowerOptimal: row.optimal_low ?? entry.lowerOptimal,
        upperOptimal: row.optimal_high ?? entry.upperOptimal,
        lowerReference: row.ref_low ?? entry.lowerReference,
        upperReference: row.ref_high ?? entry.upperReference,
      });
    }
  }

  // Unknown codes render in their own category (or an existing one when the
  // admin-entered category matches a catalog category name).
  const categories: BiomarkerCategory[] = BIOMARKER_CATEGORIES.map((category) => ({
    ...category,
    biomarkerIds: [...category.biomarkerIds],
  }));
  const byName = new Map(categories.map((category) => [category.name, category]));
  const other: BiomarkerCategory = {
    name: OTHER_CATEGORY,
    description: "Additional markers reported by your lab.",
    biomarkerIds: [],
  };
  for (const id of extraIds) {
    const home = byName.get(merged.get(id)!.category) ?? other;
    home.biomarkerIds.push(id);
  }
  if (other.biomarkerIds.length > 0) categories.push(other);

  return { biomarkers: [...merged.values()], categories };
}

/** Until a released measurement exists, keep the full educational catalog
    visible with empty values so every pre-results member can explore it. Once
    measurements arrive, use the ordered panel plus measured admin-added extras. */
export function constrainToPanel(
  categories: BiomarkerCategory[],
  biomarkers: Biomarker[],
  orderedCodes: string[] | null,
): BiomarkerCategory[] {
  const measured = biomarkers.filter((entry) => entry.latestValue !== null && entry.latestValue !== "");
  if (measured.length === 0) return categories;

  const panel = new Set(orderedCodes ?? []);
  for (const entry of measured) panel.add(entry.id);

  return categories
    .map((category) => ({
      ...category,
      biomarkerIds: category.biomarkerIds.filter((id) => panel.has(id)),
    }))
    .filter((category) => category.biomarkerIds.length > 0);
}

/** Pass memberId to load a specific member's results (a doctor viewing an
    assigned case); omit it for the signed-in member's own results. */
export function useMemberResults(memberId?: string): MemberResults {
  const [results, setResults] = useState<MemberResults>({
    loading: true,
    error: null,
    biomarkers: [],
    categories: BIOMARKER_CATEGORIES,
    age: null,
    sex: null,
    hasResults: false,
    hasOrder: false,
  });

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchReleasedReports(memberId),
      fetchMemberProfile(memberId),
      fetchLabOrder(memberId),
    ]).then(([reports, memberProfile, order]) => {
      if (cancelled) return;
      if (reports.error) {
        setResults((current) => ({
          ...current,
          loading: false,
          error: reports.error!.message,
          biomarkers: BIOMARKERS.map(bareCatalogEntry),
        }));
        return;
      }
      const { biomarkers, categories } = mergeResults(reports.data ?? []);
      const orderedCodes = order.data ? order.data.biomarker_codes : null;
      const sexRaw = memberProfile.data?.sex?.toLowerCase();
      setResults({
        loading: false,
        error: null,
        biomarkers,
        categories: constrainToPanel(categories, biomarkers, orderedCodes),
        age: memberProfile.data?.age ?? null,
        sex: sexRaw === "male" || sexRaw === "female" ? sexRaw : null,
        hasResults: (reports.data ?? []).some((report) => report.biomarker_results.length > 0),
        hasOrder: order.data !== null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  return results;
}
