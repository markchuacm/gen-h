import { BIOMARKERS } from "../member-v2/screens/results/biomarkerData";

// Lightweight lookup over the frontend biomarker catalog, used to keep admin-
// entered biomarker codes valid and to autofill name/category/unit. The catalog
// (biomarkerData.ts) is the source of truth for valid `biomarker_code` values.

export type CatalogEntry = {
  code: string;
  name: string;
  category: string;
  unit: string;
};

export const BIOMARKER_CATALOG: CatalogEntry[] = BIOMARKERS.map((b) => ({
  code: b.id,
  name: b.displayName || b.name,
  category: b.category,
  // The catalog's unit field can carry alternates ("x10^9/L; %"); take the first.
  unit: (b.unit || "").split(";")[0].trim(),
})).sort((a, b) => a.name.localeCompare(b.name));

const BY_CODE = new Map(BIOMARKER_CATALOG.map((e) => [e.code, e]));

export function catalogLookup(code: string): CatalogEntry | undefined {
  return BY_CODE.get(code);
}
