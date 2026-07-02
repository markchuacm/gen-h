import { useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { BIOMARKER_CATEGORIES, BIOMARKERS } from "./biomarkerData";
import type { Biomarker, BiomarkerStatus, HistoricalValue } from "./types";
import "./results.css";

type FilterId = "all" | BiomarkerStatus;

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
  isQualitative: boolean;
};

type StatusMeta = {
  label: string;
  shortLabel: string;
  className: string;
};

const STATUS_META: Record<BiomarkerStatus, StatusMeta> = {
  optimal: { label: "Optimal", shortLabel: "Optimal", className: "status--optimal" },
  at_risk: { label: "At risk", shortLabel: "At risk", className: "status--at-risk" },
  needs_attention: {
    label: "Out of range",
    shortLabel: "Out of range",
    className: "status--needs-attention",
  },
  not_available: { label: "Not available", shortLabel: "N/A", className: "status--not-available" },
};

const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All markers" },
  { id: "optimal", label: "Optimal" },
  { id: "at_risk", label: "At risk" },
  { id: "needs_attention", label: "Out of range" },
  { id: "not_available", label: "Not available" },
];

const biomarkerById = new Map(BIOMARKERS.map((biomarker) => [biomarker.id, biomarker]));

const DEMO_RANGE_CONTEXT: PatientRangeContext = {
  sex: "male",
  age: 36,
  sampleTiming: "am",
  cyclePhase: "follicular",
};

function formatDate(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function formatFullDate(value: string | null) {
  if (!value) return "Not available";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}

function formatValue(biomarker: Biomarker) {
  if (biomarker.latestValue === null || biomarker.latestValue === "") return "Not available";
  if (typeof biomarker.latestValue === "number") return biomarker.latestValue.toLocaleString("en-US");
  return biomarker.latestValue;
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
  if (value === "Not available" || !biomarker.unit) return value;
  return `${value} ${formatUnit(biomarker.unit)}`;
}

function formatRangeLabel(label: string, unit: string) {
  if (!label) return "";
  if (label.toLowerCase().startsWith("outside ")) return label;
  return unit ? `${label} ${formatUnit(unit)}` : label;
}

function formatContextLabel(context: PatientRangeContext, ruleType = "") {
  const sex = context.sex === "male" ? "male" : "female";
  const parts: string[] = [];
  const needsSex = ruleType.includes("SEX");
  const needsAge = ruleType.includes("AGE");
  const needsTime = ruleType.includes("TIME");
  const needsCycle = ruleType.includes("CYCLE");

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

function panelEntries() {
  return BIOMARKER_CATEGORIES.flatMap((category) =>
    category.biomarkerIds.map((biomarkerId) => ({ category: category.name, biomarkerId })),
  );
}

function statusCounts() {
  return panelEntries().reduce<Record<BiomarkerStatus, number>>(
    (acc, entry) => {
      const biomarker = biomarkerById.get(entry.biomarkerId);
      const status = biomarker ? resolveRangeContext(biomarker, DEMO_RANGE_CONTEXT).status : "not_available";
      acc[status] += 1;
      return acc;
    },
    { optimal: 0, at_risk: 0, needs_attention: 0, not_available: 0 },
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
  if (!compact) return { label, lower: null, upper: null, comparator: "qualitative" };

  if (compact.startsWith("<=") || compact.startsWith("<")) {
    const value = Number(compact.match(/\d+(?:\.\d+)?/)?.[0]);
    return { label, lower: null, upper: Number.isFinite(value) ? value : null, comparator: "upper" };
  }

  if (compact.startsWith(">=") || compact.startsWith(">")) {
    const value = Number(compact.match(/\d+(?:\.\d+)?/)?.[0]);
    return { label, lower: Number.isFinite(value) ? value : null, upper: null, comparator: "lower" };
  }

  const rangeMatch = compact.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (rangeMatch) {
    return {
      label,
      lower: Number(rangeMatch[1]),
      upper: Number(rangeMatch[2]),
      comparator: "range",
    };
  }

  return { label, lower: null, upper: null, comparator: "qualitative" };
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
    if (value >= optimal.lower && value <= optimal.upper) return "optimal";
  }
  if (optimal?.comparator === "upper" && optimal.upper !== null && value < optimal.upper) return "optimal";
  if (optimal?.comparator === "lower" && optimal.lower !== null && value >= optimal.lower) return "optimal";

  if (outOfRange?.comparator === "range" && outOfRange.lower !== null && outOfRange.upper !== null) {
    if (value >= outOfRange.lower && value <= outOfRange.upper) return "needs_attention";
  }
  if (outOfRange?.comparator === "upper" && outOfRange.upper !== null && value < outOfRange.upper) {
    return "needs_attention";
  }
  if (outOfRange?.comparator === "lower" && outOfRange.lower !== null && value >= outOfRange.lower) {
    return "needs_attention";
  }

  return directionality === "qualitative" ? fallback : "at_risk";
}

function resolveRangeContext(biomarker: Biomarker, context: PatientRangeContext): ResolvedRangeContext {
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

  const status = statusFromResolvedRange(
    biomarker.latestValue,
    optimal,
    outOfRange,
    directionality,
    biomarker.status,
  );

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
        ? `Outside ${formatContextLabel(context, biomarker.ruleType)} range`
        : biomarker.outOfRangeLabel),
    contextLabel: formatContextLabel(context, biomarker.ruleType),
    status,
    isQualitative: directionality === "qualitative",
  };
}

