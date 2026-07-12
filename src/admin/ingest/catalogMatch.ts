// Matches a parsed lab label to a canonical biomarker in the catalog, using an
// alias index plus tiered fuzzy fallback. The catalog (biomarkerData.ts) is the
// source of truth for valid biomarker_code values, so a confident match here is
// what lets the ingest flow pre-fill a commit-ready row.
import { BIOMARKERS } from "../../member-v2/screens/results/biomarkerData";
import type { MatchResult } from "./types";

type Entry = {
  code: string;
  name: string;
  category: string;
  unit: string;
  norm: string;
  tokens: Set<string>;
};

// Lab-name → canonical catalog CODE, for vocabulary the aliases don't cover
// (observed across the sample reports). Mapping to codes (not name strings)
// keeps this deterministic and independent of catalog display-name wording.
// Keys are normalised label text. Only codes that exist in the catalog.
const SYNONYM_CODE: Record<string, string> = {
  "hb": "hemoglobin",
  "haemoglobin hb": "hemoglobin",
  "rbc": "red-blood-cell-count",
  "red cell count rcc": "red-blood-cell-count",
  "red cell count": "red-blood-cell-count",
  "wbc": "white-blood-cell-count",
  "wcc": "white-blood-cell-count",
  "white cell count wcc": "white-blood-cell-count",
  "white cell count": "white-blood-cell-count",
  "white blood cell total": "white-blood-cell-count",
  "pcv": "hematocrit",
  "haematocrit hct pcv": "hematocrit",
  "haematocrit pcv": "hematocrit",
  "glycated hb hba1c": "hemoglobin-a1c-hba1c",
  "glycated haemoglobin hba1c": "hemoglobin-a1c-hba1c",
  "hba1c": "hemoglobin-a1c-hba1c",
  "cholesterol total": "total-cholesterol",
  "hdl chol good": "hdl-cholesterol",
  "ldl chol bad": "ldl-cholesterol",
  "non hdl chol bad": "non-hdl-cholesterol",
  "serum iron": "iron",
  "tibc": "iron-binding-capacity",
  "iron saturation": "iron-percent-saturation",
  "transferrin saturation": "iron-percent-saturation",
  "alk phosphatase alp": "alkaline-phosphatase-alp",
  "vitamin d total 25 oh d2 d3": "vitamin-d",
  "vitamin d total 25 oh d2": "vitamin-d",
  "testosterone total": "total-testosterone",
  "high sensitive c reactive protein": "high-sensitivity-c-reactive-protein-hs-crp",
  "high sensitive c reactive": "high-sensitivity-c-reactive-protein-hs-crp",
  "prostatic specific ag psa": "prostate-specific-antigen-psa-total",
  "dehydroepiandrosterone s dhea s": "dhea-sulfate",
  "estimated gfr ckd epi": "estimated-glomerular-filtration-rate-egfr",
  "egfr": "estimated-glomerular-filtration-rate-egfr",
};

const STOP = new Set([
  "the", "of", "and", "total", "serum", "blood", "count", "test", "level",
  "levels", "profile", "screening", "ratio", "value",
]);

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[（）()]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(norm: string): Set<string> {
  return new Set(norm.split(" ").filter((t) => t.length > 1 && !STOP.has(t)));
}

let INDEX: Entry[] | null = null;
let BY_NORM: Map<string, Entry> | null = null;
let BY_CODE: Map<string, Entry> | null = null;

function buildIndex() {
  if (INDEX) return;
  INDEX = [];
  BY_NORM = new Map();
  BY_CODE = new Map();
  for (const b of BIOMARKERS) {
    const category = (b.categories && b.categories[0]) || b.category || "";
    const unit = (b.unit || "").split(";")[0].trim();
    const names = [b.displayName, b.name, ...(b.aliases || [])].filter(Boolean) as string[];
    const primary: Entry = {
      code: b.id,
      name: b.displayName || b.name,
      category,
      unit,
      norm: normalize(b.displayName || b.name),
      tokens: tokenize(normalize(b.displayName || b.name)),
    };
    BY_CODE.set(b.id, primary);
    const seen = new Set<string>();
    for (const raw of names) {
      const norm = normalize(raw);
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      const entry: Entry = { code: b.id, name: b.displayName || b.name, category, unit, norm, tokens: tokenize(norm) };
      INDEX.push(entry);
      if (!BY_NORM.has(norm)) BY_NORM.set(norm, entry);
    }
  }
}

