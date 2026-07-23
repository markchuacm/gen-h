import { createContext, useContext, useMemo, useState } from "react";
import { ChevronRight, Search, Stethoscope, X } from "lucide-react";
import PendingPortalDialog from "../../shell/PendingPortalDialog";
import { useMemberResults } from "./useMemberResults";
import type { Biomarker, BiomarkerCategory, BiomarkerStatus, ContextRequirement, HistoricalValue } from "./types";
import "./results.css";

type FilterId = "all" | "optimal" | "at_risk" | "needs_attention" | "not_tested";

type ResultKind = "measured" | "awaiting" | "contextual";

type PatientRangeContext = {
  sex: "male" | "female";
  age: number;
  cyclePhase?: "follicular" | "ovulation" | "luteal" | "postmenopause";
  sampleTiming?: "am" | "pm";
};

type ParsedRangeBranch = {
  label: string;
  lower: number | null;
  upper: number | null;
  lowerInclusive: boolean;
  upperInclusive: boolean;
  comparator: "range" | "lower" | "upper" | "qualitative";
};

type ResolvedRangeContext = {
  unit: string;
  directionality: Biomarker["directionality"];
  lowerOptimal: number | null;
  upperOptimal: number | null;
  lowerReference: number | null;
  upperReference: number | null;
  optimalLabel: string;
  suboptimalLabel: string;
  outOfRangeLabel: string;
  contextLabel: string;
  status: BiomarkerStatus;
  kind: ResultKind;
  isQualitative: boolean;
};

type StatusMeta = {
  label: string;
  shortLabel: string;
  className: string;
};

type OverviewCounts = {
  optimal: number;
  at_risk: number;
  needs_attention: number;
  awaiting: number;
  contextual: number;
};

const STATUS_META: Record<BiomarkerStatus, StatusMeta> = {
  optimal: { label: "Optimal", shortLabel: "Optimal", className: "status--optimal" },
  at_risk: { label: "At risk", shortLabel: "At risk", className: "status--at-risk" },
  needs_attention: {
    label: "Out of range",
    shortLabel: "Out of range",
    className: "status--needs-attention",
  },
  not_available: { label: "Not tested", shortLabel: "—", className: "status--not-available" },
};

const KIND_PILL_LABEL: Record<Exclude<ResultKind, "measured">, string> = {
  awaiting: "Not tested",
  contextual: "Doctor reviewed",
};

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All markers" },
  { id: "optimal", label: "Optimal" },
  { id: "at_risk", label: "At risk" },
  { id: "needs_attention", label: "Out of range" },
  { id: "not_tested", label: "Not tested" },
];

const DEFAULT_RANGE_CONTEXT: PatientRangeContext = {
  sex: "male",
  age: 36,
  sampleTiming: "am",
  cyclePhase: "follicular",
};

// Sex/age come from member_profiles once loaded; components below read the
// member's context from here instead of prop-threading through every level.
const RangeContext = createContext<PatientRangeContext>(DEFAULT_RANGE_CONTEXT);

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function resultKind(biomarker: Biomarker): ResultKind {
  if (biomarker.latestValue === null || biomarker.latestValue === "") return "awaiting";
  if (biomarker.optimalRangeLabel === "CONTEXT_REQUIRED") return "contextual";
  return "measured";
}

// collected_at can arrive as a bare date ("2026-01-15") or a full ISO
// datetime, depending on the source — normalize before formatting so an
// already-timestamped value doesn't get "T00:00:00" appended onto it.
function toDate(value: string): Date {
  return new Date(value.includes("T") ? value : `${value}T00:00:00`);
}

