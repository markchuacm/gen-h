import { useMemo, useState } from "react";
import { ChevronRight, Search, X } from "lucide-react";
import { BIOMARKER_CATEGORIES, BIOMARKERS } from "./biomarkerData";
import type { Biomarker, BiomarkerStatus, HistoricalValue } from "./types";
import "./results.css";

type FilterId = "all" | BiomarkerStatus;

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

function formatValueWithUnit(biomarker: Biomarker) {
  const value = formatValue(biomarker);
  if (value === "Not available" || !biomarker.unit) return value;
  return `${value} ${biomarker.unit}`;
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
      const status = biomarkerById.get(entry.biomarkerId)?.status ?? "not_available";
      acc[status] += 1;
      return acc;
    },
    { optimal: 0, at_risk: 0, needs_attention: 0, not_available: 0 },
  );
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

function rangePosition(biomarker: Biomarker) {
  const value = typeof biomarker.latestValue === "number" ? biomarker.latestValue : null;
  if (value === null || biomarker.directionality === "qualitative") return null;

  let min =
    biomarker.lowerReference ??
    biomarker.lowerOptimal ??
    (biomarker.upperReference ?? biomarker.upperOptimal ?? value) * 0.2;
  let max =
    biomarker.upperReference ??
    biomarker.upperOptimal ??
    (biomarker.lowerReference ?? biomarker.lowerOptimal ?? value) * 1.8;

  if (biomarker.directionality === "lower_is_better") {
    min = biomarker.lowerReference ?? 0;
    max = biomarker.upperReference ?? (biomarker.upperOptimal ?? value) * 1.6;
  }

  if (biomarker.directionality === "higher_is_better") {
    min = biomarker.lowerReference ?? (biomarker.lowerOptimal ?? value) * 0.6;
    max = biomarker.upperReference ?? (biomarker.lowerOptimal ?? value) * 1.8;
  }

  const bounded = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));
  return bounded;
}

function RangeIndicator({ biomarker, size = "compact" }: { biomarker: Biomarker; size?: "compact" | "large" }) {
  const position = rangePosition(biomarker);
  const directionClass = `range--${biomarker.directionality.replace(/_/g, "-")}`;
  const qualitative = biomarker.directionality === "qualitative";

  return (
    <div className={`range-indicator range-indicator--${size} ${directionClass}`} aria-hidden="true">
      <span className="range-track">
        {!qualitative && position !== null && <span className="range-pin" style={{ left: `${position}%` }} />}
      </span>
      {size === "large" && (
        <div className="range-labels">
          <span>{biomarker.lowerReference ?? biomarker.lowerOptimal ?? "Low"}</span>
          <span>{qualitative ? "Qualitative" : biomarker.unit || "Result"}</span>
          <span>{biomarker.upperReference ?? biomarker.upperOptimal ?? "High"}</span>
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
  const statusMeta = STATUS_META[biomarker.status];
  const showDiscussion = biomarker.status === "at_risk" || biomarker.status === "needs_attention";

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
          <StatusPill status={biomarker.status} />
          <strong>{formatValueWithUnit(biomarker)}</strong>
          <span>{formatFullDate(biomarker.latestDate)}</span>
        </div>

        <TrendChart biomarker={biomarker} />

        <section className="drawer-section" aria-label="Range context">
          <div className="drawer-section-heading">
            <h3>Current result context</h3>
            <span>{statusMeta.label}</span>
          </div>
          <RangeIndicator biomarker={biomarker} size="large" />
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
  return (
    <button className="biomarker-result-row" type="button" onClick={() => onOpen(biomarker)}>
      <span className="biomarker-result-name">
        <strong>{biomarker.displayName}</strong>
        {biomarker.aliases.length > 1 && <span>{biomarker.aliases.slice(0, 2).join(" / ")}</span>}
      </span>
      <span className="biomarker-result-value">
        <strong>{formatValue(biomarker)}</strong>
        {biomarker.unit && <span>{biomarker.unit}</span>}
      </span>
      <span className="biomarker-result-date">{formatDate(biomarker.latestDate)}</span>
      <Sparkline values={biomarker.historicalValues} status={biomarker.status} />
      <RangeIndicator biomarker={biomarker} />
      <StatusPill status={biomarker.status} />
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
          .filter((biomarker) => activeFilter === "all" || biomarker.status === activeFilter)
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