function dice(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  return (2 * inter) / (a.size + b.size);
}

function unitsAgree(parsed: string | null, catalog: string): boolean {
  if (!parsed || !catalog) return true; // nothing to contradict
  const p = parsed.toLowerCase().replace(/\s+/g, "");
  const c = catalog.toLowerCase().replace(/\s+/g, "");
  if (p === c) return true;
  // Common equivalences across the sample labs.
  const equiv: [RegExp, RegExp][] = [
    [/g\/dl/, /g\/l/],
    [/mil\/cumm|10\^6\/ul/, /x?10\^12\/l/],
    [/tho\/cumm|10\^3\/ul/, /x?10\^9\/l/],
  ];
  for (const [x, y] of equiv) {
    if ((x.test(p) && y.test(c)) || (y.test(p) && x.test(c))) return true;
  }
  return p.includes(c) || c.includes(p);
}

export function matchBiomarker(labelText: string, unit: string | null): MatchResult {
  buildIndex();
  const idx = INDEX!;
  const norm = normalize(labelText);
  const none: MatchResult = {
    code: null, name: labelText, category: null, unit: null, confidence: 0, via: "none", unitMismatch: false,
  };
  if (!norm) return none;

  const finalize = (e: Entry, confidence: number, via: MatchResult["via"]): MatchResult => {
    const agree = unitsAgree(unit, e.unit);
    return {
      code: e.code,
      name: e.name,
      category: e.category,
      unit: e.unit || null,
      confidence: Math.max(0, Math.min(1, confidence + (unit && agree ? 0.05 : 0) - (unit && !agree ? 0.2 : 0))),
      via,
      unitMismatch: !!unit && !agree,
    };
  };

  // 0. Curated synonym → catalog code (highest priority; deterministic).
  const synCode = SYNONYM_CODE[norm];
  if (synCode && BY_CODE!.has(synCode)) return finalize(BY_CODE!.get(synCode)!, 0.95, "alias");

  // 1. Exact normalized name/alias.
  const exact = BY_NORM!.get(norm);
  if (exact) return finalize(exact, 0.95, "alias");

  // Below the substring/fuzzy tiers, require a meaningful label (guards against
  // stray words like "to"/"of"/"blood" that slipped through parsing).
  if (norm.replace(/\s/g, "").length < 4) return none;

  // 2. Normalized substring. Two directions with different trust:
  //  - forward  (the label contains a full catalog alias)  → strong
  //  - reverse  (a catalog alias contains the label)       → only when the
  //    label is itself substantial (2+ tokens), so single common words like
  //    "Blood" or "Protein" from a urine dipstick can't hijack a longer marker.
  const labelTokenCount = norm.split(" ").filter((t) => t.length > 1).length;
  let fwd: Entry | null = null;
  let fwdLen = 0;
  let rev: Entry | null = null;
  let revLen = 0;
  for (const e of idx) {
    if (e.norm.length < 4) continue;
    if (norm.includes(e.norm) && e.norm.length > fwdLen) {
      fwd = e;
      fwdLen = e.norm.length;
    } else if (e.norm.includes(norm) && labelTokenCount >= 2 && norm.length >= 6 && norm.length > revLen) {
      rev = e;
      revLen = norm.length;
    }
  }
  if (fwd) return finalize(fwd, 0.85, "normalized");
  if (rev) return finalize(rev, 0.75, "normalized");

  // 3. Token-overlap fuzzy — needs at least one substantive (3+ char) token.
  const tokens = tokenize(norm);
  const hasSubstantive = [...tokens].some((t) => t.length >= 3);
  if (hasSubstantive) {
    let bestScore = 0;
    let bestEntry: Entry | null = null;
    for (const e of idx) {
      const score = dice(tokens, e.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestEntry = e;
      }
    }
    if (bestEntry && bestScore >= 0.5) {
      return finalize(bestEntry, 0.4 + bestScore * 0.35, "fuzzy");
    }
  }

  return none;
}