function formatDate(value: string | null) {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

function formatFullDate(value: string | null) {
  if (!value) return "";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function formatValue(biomarker: Biomarker) {
  if (resultKind(biomarker) !== "measured") return "—";
  const { latestValue } = biomarker;
  if (latestValue === null || latestValue === "") return "—";
  if (typeof latestValue === "number") return latestValue.toLocaleString("en-US");
  return latestValue;
}

function formatUnit(unit: string) {
  const superscripts: Record<string, string> = {
    "-": "⁻",
    "0": "⁰",
    "1": "¹",
    "2": "²",
    "3": "³",
    "4": "⁴",
    "5": "⁵",
    "6": "⁶",
    "7": "⁷",
    "8": "⁸",
    "9": "⁹",
  };

  return unit.replace(/x10\^(-?\d+)/g, (_, exponent: string) => {
    const superscript = exponent
      .split("")
      .map((character) => superscripts[character] ?? character)
      .join("");
    return `×10${superscript}`;
  });
}

function formatValueWithUnit(biomarker: Biomarker) {
  const value = formatValue(biomarker);
  if (value === "—" || !biomarker.unit) return value;
  return `${value} ${formatUnit(biomarker.unit)}`;
}

function refineRangeText(text: string) {
  return text
    .replace(/>=\s*/g, "≥ ")
    .replace(/<=\s*/g, "≤ ")
    .replace(/([<>])\s*(?=[\d.])/g, "$1 ")
    .replace(/(\d)\s*-\s*(?=[\d.])/g, "$1–");
}

function formatRangeLabel(label: string, unit: string) {
  if (!label || label.includes("CONTEXT_REQUIRED")) return "";
  if (label.toLowerCase().startsWith("outside ")) return label;
  const refined = refineRangeText(label);
  return unit ? `${refined} ${formatUnit(unit)}` : refined;
}

function formatContextLabel(context: PatientRangeContext, requirements: ContextRequirement[] = []) {
  const sex = context.sex === "male" ? "male" : "female";
  const parts: string[] = [];
  const needsSex = requirements.includes("sex");
  const needsAge = requirements.includes("age");
  const needsTime = requirements.includes("sample_timing");
  const needsCycle = requirements.includes("cycle_phase");

  if (needsAge && needsSex) parts.push(`${context.age}-year-old ${sex}`);
  else if (needsAge) parts.push(`${context.age} years old`);
  else if (needsSex) parts.push(sex);
  else parts.push(`${context.age}-year-old ${sex}`);

  if (needsCycle && context.cyclePhase) parts.push(context.cyclePhase);
  if (needsTime && context.sampleTiming) parts.push(`${context.sampleTiming.toUpperCase()} sample`);

  return parts.join(", ");
}

function matchesSearch(biomarker: Biomarker, query: string) {
  if (!query) return true;
  const haystack = [biomarker.name, biomarker.displayName, ...biomarker.aliases].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function panelEntries(categories: BiomarkerCategory[]) {
  const seen = new Set<string>();
  return categories.flatMap((category) => category.biomarkerIds.flatMap((biomarkerId) => {
    if (seen.has(biomarkerId)) return [];
    seen.add(biomarkerId);
    return [{ category: category.name, biomarkerId }];
  }));
}

function statusCounts(
  categories: BiomarkerCategory[],
  biomarkerById: Map<string, Biomarker>,
  context: PatientRangeContext,
): OverviewCounts {
  return panelEntries(categories).reduce<OverviewCounts>(
    (acc, entry) => {
      const biomarker = biomarkerById.get(entry.biomarkerId);
      if (!biomarker) {
        acc.awaiting += 1;
        return acc;
      }
      const rangeContext = resolveRangeContext(biomarker, context);
      if (rangeContext.kind === "contextual") acc.contextual += 1;
      else if (
        rangeContext.kind === "measured" &&
        (rangeContext.status === "optimal" ||
          rangeContext.status === "at_risk" ||
          rangeContext.status === "needs_attention")
      ) {
        acc[rangeContext.status] += 1;
      } else acc.awaiting += 1;
      return acc;
    },
    { optimal: 0, at_risk: 0, needs_attention: 0, awaiting: 0, contextual: 0 },
  );
}

function splitRangeExpression(label: string) {
  return label
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseRangeBranch(label: string): ParsedRangeBranch {
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

  const upperMatch = compact.match(/^(<=|<)(\d+(?:\.\d+)?)$/);
  if (upperMatch) {
    return {
      label,
      lower: null,
      upper: Number(upperMatch[2]),
      lowerInclusive: false,
      upperInclusive: upperMatch[1] === "<=",
      comparator: "upper",
    };
  }

  const lowerMatch = compact.match(/^(>=|>)(\d+(?:\.\d+)?)$/);
  if (lowerMatch) {
    return {
      label,
      lower: Number(lowerMatch[2]),
      upper: null,
      lowerInclusive: lowerMatch[1] === ">=",
      upperInclusive: false,
      comparator: "lower",
    };
  }

  const rangeMatch = compact.match(/^([<>]=?)?(\d+(?:\.\d+)?)-([<>]=?)?(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return {
      label,
      lower: Number(rangeMatch[2]),
      upper: Number(rangeMatch[4]),
      lowerInclusive: rangeMatch[1] !== ">",
      upperInclusive: rangeMatch[3] !== "<",
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

function branchMatchesContext(branchKey: string, context: PatientRangeContext) {
  const key = branchKey.trim().toLowerCase();
  if (!key) return true;

  if (key === "m") return context.sex === "male";
  if (key === "f") return context.sex === "female";
  if (key === "am") return context.sampleTiming === "am";
  if (key === "pm") return context.sampleTiming === "pm";
  if (key === "follicular" || key === "ovulation" || key === "luteal" || key === "postmenopause") {
    return context.cyclePhase === key;
  }

  const sexAge = key.match(/^([mf])(\d+)(?:-(\d+)|\+)$/);
  if (sexAge) {
    const [, sexKey, minAge, maxAge] = sexAge;
    const sexMatches = sexKey === "m" ? context.sex === "male" : context.sex === "female";
    const min = Number(minAge);
    const max = maxAge ? Number(maxAge) : Infinity;
    return sexMatches && context.age >= min && context.age <= max;
  }

  return false;
}

function pickContextualBranch(label: string, context: PatientRangeContext) {
  const branches = splitRangeExpression(label);
  if (branches.length === 0) return "";

  const keyedBranches = branches
    .map((branch) => {
      const [key, ...rest] = branch.split(":");
      return rest.length > 0 ? { key: key.trim(), value: rest.join(":").trim(), raw: branch } : null;
    })
    .filter((branch): branch is { key: string; value: string; raw: string } => Boolean(branch));

  if (keyedBranches.length === 0) return branches[0];

  const matches = keyedBranches.filter((branch) => branchMatchesContext(branch.key, context));
  if (matches.length === 0) return keyedBranches[0]?.value ?? branches[0];
  return matches.map((branch) => branch.value).join("; ");
}

function resolveBranch(label: string, context: PatientRangeContext) {
  const picked = pickContextualBranch(label, context);
  return picked ? parseRangeBranch(picked) : null;
}

function resolveDirection(optimal: ParsedRangeBranch | null, fallback: Biomarker["directionality"]) {
  if (!optimal) return fallback;
  if (optimal.comparator === "upper") return "lower_is_better";
  if (optimal.comparator === "lower") return "higher_is_better";
  if (optimal.comparator === "range") return "range_based";
  return fallback;
}

function statusFromResolvedRange(
  value: Biomarker["latestValue"],
  optimal: ParsedRangeBranch | null,
  outOfRange: ParsedRangeBranch | null,
  directionality: Biomarker["directionality"],
  fallback: BiomarkerStatus,
) {
  if (value === null || value === "") return "not_available";

  if (typeof value !== "number") {
    const normalizedValue = value.toLowerCase().replace(/\s+/g, "_");
    const normalizedOptimal = optimal?.label.toLowerCase().replace(/\s+/g, "_") ?? "";
    const normalizedOut = outOfRange?.label.toLowerCase().replace(/\s+/g, "_") ?? "";
    if (normalizedOptimal && normalizedOptimal.includes(normalizedValue)) return "optimal";
    if (normalizedOut && normalizedOut.includes(normalizedValue)) return "needs_attention";
    return fallback;
  }

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
  if (outOfRange?.comparator === "upper" && outOfRange.upper !== null && (value < outOfRange.upper || (outOfRange.upperInclusive && value === outOfRange.upper))) {
    return "needs_attention";
  }
  if (outOfRange?.comparator === "lower" && outOfRange.lower !== null && (value > outOfRange.lower || (outOfRange.lowerInclusive && value === outOfRange.lower))) {
    return "needs_attention";
  }

  return directionality === "qualitative" ? fallback : "at_risk";
}

function resolveRangeContext(biomarker: Biomarker, context: PatientRangeContext): ResolvedRangeContext {
  const kind = resultKind(biomarker);
  const optimal = resolveBranch(biomarker.optimalRangeLabel, context);
  const suboptimal = resolveBranch(biomarker.suboptimalRangeLabel, context);
  const outOfRange = resolveBranch(biomarker.outOfRangeLabel, context);
  const directionality = resolveDirection(optimal, biomarker.directionality);

  const lowerOptimal = optimal?.lower ?? biomarker.lowerOptimal;
  const upperOptimal = optimal?.upper ?? biomarker.upperOptimal;
  let lowerReference = biomarker.lowerReference;
  let upperReference = biomarker.upperReference;

  if (directionality === "range_based") {
    lowerReference = outOfRange?.comparator === "upper" ? outOfRange.upper : (outOfRange?.lower ?? lowerOptimal);
    upperReference = outOfRange?.comparator === "lower" ? outOfRange.lower : (outOfRange?.upper ?? upperOptimal);
  } else if (directionality === "lower_is_better") {
    lowerReference = null;
    upperReference = outOfRange?.lower ?? suboptimal?.upper ?? biomarker.upperReference;
  } else if (directionality === "higher_is_better") {
    lowerReference = outOfRange?.upper ?? suboptimal?.lower ?? biomarker.lowerReference;
    upperReference = null;
  }

  // Admin-entered status is authoritative for real results (plan §9); the
  // range parser only decides for entries without a stored status.
  const status: BiomarkerStatus =
    kind === "measured"
      ? biomarker.status !== "not_available"
        ? biomarker.status
        : statusFromResolvedRange(biomarker.latestValue, optimal, outOfRange, directionality, biomarker.status)
      : "not_available";

  return {
    unit: biomarker.unit,
    directionality,
    lowerOptimal,
    upperOptimal,
    lowerReference,
    upperReference,
    optimalLabel: optimal?.label ?? biomarker.optimalRangeLabel,
    suboptimalLabel: suboptimal?.label ?? biomarker.suboptimalRangeLabel,
    outOfRangeLabel:
      outOfRange?.label ??
      (biomarker.outOfRangeLabel.includes("OUTSIDE_")
        ? `Outside ${formatContextLabel(context, biomarker.contextRequirements)} range`
        : biomarker.outOfRangeLabel),
    contextLabel: formatContextLabel(context, biomarker.contextRequirements),
    status,
    kind,
    isQualitative: directionality === "qualitative",
  };
}

function Sparkline({ values, status }: { values: HistoricalValue[]; status: BiomarkerStatus }) {
  if (values.length < 2) return <span className="sparkline-empty" aria-label="No historical trend" />;

  const nums = values.map((point) => point.value);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const coords = values.map((point, index) => ({
    x: (index / (values.length - 1)) * 90 + 5,
    y: 27 - ((point.value - min) / span) * 22,
  }));
  const points = coords.map((coord) => `${coord.x},${coord.y}`).join(" ");
  const last = coords[coords.length - 1];

  return (
    <svg className="sparkline" viewBox="0 0 100 32" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke="rgba(17, 23, 27, 0.35)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle className={`sparkline-dot ${STATUS_META[status].className}`} cx={last.x} cy={last.y} r="2.6" />
    </svg>
  );
}

type RangeGeometry = {
  valuePct: number;
  zoneStartPct: number | null;
  zoneEndPct: number | null;
};

function rangeGeometry(biomarker: Biomarker, rangeContext: ResolvedRangeContext): RangeGeometry | null {
  const value = typeof biomarker.latestValue === "number" ? biomarker.latestValue : null;
  if (value === null || rangeContext.isQualitative) return null;

  let min =
    rangeContext.lowerReference ??
    rangeContext.lowerOptimal ??
    (rangeContext.upperReference ?? rangeContext.upperOptimal ?? value) * 0.2;
  let max =
    rangeContext.upperReference ??
    rangeContext.upperOptimal ??
    (rangeContext.lowerReference ?? rangeContext.lowerOptimal ?? value) * 1.8;

  if (rangeContext.directionality === "lower_is_better") {
    min = rangeContext.lowerReference ?? 0;
    max = rangeContext.upperReference ?? (rangeContext.upperOptimal ?? value) * 1.6;
  }

  if (rangeContext.directionality === "higher_is_better") {
    min = rangeContext.lowerReference ?? (rangeContext.lowerOptimal ?? value) * 0.6;
    max = rangeContext.upperReference ?? (rangeContext.lowerOptimal ?? value) * 1.8;
  }

  const toPct = (input: number) => Math.min(100, Math.max(0, ((input - min) / (max - min || 1)) * 100));

  let zoneStart: number | null = null;
  let zoneEnd: number | null = null;
  if (rangeContext.directionality === "lower_is_better") {
    zoneStart = 0;
    zoneEnd = rangeContext.upperOptimal !== null ? toPct(rangeContext.upperOptimal) : null;
  } else if (rangeContext.directionality === "higher_is_better") {
    zoneStart = rangeContext.lowerOptimal !== null ? toPct(rangeContext.lowerOptimal) : null;
    zoneEnd = 100;
  } else {
    zoneStart = rangeContext.lowerOptimal !== null ? toPct(rangeContext.lowerOptimal) : null;
    zoneEnd = rangeContext.upperOptimal !== null ? toPct(rangeContext.upperOptimal) : null;
  }

  const hasZone = zoneStart !== null && zoneEnd !== null && zoneEnd > zoneStart;

  return {
    valuePct: toPct(value),
    zoneStartPct: hasZone ? zoneStart : null,
    zoneEndPct: hasZone ? zoneEnd : null,
  };
}

function RangeIndicator({
  biomarker,
  rangeContext,
  size = "compact",
}: {
  biomarker: Biomarker;
  rangeContext: ResolvedRangeContext;
  size?: "compact" | "large";
}) {
  if (rangeContext.kind === "contextual") {
    return size === "compact" ? <span className="range-blank" aria-hidden="true" /> : null;
  }

  const geometry = rangeContext.kind === "measured" ? rangeGeometry(biomarker, rangeContext) : null;
  const qualitative = rangeContext.isQualitative;
  const zone =
    geometry && geometry.zoneStartPct !== null && geometry.zoneEndPct !== null
      ? { left: geometry.zoneStartPct, width: geometry.zoneEndPct - geometry.zoneStartPct }
      : null;

  const classNames = [
    "range-indicator",
    `range-indicator--${size}`,
    qualitative ? "range--qualitative" : "",
    rangeContext.kind === "awaiting" ? "range--awaiting" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} aria-hidden="true">
      <span className="range-track">
        {zone && <span className="range-zone" style={{ left: `${zone.left}%`, width: `${zone.width}%` }} />}
        {geometry && (
          <span
            className={`range-dot ${STATUS_META[rangeContext.status].className}`}
            style={{ left: `${geometry.valuePct}%` }}
          />
        )}
      </span>
      {size === "large" && (
        <div className="range-labels">
          <span>{(rangeContext.lowerReference ?? rangeContext.lowerOptimal)?.toLocaleString("en-US") ?? "Low"}</span>
          <span>{qualitative ? "Qualitative" : formatUnit(rangeContext.unit) || "Result"}</span>
          <span>{(rangeContext.upperReference ?? rangeContext.upperOptimal)?.toLocaleString("en-US") ?? "High"}</span>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status, kind = "measured" }: { status: BiomarkerStatus; kind?: ResultKind }) {
  if (kind !== "measured") {
    return <span className="result-status-pill result-status-pill--ghost">{KIND_PILL_LABEL[kind]}</span>;
  }
  const meta = STATUS_META[status];
  return <span className={`result-status-pill ${meta.className}`}>{meta.label}</span>;
}

function TrendChart({ biomarker, rangeContext }: { biomarker: Biomarker; rangeContext: ResolvedRangeContext }) {
  const values = biomarker.historicalValues;
  if (values.length < 2) return null;

  const nums = values.map((point) => point.value);
  let min = Math.min(...nums);
  let max = Math.max(...nums);

  if (!rangeContext.isQualitative) {
    if (rangeContext.lowerOptimal !== null && rangeContext.directionality !== "lower_is_better") {
      min = Math.min(min, rangeContext.lowerOptimal);
      max = Math.max(max, rangeContext.lowerOptimal);
    }
    if (rangeContext.upperOptimal !== null && rangeContext.directionality !== "higher_is_better") {
      min = Math.min(min, rangeContext.upperOptimal);
      max = Math.max(max, rangeContext.upperOptimal);
    }
  }

  const padding = (max - min || 1) * 0.08;
  min -= padding;
  max += padding;

  const toX = (index: number) => (index / (values.length - 1)) * 296 + 16;
  const toY = (input: number) => 156 - ((input - min) / (max - min || 1)) * 116;

  const bandTopValue =
    rangeContext.directionality === "higher_is_better" ? max : rangeContext.upperOptimal;
  const bandBottomValue =
    rangeContext.directionality === "lower_is_better" ? min : rangeContext.lowerOptimal;
  let band: { y: number; height: number } | null = null;
  if (!rangeContext.isQualitative && bandTopValue !== null && bandBottomValue !== null) {
    const yTop = Math.max(36, toY(bandTopValue));
    const yBottom = Math.min(160, toY(bandBottomValue));
    if (yBottom > yTop) band = { y: yTop, height: yBottom - yTop };
  }

  const points = values.map((point, index) => `${toX(index)},${toY(point.value)}`).join(" ");
  const lastIndex = values.length - 1;
  const lastX = toX(lastIndex);
  const lastY = toY(values[lastIndex].value);
  const statusClass = STATUS_META[rangeContext.status].className;

  return (
    <div className="trend-card" aria-label={`${biomarker.displayName} historical trend`}>
      <svg viewBox="0 0 328 184" role="img">
        {band && <rect className="trend-band" x="16" width="296" y={band.y} height={band.height} rx="5" />}
        <line x1="16" x2="312" y1="40" y2="40" />
        <line x1="16" x2="312" y1="98" y2="98" />
        <line x1="16" x2="312" y1="156" y2="156" />
        <polyline className="trend-line" points={points} fill="none" />
        {values.slice(0, -1).map((point, index) => (
          <circle className="trend-point" key={point.testDate} cx={toX(index)} cy={toY(point.value)} r="3" />
        ))}
        <circle className={`trend-halo ${statusClass}`} cx={lastX} cy={lastY} r="9" />
        <circle className={`trend-point-last ${statusClass}`} cx={lastX} cy={lastY} r="4.5" />
      </svg>
      <div className="trend-labels">
        <span>{formatDate(values[0]?.testDate ?? null)}</span>
        <span className="trend-latest">{formatValueWithUnit(biomarker)}</span>
        <span>{formatDate(values[lastIndex]?.testDate ?? null)}</span>
      </div>
    </div>
  );
}

function BiomarkerDrawer({ biomarker, onClose }: { biomarker: Biomarker; onClose: () => void }) {
  const rangeContext = resolveRangeContext(biomarker, useContext(RangeContext));
  const statusMeta = STATUS_META[rangeContext.status];
  const kind = rangeContext.kind;
  const [isClosing, setIsClosing] = useState(false);
  const showDiscussion =
    kind === "measured" && (rangeContext.status === "at_risk" || rangeContext.status === "needs_attention");

  const optimalRange = formatRangeLabel(rangeContext.optimalLabel, rangeContext.unit);
  const suboptimalRange = formatRangeLabel(rangeContext.suboptimalLabel, rangeContext.unit);
  const outOfRange = formatRangeLabel(rangeContext.outOfRangeLabel, rangeContext.unit);

  const requestClose = () => {
    if (isClosing) return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      onClose();
      return;
    }
    setIsClosing(true);
    window.setTimeout(onClose, 190);
  };

  return (
    <div className={`biomarker-drawer-layer${isClosing ? " is-closing" : ""}`} role="presentation">
      <button className="drawer-backdrop" type="button" aria-label="Close biomarker details" onClick={requestClose} />
      <aside className="biomarker-drawer" role="dialog" aria-modal="true" aria-labelledby="biomarker-drawer-title">
        <header className="drawer-header">
          <div>
            <span className="drawer-eyebrow">Biomarker detail</span>
            <h2 id="biomarker-drawer-title">{biomarker.displayName}</h2>
          </div>
          <button className="drawer-close" type="button" aria-label="Close biomarker details" onClick={requestClose}>
            <X strokeWidth={1.8} />
          </button>
        </header>

        <div className="drawer-body">
          {kind === "awaiting" && (
            <div className="drawer-quiet-card">
              <span className="drawer-chip">Awaiting first sample</span>
              <p>
                This marker is part of your panel but hasn't been measured yet. It will appear here after your next
                blood draw.
              </p>
            </div>
          )}

          {kind === "contextual" && (
            <div className="drawer-quiet-card">
              <div className="drawer-quiet-meta">
                <span className="drawer-chip">Result on file</span>
                {biomarker.latestDate && <span className="drawer-quiet-date">{formatFullDate(biomarker.latestDate)}</span>}
              </div>
              <p>
                This marker has no single optimal range. Your clinician reads it alongside your goals, age, medications
                and related markers.
              </p>
            </div>
          )}

          {kind === "measured" && (
            <>
              <div className="drawer-result-card">
                <strong>{formatValueWithUnit(biomarker)}</strong>
                <div className="drawer-result-meta">
                  <StatusPill status={rangeContext.status} />
                  {biomarker.latestDate && <span>{formatFullDate(biomarker.latestDate)}</span>}
                </div>
              </div>

              <TrendChart biomarker={biomarker} rangeContext={rangeContext} />

              <section className="drawer-section" aria-label="Range context">
                <div className="drawer-section-heading">
                  <h3>Current result context</h3>
                  <span>{statusMeta.label}</span>
                </div>
                <RangeIndicator biomarker={biomarker} rangeContext={rangeContext} size="large" />
                {rangeContext.contextLabel && (
                  <span className="range-context-chip">Personalized · {rangeContext.contextLabel}</span>
                )}
                {(optimalRange || suboptimalRange || outOfRange) && (
                  <div className="range-reference-grid">
                    {optimalRange && (
                      <div className="status--optimal">
                        <i aria-hidden="true" />
                        <span>Optimal</span>
                        <strong>{optimalRange}</strong>
                      </div>
                    )}
                    {suboptimalRange && (
                      <div className="status--at-risk">
                        <i aria-hidden="true" />
                        <span>At risk</span>
                        <strong>{suboptimalRange}</strong>
                      </div>
                    )}
                    {outOfRange && (
                      <div className="status--needs-attention">
                        <i aria-hidden="true" />
                        <span>Out of range</span>
                        <strong>{outOfRange}</strong>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {biomarker.whatItMeasures && (
            <section className="drawer-section">
              <h3>What it measures</h3>
              <p>{biomarker.whatItMeasures}</p>
            </section>
          )}

          {biomarker.whyItMatters && (
            <section className="drawer-section">
              <h3>Why it matters</h3>
              <p>{biomarker.whyItMatters}</p>
            </section>
          )}

          {kind === "contextual" && (
            <section className="drawer-section drawer-section--discussion">
              <h3>
                <Stethoscope strokeWidth={1.3} aria-hidden="true" />
                Interpreted with your doctor
              </h3>
              <p>
                Your doctor reviews this result during your consult and explains what it means for you — no single
                reference range applies on its own.
              </p>
            </section>
          )}

          {showDiscussion && (
            <section className="drawer-section drawer-section--discussion">
              <h3>
                <Stethoscope strokeWidth={1.3} aria-hidden="true" />
                Worth discussing with your doctor
              </h3>
              <p>
                This may be worth discussing with your doctor. Your doctor may interpret this alongside other markers,
                symptoms, medications, lifestyle context, and history before deciding what it means for you.
              </p>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}

function BiomarkerRow({ biomarker, onOpen }: { biomarker: Biomarker; onOpen: (biomarker: Biomarker) => void }) {
  const rangeContext = resolveRangeContext(biomarker, useContext(RangeContext));
  const kind = rangeContext.kind;
  const rowClass = [
    "biomarker-result-row",
    kind === "awaiting" ? "is-awaiting" : "",
    kind === "contextual" ? "is-contextual" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={rowClass} type="button" onClick={() => onOpen(biomarker)}>
      <span className="biomarker-result-name">
        <strong>{biomarker.displayName}</strong>
        {biomarker.aliases.length > 1 && <span>{biomarker.aliases.slice(0, 2).join(" / ")}</span>}
      </span>
      <span className="biomarker-result-value">
        <span className="biomarker-result-reading">
          <strong>{formatValue(biomarker)}</strong>
          {kind === "measured" && biomarker.unit && <span>{formatUnit(biomarker.unit)}</span>}
        </span>
        {kind !== "awaiting" && biomarker.latestDate && (
          <span className="biomarker-result-date">{formatDate(biomarker.latestDate)}</span>
        )}
      </span>
      <Sparkline values={biomarker.historicalValues} status={rangeContext.status} />
      <RangeIndicator biomarker={biomarker} rangeContext={rangeContext} />
      <StatusPill status={rangeContext.status} kind={kind} />
      <ChevronRight className="row-chevron" strokeWidth={1.7} />
    </button>
  );
}

function OverviewDistribution({ counts, total }: { counts: OverviewCounts; total: number }) {
  const segments = [
    { key: "optimal", className: "status--optimal", value: counts.optimal },
    { key: "at_risk", className: "status--at-risk", value: counts.at_risk },
    { key: "needs_attention", className: "status--needs-attention", value: counts.needs_attention },
    { key: "rest", className: "status--rest", value: counts.awaiting + counts.contextual },
  ].filter((segment) => segment.value > 0);

  return (
    <div className="overview-distribution" aria-label="Biomarker status distribution">
      {segments.map((segment) => (
        <span
          key={segment.key}
          className={`overview-distribution-segment ${segment.className}`}
          style={{ width: `${total > 0 ? (segment.value / total) * 100 : 0}%` }}
        />
      ))}
    </div>
  );
}

export default function ResultsDashboard({ memberId }: { memberId?: string } = {}) {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null);
  const [pendingDialogOpen, setPendingDialogOpen] = useState(true);

  const { loading, error, biomarkers, categories, age, sex, hasResults } = useMemberResults(memberId);

  const rangeContext = useMemo<PatientRangeContext>(
    () => ({
      ...DEFAULT_RANGE_CONTEXT,
      ...(sex ? { sex } : null),
      ...(age !== null ? { age } : null),
    }),
    [age, sex],
  );

  const biomarkerById = useMemo(
    () => new Map(biomarkers.map((biomarker) => [biomarker.id, biomarker])),
    [biomarkers],
  );

  const counts = useMemo(
    () => statusCounts(categories, biomarkerById, rangeContext),
    [categories, biomarkerById, rangeContext],
  );
  const total = useMemo(() => panelEntries(categories).length, [categories]);
  const measured = total - counts.awaiting;

  const filterCount = (id: FilterId) => {
    if (id === "all") return total;
    if (id === "not_tested") return counts.awaiting;
    return counts[id];
  };

  const filteredCategories = useMemo(
    () =>
      categories.map((category) => ({
        ...category,
        biomarkers: category.biomarkerIds
          .map((biomarkerId) => biomarkerById.get(biomarkerId))
          .filter((biomarker): biomarker is Biomarker => Boolean(biomarker))
          .filter((biomarker) => {
            if (activeFilter === "all") return true;
            const resolved = resolveRangeContext(biomarker, rangeContext);
            if (activeFilter === "not_tested") return resolved.kind === "awaiting";
            return resolved.kind === "measured" && resolved.status === activeFilter;
          })
          .filter((biomarker) => matchesSearch(biomarker, query.trim())),
      })).filter((category) => category.biomarkers.length > 0),
    [activeFilter, query, categories, biomarkerById, rangeContext],
  );

  if (loading) return null;
  if (error) {
    return (
      <section className="results-dashboard">
        <p role="alert">We couldn't load your results ({error}). Try again in a moment.</p>
      </section>
    );
  }
  return (
    <RangeContext.Provider value={rangeContext}>
    <section className="results-dashboard" aria-labelledby="results-dashboard-title">
      <header className="p-heading-row results-heading">
        <span className="p-eyebrow">YOUR RESULTS</span>
        <h1 className="p-h1" id="results-dashboard-title">
          Core <em>biomarker</em> overviews
        </h1>
      </header>

      <div className="results-overview-card">
        <div className="overview-total">
          <strong>{measured}</strong>
          <span>of {total} markers measured</span>
        </div>
        <div className="overview-summary">
          <OverviewDistribution counts={counts} total={total} />
          <div className="overview-legend">
            <span className="overview-legend-item status--optimal">
              <i aria-hidden="true" />
              <strong>{counts.optimal}</strong> Optimal
            </span>
            <span className="overview-legend-item status--at-risk">
              <i aria-hidden="true" />
              <strong>{counts.at_risk}</strong> At risk
            </span>
            <span className="overview-legend-item status--needs-attention">
              <i aria-hidden="true" />
              <strong>{counts.needs_attention}</strong> Out of range
            </span>
            <span className="overview-footnote">
              {counts.awaiting} not tested yet
            </span>
          </div>
        </div>
      </div>

      <div className="results-toolbar">
        <div className="result-filter-chips" aria-label="Filter biomarkers by status">
          {FILTERS.map((filter) => {
            const statusChipId =
              filter.id === "optimal" || filter.id === "at_risk" || filter.id === "needs_attention"
                ? filter.id
                : null;
            return (
              <button
                className={[
                  activeFilter === filter.id ? "is-active" : "",
                  statusChipId ? STATUS_META[statusChipId].className : "",
                  filter.id === "not_tested" ? "chip--quiet" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {statusChipId && <i aria-hidden="true" />}
                {filter.label}
                <span>{filterCount(filter.id)}</span>
              </button>
            );
          })}
        </div>
        <label className="results-filter-select">
          <span className="sr-only">Filter biomarkers by status</span>
          <select
            value={activeFilter}
            onChange={(event) => setActiveFilter(event.target.value as FilterId)}
          >
            {FILTERS.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.label} ({filterCount(filter.id)})
              </option>
            ))}
          </select>
        </label>
        <label className="results-search">
          <Search strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">Search biomarkers</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search LDL, Vitamin D, Creatinine..."
          />
        </label>
      </div>

      <div className="biomarker-category-list">
        {filteredCategories.map((category) => {
          const categoryId = `category-${category.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
          <section className="biomarker-category-section" key={category.name} aria-labelledby={categoryId}>
            <div className="biomarker-category-copy">
              <h3 id={categoryId}>{category.name}</h3>
              <p>{category.description}</p>
            </div>
            <div className="biomarker-result-list">
              {category.biomarkers.map((biomarker) => (
                <BiomarkerRow
                  biomarker={biomarker}
                  key={`${category.name}-${biomarker.id}`}
                  onOpen={setSelectedBiomarker}
                />
              ))}
            </div>
          </section>
          );
        })}
        {filteredCategories.length === 0 && (
          <div className="results-empty-state">
            <h3>No markers found</h3>
            <p>Try a different status filter or search term.</p>
          </div>
        )}
      </div>

      {selectedBiomarker && (
        <BiomarkerDrawer biomarker={selectedBiomarker} onClose={() => setSelectedBiomarker(null)} />
      )}
      {!memberId && !hasResults && pendingDialogOpen && (
        <PendingPortalDialog
          title="Your results are pending"
          closeLabel="Close pending results message"
          onClose={() => setPendingDialogOpen(false)}
        >
          If you have not yet gone for your blood draw, please make your way to Innoquest. If you have, please wait one
          week for us to receive and process your results for you.
        </PendingPortalDialog>
      )}
    </section>
    </RangeContext.Provider>
  );
}
