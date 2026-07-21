import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Brain,
  Check,
  ChevronDown,
  Dna,
  Droplets,
  FlaskConical,
  HeartPulse,
  LayoutGrid,
  List,
  Plus,
  ReceiptText,
  Search,
  Shield,
  Zap,
} from "lucide-react";
import { useBiomarkerCatalog } from "../lib/api/catalog";
import type { Biomarker, BiomarkerCategory } from "../member-v2/screens/results/types";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import { fetchLabOrder, saveLabOrder } from "../lib/api/labOrder";
import type { LabOrderQuote } from "../lib/api/labOrder";
import { formatMyr } from "../lib/labOrderQuote";
import { matchesQuery } from "./caseSignals";
import {
  clearRiskAreaSelection,
  createRiskAreaSelection,
  selectAdvancedBaseline,
  selectedCodesForRiskAreas,
  setRiskAreaMarkers,
  toggleRiskArea,
  toggleRiskAreaMarker,
  type RiskAreaSelection,
} from "./riskAreaSelection";

type CatalogView = "list" | "pills";

/** Card corner icon per health-risk coverage area. */
const PANEL_ICONS: Record<string, typeof HeartPulse> = {
  "cardiovascular-risk": HeartPulse,
  "metabolic-health": Droplets,
  "blood-inflammation-immunity": Activity,
  "kidney-urinary-health": Droplets,
  "liver-digestive-health": Zap,
  "thyroid-hormones-ageing": Dna,
  "nutrients-bone-health": Plus,
  "infectious-disease-screening": Shield,
  "life-stage-risk": Brain,
};

