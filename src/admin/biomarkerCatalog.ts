import { loadCatalog } from "../lib/api/catalog";

// Lightweight lookup over the biomarker catalog, used to keep admin-entered
// biomarker codes valid and to autofill name/category/unit. app.biomarkers is
// the source of truth for valid `biomarker_code` values.

export type CatalogEntry = {
  code: string;
  name: string;
  category: string;
  unit: string;
};

let entries: CatalogEntry[] = [];
let byCode = new Map<string, CatalogEntry>();

/** Prime the lookup. Call once before rendering anything that reads it. */
export async function ensureCatalogIndex(): Promise<CatalogEntry[]> {
  const catalog = await loadCatalog();
  entries = catalog.biomarkers
    .map((b) => ({
      code: b.id,
      name: b.displayName || b.name,
      category: b.category,
      // The catalog's unit field can carry alternates ("x10^9/L; %"); take the first.
      unit: (b.unit || "").split(";")[0].trim(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  byCode = new Map(entries.map((e) => [e.code, e]));
  return entries;
}

/** Synchronous view of the primed index; empty until ensureCatalogIndex resolves. */
export function biomarkerCatalog(): CatalogEntry[] {
  return entries;
}

export function catalogLookup(code: string): CatalogEntry | undefined {
  return byCode.get(code);
}
