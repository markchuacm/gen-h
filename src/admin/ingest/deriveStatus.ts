// Derives an admin biomarker status (optimal / at_risk / needs_attention) plus
// resolved optimal & reference bounds from the catalog's range labels — a port
// of the member dashboard's range logic (ResultsDashboard.tsx: splitRange­
// Expression / parseRangeBranch / branchMatchesContext / statusFromResolved­
// Range) so the ingested draft and the member view agree. Kept as pure
// functions (no React/context) and reduced to the admin 3-value enum.
import type { Biomarker } from "../../member-v2/screens/results/types";

export type AdminStatus = "optimal" | "at_risk" | "needs_attention";

export type RangeCtx = { sex: "male" | "female"; age: number };

export type DerivedStatus = {
  status: AdminStatus;
  optimalLow: number | null;
  optimalHigh: number | null;
  refLow: number | null;
  refHigh: number | null;
};

type Branch = {
  label: string;
  lower: number | null;
  upper: number | null;
  lowerInclusive: boolean;
  upperInclusive: boolean;
  comparator: "range" | "lower" | "upper" | "qualitative";
};

/** The catalog is fetched now, so callers pass it in. ingestPipeline primes it
    once and threads it through. */
let BY_CODE: Map<string, Biomarker> = new Map();
export function setDeriveStatusCatalog(catalogByCode: Map<string, Biomarker>): void {
  BY_CODE = catalogByCode;
}
function catalog(code: string): Biomarker | undefined {
  return BY_CODE.get(code);
}

function splitExpression(label: string): string[] {
  return label.split(";").map((p) => p.trim()).filter(Boolean);
}

function parseBranch(label: string): Branch {
  const compact = label.replace(/\s/g, "");
  if (!compact) {
    return {
      label,
      lower: null,
      upper: null,
      lowerInclusive: false,
      upperInclusive: false,
      comparator: "qualitative",
    };
  }

  const upper = compact.match(/^(<=|<)(\d+(?:\.\d+)?)$/);
  if (upper) {
    return {
      label,
      lower: null,
      upper: Number(upper[2]),
      lowerInclusive: false,
      upperInclusive: upper[1] === "<=",
      comparator: "upper",
    };
  }

  const lower = compact.match(/^(>=|>)(\d+(?:\.\d+)?)$/);
  if (lower) {
    return {
      label,
      lower: Number(lower[2]),
      upper: null,
      lowerInclusive: lower[1] === ">=",
      upperInclusive: false,
      comparator: "lower",
    };
  }

  const range = compact.match(/^([<>]=?)?(\d+(?:\.\d+)?)-([<>]=?)?(\d+(?:\.\d+)?)$/);
  if (range) {
    return {
      label,
      lower: Number(range[2]),
      upper: Number(range[4]),
      lowerInclusive: range[1] !== ">",
      upperInclusive: range[3] !== "<",
      comparator: "range",
    };
  }

  return {
    label,
    lower: null,
    upper: null,
    lowerInclusive: false,
    upperInclusive: false,
    comparator: "qualitative",
  };
}

function branchMatchesContext(branchKey: string, ctx: RangeCtx): boolean {
  const key = branchKey.trim().toLowerCase();
  if (!key) return true;
  if (key === "m") return ctx.sex === "male";
  if (key === "f") return ctx.sex === "female";
  if (key === "am" || key === "pm") return true; // sample timing unknown at ingest
  const sexAge = key.match(/^([mf])(\d+)(?:-(\d+)|\+)$/);
  if (sexAge) {
    const [, sexKey, minAge, maxAge] = sexAge;
    const sexMatches = sexKey === "m" ? ctx.sex === "male" : ctx.sex === "female";
    const min = Number(minAge);
    const max = maxAge ? Number(maxAge) : Infinity;
    return sexMatches && ctx.age >= min && ctx.age <= max;
  }
  return false;
}

function pickBranch(label: string, ctx: RangeCtx): string {
  const branches = splitExpression(label);
  if (branches.length === 0) return "";
  const keyed = branches
    .map((b) => {
      const [key, ...rest] = b.split(":");
      return rest.length > 0 ? { key: key.trim(), value: rest.join(":").trim() } : null;
    })
    .filter((b): b is { key: string; value: string } => Boolean(b));
  if (keyed.length === 0) return branches[0];
  const matches = keyed.filter((b) => branchMatchesContext(b.key, ctx));
  if (matches.length === 0) return keyed[0]?.value ?? branches[0];
  return matches.map((b) => b.value).join("; ");
}