function Sparkline({ values, status }: { values: HistoricalValue[]; status: BiomarkerStatus }) {
  if (values.length < 2) return <span className="sparkline-empty" aria-label="No historical trend" />;

  const nums = values.map((point) => point.value);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const points = values
    .map((point, index) => {
      const x = (index / (values.length - 1)) * 92 + 4;
      const y = 28 - ((point.value - min) / span) * 20;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className={`sparkline ${STATUS_META[status].className}`} viewBox="0 0 100 32" aria-hidden="true">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function rangePosition(biomarker: Biomarker, rangeContext: ResolvedRangeContext) {
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

  const bounded = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));
  return bounded;
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
  const position = rangePosition(biomarker, rangeContext);
  const directionClass = `range--${rangeContext.directionality.replace(/_/g, "-")}`;
  const qualitative = rangeContext.isQualitative;

  return (
    <div className={`range-indicator range-indicator--${size} ${directionClass}`} aria-hidden="true">
      <span className="range-track">
        {!qualitative && position !== null && <span className="range-pin" style={{ left: `${position}%` }} />}
      </span>
      {size === "large" && (
        <div className="range-labels">
          <span>{rangeContext.lowerReference ?? rangeContext.lowerOptimal ?? "Low"}</span>
          <span>{qualitative ? "Qualitative" : formatUnit(rangeContext.unit) || "Result"}</span>
          <span>{rangeContext.upperReference ?? rangeContext.upperOptimal ?? "High"}</span>
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: BiomarkerStatus }) {
  const meta = STATUS_META[status];
  return <span className={`result-status-pill ${meta.className}`}>{meta.label}</span>;
}

function TrendChart({ biomarker }: { biomarker: Biomarker }) {
  const values = biomarker.historicalValues;
  if (values.length < 2) return null;

  const nums = values.map((point) => point.value);
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const points = values
    .map((point, index) => {
      const x = (index / (values.length - 1)) * 296 + 16;
      const y = 156 - ((point.value - min) / span) * 116;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="trend-card" aria-label={`${biomarker.displayName} historical trend`}>
      <svg viewBox="0 0 328 184" role="img">
        <line x1="16" x2="312" y1="40" y2="40" />
        <line x1="16" x2="312" y1="98" y2="98" />
        <line x1="16" x2="312" y1="156" y2="156" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        {values.map((point, index) => {
          const x = (index / (values.length - 1)) * 296 + 16;
          const y = 156 - ((point.value - min) / span) * 116;
          return <circle key={point.testDate} cx={x} cy={y} r="4.5" />;
        })}
      </svg>
      <div className="trend-labels">
        <span>{formatDate(values[0]?.testDate ?? null)}</span>
        <span>{formatDate(values[values.length - 1]?.testDate ?? null)}</span>
      </div>
    </div>
  );
}

function BiomarkerDrawer({ biomarker, onClose }: { biomarker: Biomarker; onClose: () => void }) {
  const rangeContext = resolveRangeContext(biomarker, DEMO_RANGE_CONTEXT);
  const statusMeta = STATUS_META[rangeContext.status];
  const showDiscussion = rangeContext.status === "at_risk" || rangeContext.status === "needs_attention";

  return (
    <div className="biomarker-drawer-layer" role="presentation">
      <button className="drawer-backdrop" type="button" aria-label="Close biomarker details" onClick={onClose} />
      <aside className="biomarker-drawer" role="dialog" aria-modal="true" aria-labelledby="biomarker-drawer-title">
        <header className="drawer-header">
          <div>
            <span className="drawer-eyebrow">Biomarker detail</span>
            <h2 id="biomarker-drawer-title">{biomarker.displayName}</h2>
          </div>
          <button className="drawer-close" type="button" aria-label="Close biomarker details" onClick={onClose}>
            <X strokeWidth={1.8} />
          </button>
        </header>

        <div className="drawer-result-card">
          <StatusPill status={rangeContext.status} />
          <strong>{formatValueWithUnit(biomarker)}</strong>
          <span>{formatFullDate(biomarker.latestDate)}</span>
        </div>

        <TrendChart biomarker={biomarker} />

        <section className="drawer-section" aria-label="Range context">
          <div className="drawer-section-heading">
            <h3>Current result context</h3>
            <span>{statusMeta.label}</span>
          </div>
          <RangeIndicator biomarker={biomarker} rangeContext={rangeContext} size="large" />
          <p className="range-context-note">Range shown for {rangeContext.contextLabel}.</p>
          {(rangeContext.optimalLabel || rangeContext.suboptimalLabel || rangeContext.outOfRangeLabel) && (
            <div className="range-reference-grid">
              {rangeContext.optimalLabel && (
                <div className="status--optimal">
                  <i aria-hidden="true" />
                  <span>Optimal</span>
                  <strong>{formatRangeLabel(rangeContext.optimalLabel, rangeContext.unit)}</strong>
                </div>
              )}
              {rangeContext.suboptimalLabel && (
                <div className="status--at-risk">
                  <i aria-hidden="true" />
                  <span>At risk</span>
                  <strong>{formatRangeLabel(rangeContext.suboptimalLabel, rangeContext.unit)}</strong>
                </div>
              )}
              {rangeContext.outOfRangeLabel && (
                <div className="status--needs-attention">
                  <i aria-hidden="true" />
                  <span>Out of range</span>
                  <strong>{formatRangeLabel(rangeContext.outOfRangeLabel, rangeContext.unit)}</strong>
                </div>
              )}
            </div>
          )}
        </section>

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

        {showDiscussion && (
          <section className="drawer-section drawer-section--discussion">
            <h3>Worth discussing with your doctor</h3>
            <p>
              This may be worth discussing with your doctor. Your doctor may interpret this alongside other markers,
              symptoms, medications, lifestyle context, and history before deciding what it means for you.
            </p>
          </section>
        )}
      </aside>
    </div>
  );
}

function BiomarkerRow({ biomarker, onOpen }: { biomarker: Biomarker; onOpen: (biomarker: Biomarker) => void }) {
  const rangeContext = resolveRangeContext(biomarker, DEMO_RANGE_CONTEXT);

  return (
    <button className="biomarker-result-row" type="button" onClick={() => onOpen(biomarker)}>
      <span className="biomarker-result-name">
        <strong>{biomarker.displayName}</strong>
        {biomarker.aliases.length > 1 && <span>{biomarker.aliases.slice(0, 2).join(" / ")}</span>}
      </span>
      <span className="biomarker-result-value">
        <strong>{formatValue(biomarker)}</strong>
        {biomarker.unit && <span>{formatUnit(biomarker.unit)}</span>}
      </span>
      <span className="biomarker-result-date">{formatDate(biomarker.latestDate)}</span>
      <Sparkline values={biomarker.historicalValues} status={rangeContext.status} />
      <RangeIndicator biomarker={biomarker} rangeContext={rangeContext} />
      <StatusPill status={rangeContext.status} />
      <ChevronRight className="row-chevron" strokeWidth={1.7} />
    </button>
  );
}

function OverviewDistribution({ counts, total }: { counts: Record<BiomarkerStatus, number>; total: number }) {
  return (
    <div className="overview-distribution" aria-label="Biomarker status distribution">
      {(Object.keys(STATUS_META) as BiomarkerStatus[]).map((status) => {
        const width = total > 0 ? (counts[status] / total) * 100 : 0;
        return (
          <span
            key={status}
            className={`overview-distribution-segment ${STATUS_META[status].className}`}
            style={{ width: `${width}%` }}
          />
        );
      })}
    </div>
  );
}

export default function ResultsDashboard() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");
  const [selectedBiomarker, setSelectedBiomarker] = useState<Biomarker | null>(null);

  const counts = useMemo(statusCounts, []);
  const total = useMemo(() => panelEntries().length, []);

  const filteredCategories = useMemo(
    () =>
      BIOMARKER_CATEGORIES.map((category) => ({
        ...category,
        biomarkers: category.biomarkerIds
          .map((biomarkerId) => biomarkerById.get(biomarkerId))
          .filter((biomarker): biomarker is Biomarker => Boolean(biomarker))
          .filter(
            (biomarker) =>
              activeFilter === "all" || resolveRangeContext(biomarker, DEMO_RANGE_CONTEXT).status === activeFilter,
          )
          .filter((biomarker) => matchesSearch(biomarker, query.trim())),
      })).filter((category) => category.biomarkers.length > 0),
    [activeFilter, query],
  );

  return (
    <section className="results-dashboard" aria-labelledby="results-dashboard-title">
      <div className="results-overview-card">
        <div className="results-overview-copy">
          <span className="results-kicker">Sample patient results</span>
          <h2 id="results-dashboard-title">Your Core biomarker overview</h2>
          <p>
            A calm view of where your markers sit today, grouped by health area and ready for review with your doctor.
          </p>
        </div>
        <div className="overview-total">
          <span>Total tested</span>
          <strong>{total}</strong>
        </div>
        <div className="overview-status-grid">
          {(Object.keys(STATUS_META) as BiomarkerStatus[]).map((status) => (
            <div className={`overview-status-card ${STATUS_META[status].className}`} key={status}>
              <span>{STATUS_META[status].label}</span>
              <strong>{counts[status]}</strong>
            </div>
          ))}
        </div>
        <OverviewDistribution counts={counts} total={total} />
      </div>

      <div className="results-toolbar">
        <div className="result-filter-chips" aria-label="Filter biomarkers by status">
          {FILTERS.map((filter) => {
            const count = filter.id === "all" ? total : counts[filter.id];
            return (
              <button
                className={[
                  activeFilter === filter.id ? "is-active" : "",
                  filter.id !== "all" ? STATUS_META[filter.id].className : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.id !== "all" && <i aria-hidden="true" />}
                <span>{count}</span>
                {filter.label}
              </button>
            );
          })}
        </div>
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
    </section>
  );
}
