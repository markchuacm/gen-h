// Orchestrates the ingest core: File → extracted lines → parsed measurements →
// catalog matches → derived status → review-ready IngestRows. Everything the
// review UI needs is precomputed here so the table can render (and re-run a
// single row) without re-touching pdf.js.
import type { BiomarkerInput } from "../../lib/api/admin";
import { extractLines, type ExtractProgress } from "./pdfExtract";
import { parseLines } from "./labParser";
import { matchBiomarker, setMatchCatalog } from "./catalogMatch";
import { catalogLookup, ensureCatalogIndex } from "../biomarkerCatalog";
import { deriveStatus, setDeriveStatusCatalog, type RangeCtx } from "./deriveStatus";
import type { IngestRow, ParsedLine } from "./types";
import { loadCatalog } from "../../lib/api/catalog";

let rowSeq = 0;
const nextId = () => `row-${rowSeq++}`;

/** Build one review row from a parsed line: match → status → commit-ready input. */
export function buildRow(parsed: ParsedLine, ctx: RangeCtx): IngestRow {
  const match = matchBiomarker(parsed.labelText, parsed.unit);
  const value = parsed.value;

  const derived = deriveStatus(
    match.code,
    value,
    ctx,
    { refLow: parsed.refLow, refHigh: parsed.refHigh, comparator: parsed.refComparator },
    parsed.labFlag,
  );

  const input: BiomarkerInput = {
    biomarker_code: match.code ?? "",
    biomarker_name: match.name || parsed.labelText || null,
    category: match.category,
    value_numeric: value,
    value_text: value == null ? parsed.valueText : null,
    unit: parsed.unit ?? match.unit,
    ref_low: derived.refLow,
    ref_high: derived.refHigh,
    optimal_low: derived.optimalLow,
    optimal_high: derived.optimalHigh,
    status: derived.status,
    notes: null,
  };

  const warnings: string[] = [];
  if (!match.code) warnings.push("No catalog match — pick a code or exclude");
  else if (match.confidence < 0.5) warnings.push("Low-confidence match — verify");
  if (match.unitMismatch) warnings.push(`Unit differs from catalog (${match.unit ?? "—"})`);

  return {
    id: nextId(),
    // Default to including only confident, matched, numeric rows; the rest are
    // present but unchecked so the admin opts them in deliberately.
    include: !!match.code && match.confidence >= 0.5 && (value != null || !!parsed.valueText),
    parsed,
    match,
    input,
    warnings,
  };
}

/** Re-derive a row's status/bounds after the admin picks a code by hand. Reuses
    catalog metadata for the chosen code; keeps the parsed value/unit/ref. */
export function rebuildForCode(row: IngestRow, code: string, ctx: RangeCtx): IngestRow {
  const info = code ? catalogLookup(code) : undefined;
  const derived = deriveStatus(
    code || null,
    row.parsed.value,
    ctx,
    { refLow: row.parsed.refLow, refHigh: row.parsed.refHigh, comparator: row.parsed.refComparator },
    row.parsed.labFlag,
  );
  const input: BiomarkerInput = {
    ...row.input,
    biomarker_code: code,
    biomarker_name: info?.name ?? row.input.biomarker_name,
    category: info?.category ?? row.input.category,
    unit: row.parsed.unit ?? info?.unit ?? row.input.unit,
    ref_low: derived.refLow,
    ref_high: derived.refHigh,
    optimal_low: derived.optimalLow,
    optimal_high: derived.optimalHigh,
    status: derived.status,
  };
  return { ...row, input, warnings: code ? [] : ["No catalog match — pick a code or exclude"] };
}

export type IngestResult = { rows: IngestRow[]; unmatched: string[] };

/** Load the catalog into the matcher and the status deriver. Must resolve
    before buildRow or rebuildForCode are called. */
export async function primeIngestCatalog(): Promise<void> {
  const catalog = await loadCatalog();
  setMatchCatalog(catalog.biomarkers);
  setDeriveStatusCatalog(catalog.byCode);
  await ensureCatalogIndex();
}

export async function runIngest(
  file: File,
  ctx: RangeCtx,
  onProgress?: ExtractProgress,
): Promise<IngestResult> {
  // Matching and status derivation both read the catalog; prime them once
  // here, the single place the ingest pipeline is entered.
  await primeIngestCatalog();

  const lines = await extractLines(file, onProgress);
  const parsed = parseLines(lines);

  const rows: IngestRow[] = [];
  const unmatched: string[] = [];
  const seenCode = new Map<string, IngestRow>();

  for (const p of parsed) {
    const row = buildRow(p, ctx);
    if (!row.match.code) {
      unmatched.push(p.raw);
      continue;
    }
    // Deduplicate by code: keep the highest-confidence occurrence.
    const prior = seenCode.get(row.match.code);
    if (prior) {
      if (row.match.confidence > prior.match.confidence) {
        prior.include = false;
        prior.warnings = [...prior.warnings, "Duplicate — superseded"];
        seenCode.set(row.match.code, row);
        rows.push(row);
      } else {
        row.include = false;
        row.warnings.push("Duplicate — superseded");
        rows.push(row);
      }
    } else {
      seenCode.set(row.match.code, row);
      rows.push(row);
    }
  }

  return { rows, unmatched };
}