function resolveBranch(label: string | null | undefined, ctx: RangeCtx): Branch | null {
  if (!label) return null;
  const picked = pickBranch(label, ctx);
  return picked ? parseBranch(picked) : null;
}

function statusFromRange(
  value: number,
  optimal: Branch | null,
  outOfRange: Branch | null,
): AdminStatus {
  if (optimal?.comparator === "range" && optimal.lower !== null && optimal.upper !== null) {
    if (
      (value > optimal.lower || (optimal.lowerInclusive && value === optimal.lower)) &&
      (value < optimal.upper || (optimal.upperInclusive && value === optimal.upper))
    ) return "optimal";
  }
  if (optimal?.comparator === "upper" && optimal.upper !== null && (value < optimal.upper || (optimal.upperInclusive && value === optimal.upper))) return "optimal";
  if (optimal?.comparator === "lower" && optimal.lower !== null && (value > optimal.lower || (optimal.lowerInclusive && value === optimal.lower))) return "optimal";

  if (outOfRange?.comparator === "range" && outOfRange.lower !== null && outOfRange.upper !== null) {
    if (
      (value > outOfRange.lower || (outOfRange.lowerInclusive && value === outOfRange.lower)) &&
      (value < outOfRange.upper || (outOfRange.upperInclusive && value === outOfRange.upper))
    ) return "needs_attention";
  }
  if (outOfRange?.comparator === "upper" && outOfRange.upper !== null && (value < outOfRange.upper || (outOfRange.upperInclusive && value === outOfRange.upper))) return "needs_attention";
  if (outOfRange?.comparator === "lower" && outOfRange.lower !== null && (value > outOfRange.lower || (outOfRange.lowerInclusive && value === outOfRange.lower))) return "needs_attention";

  return "at_risk";
}

/**
 * Derive status + resolved bounds for a value against the catalog entry.
 * `pdfRef` (the reference range parsed from the report itself) wins for the
 * committed ref_low/high; the catalog supplies optimal bounds. When the marker
 * isn't in the catalog, falls back to the lab's own flag and reference range.
 */
export function deriveStatus(
  code: string | null,
  value: number | null,
  ctx: RangeCtx,
  pdfRef: { refLow: number | null; refHigh: number | null; comparator: "range" | "lt" | "gt" | null },
  labFlag: "high" | "low" | "critical" | null,
): DerivedStatus {
  const bm = code ? catalog(code) : undefined;

  // Resolve committed reference bounds: prefer the report's own parsed range.
  let refLow = pdfRef.refLow;
  let refHigh = pdfRef.refHigh;

  let optimalLow: number | null = null;
  let optimalHigh: number | null = null;

  if (bm) {
    const optimal = resolveBranch(bm.optimalRangeLabel, ctx);
    const outOfRange = resolveBranch(bm.outOfRangeLabel, ctx);
    optimalLow = optimal?.lower ?? bm.lowerOptimal ?? null;
    optimalHigh = optimal?.upper ?? bm.upperOptimal ?? null;
    if (refLow == null && refHigh == null) {
      refLow = bm.lowerReference ?? null;
      refHigh = bm.upperReference ?? null;
    }
    if (value != null) {
      return { status: statusFromRange(value, optimal, outOfRange), optimalLow, optimalHigh, refLow, refHigh };
    }
  }

  // No catalog match (or no numeric value): fall back to the lab's own signal.
  const status: AdminStatus = fallbackStatus(value, refLow, refHigh, labFlag);
  return { status, optimalLow, optimalHigh, refLow, refHigh };
}

function fallbackStatus(
  value: number | null,
  refLow: number | null,
  refHigh: number | null,
  labFlag: "high" | "low" | "critical" | null,
): AdminStatus {
  if (labFlag === "critical") return "needs_attention";
  if (labFlag === "high" || labFlag === "low") return "at_risk";
  if (value != null) {
    if (refHigh != null && value > refHigh) return "at_risk";
    if (refLow != null && value < refLow) return "at_risk";
  }
  return "optimal";
}