function PanelBuilder({
  memberId,
  detail,
  onBack,
  onSaved,
}: {
  memberId: string;
  detail: DoctorCaseDetail;
  onBack: () => void;
  onSaved: () => void;
}) {
  const { catalog, loading: catalogLoading } = useBiomarkerCatalog();
  const byCode = catalog.byCode;

  // The active catalog is the commercial baseline: every marker starts in a
  // new draft and the doctor personalizes by removing tests.
  const allCodes = useMemo(() => catalog.biomarkers.map((marker) => marker.id), [catalog.biomarkers]);
  const riskAreas = catalog.riskAreas;

  const [selection, setSelection] = useState<RiskAreaSelection>(() => selectAdvancedBaseline([]));
  const [view, setView] = useState<CatalogView>("list");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [quote, setQuote] = useState<LabOrderQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reviewButtonRef = useRef<HTMLButtonElement>(null);

  // Load any existing panel exactly; otherwise Advanced Baseline includes every
  // active biomarker. Wait for the catalog because saved panels may contain
  // retired codes that cannot be shown or selected again.
  useEffect(() => {
    if (catalogLoading) return;
    let cancelled = false;
    fetchLabOrder(memberId).then(({ data }) => {
      if (cancelled) return;
      const saved = data ? data.biomarker_codes.filter((code) => byCode.has(code)) : null;
      setSelection(createRiskAreaSelection(saved, allCodes, riskAreas));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId, catalogLoading, byCode, allCodes, riskAreas]);

  const selected = useMemo(
    () => selectedCodesForRiskAreas(selection, riskAreas),
    [selection, riskAreas],
  );

  const toggleCode = (code: string) =>
    setSelection((current) => toggleRiskAreaMarker(current, riskAreas, code));

  const toggleExpanded = (name: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const setCodes = (codes: string[], on: boolean) =>
    setSelection((current) => setRiskAreaMarkers(current, riskAreas, codes, on));

  const restoreAdvancedBaseline = () => setSelection(selectAdvancedBaseline(riskAreas));
  const toggleAdvancedBaseline = () =>
    setSelection((current) => current.advancedBaselineSelected
      ? clearRiskAreaSelection()
      : selectAdvancedBaseline(riskAreas));

  const omittedCount = Math.max(0, allCodes.length - selected.size);
  const advancedBaselineStatus = selection.advancedBaselineSelected
    ? "Included"
    : selected.size === 0 ? "Removed" : "Partially covered";

  const visibleCategories = catalog.categories;

  const subtext = [detail.age ? `${detail.age}y` : null, detail.sex].filter(Boolean).join(" · ");

  const save = async () => {
    setSaving(true);
    setError(null);
    const { data, error: err } = await saveLabOrder(memberId, [...selected]);
    setSaving(false);
    if (err) setError(err);
    else if (data?.quote) {
      setReviewing(false);
      setQuote(data.quote);
    } else {
      setError("The panel was saved, but its quote could not be loaded. Please save it again.");
    }
  };

  const closeReview = () => {
    setReviewing(false);
    requestAnimationFrame(() => reviewButtonRef.current?.focus());
  };

  if (loading || catalogLoading) {
    return (
      <main className="p-page doc-page">
        <button type="button" className="doc-back" onClick={onBack}>
          ← Case brief
        </button>
        <p className="doc-muted">Loading panel…</p>
      </main>
    );
  }

  const firstName = detail.memberName?.split(" ")[0];

  return (
    <main className="p-page doc-page pb">
      <button type="button" className="doc-back" onClick={onBack}>
        ← Case brief
      </button>

      <header className="doc-head">
        <div>
          <h1 className="p-h1">
            Blood panel for <em>{firstName ?? "this member"}</em>
          </h1>
          {subtext && <p className="doc-sub">{subtext}</p>}
        </div>
      </header>

      <section aria-label="Health-risk coverage">
        <div className="pb-panels">
          <button
            type="button"
            aria-pressed={selection.advancedBaselineSelected}
            aria-label={selection.advancedBaselineSelected ? "Advanced Baseline — clear all biomarkers" : "Advanced Baseline — select all biomarkers"}
            className={`pb-panel pb-panel-baseline ${selection.advancedBaselineSelected ? "is-active" : ""}`}
            onClick={toggleAdvancedBaseline}
          >
            <span className="pb-panel-head">
              <span>
                <strong>Advanced Baseline</strong>
              </span>
              <span className="pb-baseline-action" aria-hidden="true">
                {selection.advancedBaselineSelected
                  ? <Check strokeWidth={2.2} />
                  : <Plus strokeWidth={2} />}
              </span>
            </span>
            <span className="pb-panel-meta">
              <span className="pb-panel-status">{advancedBaselineStatus}</span>
              <FlaskConical className="pb-panel-icon" strokeWidth={1.7} aria-hidden="true" />
            </span>
          </button>

          {riskAreas.map((area) => {
            const inPanel = area.biomarkerIds.filter((code) => selected.has(code)).length;
            const active = selection.selectedAreaIds.has(area.id);
            const fullyCovered = inPanel === area.biomarkerIds.length;
            const status = fullyCovered ? "Included" : inPanel > 0 ? "Partially covered" : "Removed";
            const Icon = PANEL_ICONS[area.id] ?? FlaskConical;
            return (
              <button
                key={area.id}
                type="button"
                aria-pressed={active}
                title={area.description}
                className={`pb-panel ${active ? "is-active" : ""} ${!fullyCovered && inPanel > 0 ? "is-partial" : ""} ${!active && fullyCovered ? "is-covered" : ""}`}
                onClick={() => setSelection((current) => toggleRiskArea(current, riskAreas, area.id))}
              >
                <span className="pb-panel-head">
                  <span>
                    <strong>{area.name}</strong>
                  </span>
                </span>
                <span className="pb-panel-meta">
                  <span className="pb-panel-status">{status}</span>
                  <Icon className="pb-panel-icon" strokeWidth={1.7} aria-hidden="true" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-label="All biomarkers">
        <div className="pb-section-head">
          <h2 className="doc-card-title">Fine-tune</h2>
          <div className="pb-view-toggle" role="group" aria-label="Catalog view">
            <button
              type="button"
              className={view === "list" ? "is-active" : ""}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List strokeWidth={1.9} aria-hidden="true" /> List
            </button>
            <button
              type="button"
              className={view === "pills" ? "is-active" : ""}
              aria-pressed={view === "pills"}
              onClick={() => setView("pills")}
            >
              <LayoutGrid strokeWidth={1.9} aria-hidden="true" /> Pills
            </button>
          </div>
        </div>

        <label className="pb-search">
          <Search strokeWidth={1.8} aria-hidden="true" />
          <span className="sr-only">Search biomarkers</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a biomarker…"
          />
        </label>

        <div className="pb-catalog doc-card">
          {visibleCategories.map((category) => {
            const visibleIds = category.biomarkerIds.filter((id) => matchesQuery(byCode.get(id), query));
            if (visibleIds.length === 0) return null;
            const selectedCount = category.biomarkerIds.filter((id) => selected.has(id)).length;
            const allSelected = selectedCount === category.biomarkerIds.length;
            const isOpen = view === "pills" || query.length > 0 || expanded.has(category.name);

            return (
              <div className="pb-cat" key={category.name}>
                <div className="pb-cat-head">
                  {view === "list" ? (
                    <button
                      type="button"
                      className="pb-cat-toggle"
                      aria-expanded={isOpen}
                      onClick={() => toggleExpanded(category.name)}
                    >
                      <ChevronDown
                        className={`pb-cat-chevron ${isOpen ? "is-open" : ""}`}
                        strokeWidth={2}
                        aria-hidden="true"
                      />
                      <span className="pb-cat-name">{category.name}</span>
                      <span className={`pb-cat-count ${selectedCount > 0 ? "is-active" : ""}`}>
                        {selectedCount}/{category.biomarkerIds.length}
                      </span>
                    </button>
                  ) : (
                    <>
                      <span className="pb-cat-name">{category.name}</span>
                      <span className={`pb-cat-count ${selectedCount > 0 ? "is-active" : ""}`}>
                        {selectedCount}/{category.biomarkerIds.length}
                      </span>
                    </>
                  )}
                  <button
                    type="button"
                    className="pb-cat-all"
                    onClick={() => setCodes(category.biomarkerIds, !allSelected)}
                  >
                    {allSelected ? "Clear" : "Select all"}
                  </button>
                </div>

                {view === "pills" ? (
                  <ul className="pb-markers">
                    {visibleIds.map((id) => {
                      const marker = byCode.get(id);
                      if (!marker) return null;
                      const checked = selected.has(id);
                      return (
                        <li key={`${category.name}-${id}`}>
                          <button
                            type="button"
                            aria-pressed={checked}
                            className={`pb-marker ${checked ? "is-on" : ""}`}
                            title={marker.whatItMeasures || undefined}
                            onClick={() => toggleCode(id)}
                          >
                            {checked ? (
                              <Check strokeWidth={2.2} aria-hidden="true" />
                            ) : (
                              <Plus strokeWidth={2} aria-hidden="true" />
                            )}
                            {marker.displayName}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  isOpen && (
                    <ul className="pb-rows">
                      {visibleIds.map((id) => {
                        const marker = byCode.get(id);
                        if (!marker) return null;
                        const checked = selected.has(id);
                        const alias = marker.aliases.find((value) => value !== marker.displayName);
                        return (
                          <li key={`${category.name}-${id}`}>
                            <label
                              className={`pb-row ${checked ? "is-checked" : ""}`}
                              title={marker.whatItMeasures || undefined}
                            >
                              <input type="checkbox" checked={checked} onChange={() => toggleCode(id)} />
                              <span className="pb-row-name">
                                {marker.displayName}
                                {alias && <span className="pb-row-alias">{alias}</span>}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  )
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="pb-footer">
        <div className="pb-footer-count">
          <strong>{selected.size}</strong> marker{selected.size === 1 ? "" : "s"} selected
          <span className="pb-footer-breakdown">
            {" · "}
            {omittedCount} omitted
          </span>
        </div>
        {error && <span className="doc-error">{error}</span>}
        <button
          type="button"
          className="pb-footer-reset"
          onClick={restoreAdvancedBaseline}
        >
          Restore Advanced Baseline
        </button>
        <button
          ref={reviewButtonRef}
          type="button"
          className="p-btn"
          disabled={selected.size === 0}
          onClick={() => {
            setError(null);
            setReviewing(true);
          }}
        >
          Review panel
        </button>
      </div>

      {reviewing && (
        <PanelReview
          byCode={byCode}
          categories={visibleCategories}
          selected={selected}
          saving={saving}
          error={error}
          onClose={closeReview}
          onConfirm={() => void save()}
        />
      )}
      {quote && (
        <PanelQuote
          quote={quote}
          onEdit={() => {
            setQuote(null);
            requestAnimationFrame(() => reviewButtonRef.current?.focus());
          }}
          onDone={onSaved}
        />
      )}
    </main>
  );
}

function discountAmount(amountMinor: number) {
  return amountMinor > 0 ? `−${formatMyr(amountMinor)}` : formatMyr(0);
}

function keepFocusInDialog(event: KeyboardEvent, dialog: HTMLElement | null) {
  if (event.key !== "Tab" || !dialog) return;
  const focusable = [...dialog.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => !element.hasAttribute("hidden"));
  if (focusable.length === 0) {
    event.preventDefault();
    dialog.focus();
    return;
  }
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/** The final step is deliberately member-facing: no clinical counts or
 * pricing formula, only the package, applied adjustments and next step. */
function PanelQuote({
  quote,
  onEdit,
  onDone,
}: {
  quote: LabOrderQuote;
  onEdit: () => void;
  onDone: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (event: KeyboardEvent) => keepFocusInDialog(event, dialogRef.current);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="pb-review-layer" role="presentation">
      <div className="pb-review-backdrop" aria-hidden="true" />
      <div
        ref={dialogRef}
        className="pb-review pb-quote"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pb-quote-title"
        aria-describedby="pb-quote-next"
        tabIndex={-1}
      >
        <header className="pb-quote-head">
          <span className="pb-quote-share">
            <ReceiptText strokeWidth={1.7} aria-hidden="true" />
            To share with the Verae member
          </span>
          <h2 id="pb-quote-title">Your personalized blood baseline</h2>
          <p>Here is a clear summary of what is included and the amount payable.</p>
        </header>

        <div className="pb-quote-body">
          <section className="pb-quote-package" aria-label="Package inclusions">
            <div className="pb-quote-package-head">
              <div>
                <span>Advanced Blood Baseline</span>
                <small>Comprehensive, doctor-personalized preventive care</small>
              </div>
              <strong>{formatMyr(quote.baseAmountMinor)}</strong>
            </div>
            <ul>
              {[
                "Personalized advanced blood test",
                "Results interpretation",
                "Personalized care plan construction",
                "2nd teleconsult with doctor",
              ].map((item) => (
                <li key={item}><Check strokeWidth={2} aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </section>

          <dl className="pb-quote-breakdown">
            <div>
              <dt>Doctor personalization adjustment</dt>
              <dd>{discountAmount(quote.personalizationDiscountMinor)}</dd>
            </div>
            {quote.isFoundingMember && (
              <div>
                <dt>Founding member discount</dt>
                <dd>{discountAmount(quote.foundingDiscountMinor)}</dd>
              </div>
            )}
            <div className="pb-quote-total">
              <dt>Total</dt>
              <dd>{formatMyr(quote.totalAmountMinor)}</dd>
            </div>
          </dl>

          <p className="pb-quote-next" id="pb-quote-next">
            A Verae support member will be in touch after this teleconsult to guide you on next steps.
          </p>
        </div>

        <footer className="pb-review-foot pb-quote-foot">
          <button type="button" className="p-btn-ghost" onClick={onEdit}>Edit panel</button>
          <button type="button" className="p-btn" onClick={onDone}>Done</button>
        </footer>
      </div>
    </div>
  );
}

/** Confirmation overlay: only the selected markers, grouped by the categories
    they'll be reported under, then one explicit confirm. */
function PanelReview({
  byCode,
  categories,
  selected,
  saving,
  error,
  onClose,
  onConfirm,
}: {
  byCode: Map<string, Biomarker>;
  categories: BiomarkerCategory[];
  selected: Set<string>;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      else keepFocusInDialog(event, dialogRef.current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const groups = categories.map((category) => ({
    name: category.name,
    markers: category.biomarkerIds.filter((id) => selected.has(id)),
  })).filter((group) => group.markers.length > 0);

  return (
    <div className="pb-review-layer" role="presentation">
      <button className="pb-review-backdrop" type="button" aria-label="Close review" onClick={onClose} />
      <div
        ref={dialogRef}
        className="pb-review"
        role="dialog"
        aria-modal="true"
        aria-label="Review panel before saving"
        tabIndex={-1}
      >
        <header className="pb-review-head">
          <h2 className="doc-card-title">Review the panel</h2>
          <span className="pb-review-count">
            {selected.size} marker{selected.size === 1 ? "" : "s"}
          </span>
        </header>
        <div className="pb-review-body">
          {groups.map((group) => (
            <div className="pb-review-group" key={group.name}>
              <span className="doc-group-label">{group.name}</span>
              <ul>
                {group.markers.map((id) => (
                  <li key={id}>{byCode.get(id)?.displayName ?? id}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <footer className="pb-review-foot">
          {error && <span className="doc-error">{error}</span>}
          <button type="button" className="p-btn-ghost" onClick={onClose}>
            Keep editing
          </button>
          <button type="button" className="p-btn" disabled={saving} onClick={onConfirm}>
            {saving ? "Saving…" : "Confirm & save"}
          </button>
        </footer>
      </div>
    </div>
  );
}

export default PanelBuilder;
