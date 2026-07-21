import { useEffect, useMemo, useState } from "react";
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
  Search,
  Shield,
  Zap,
} from "lucide-react";
import { useBiomarkerCatalog } from "../lib/api/catalog";
import type { Biomarker, BiomarkerCategory } from "../member-v2/screens/results/types";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import { fetchLabOrder, saveLabOrder } from "../lib/api/labOrder";
import { BASELINE_BUNDLE, offerableBundles, recommendedCodes } from "./recommendedPanel";
import { matchesQuery, toRecommendationInput } from "./caseSignals";

type CatalogView = "list" | "pills";

/** Card corner icon per panel; the reason copy moved to the tooltip. */
const PANEL_ICONS: Record<string, typeof HeartPulse> = {
  baseline: FlaskConical,
  cardiovascular: HeartPulse,
  metabolic: Droplets,
  "thyroid-fatigue": Zap,
  "hormones-male": Dna,
  "hormones-female": Dna,
  stress: Brain,
  prostate: Shield,
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

  const profileInput = useMemo(() => toRecommendationInput(detail), [detail]);
  // A recommendation can name a marker that has since been retired; only offer
  // what the catalog still carries.
  const recommended = useMemo(
    () => recommendedCodes(profileInput).filter((code) => byCode.has(code)),
    [profileInput, byCode],
  );
  const recommendedSet = useMemo(() => new Set(recommended), [recommended]);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [view, setView] = useState<CatalogView>("list");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing panel; otherwise the recommendation stands as the draft.
  // Waits for the catalog, since the recommendation is filtered against it and
  // a saved panel may still name markers that have since been retired.
  useEffect(() => {
    if (catalogLoading) return;
    let cancelled = false;
    fetchLabOrder(memberId).then(({ data }) => {
      if (cancelled) return;
      const saved = data?.biomarker_codes.filter((code) => byCode.has(code)) ?? [];
      setSelected(new Set(saved.length > 0 ? saved : recommended));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId, catalogLoading, byCode, recommended]);

  const toggleCode = (code: string) =>
    setSelected((current) => {
      const next = new Set(current);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });

  const toggleExpanded = (name: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const setCodes = (codes: string[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const code of codes) (on ? next.add(code) : next.delete(code));
      return next;
    });

  const addedCount = [...selected].filter((id) => !recommendedSet.has(id)).length;

  // Hormones is a single category for every member now, so there is no
  // opposite-sex category to hide. Sex-appropriateness lives in the panel
  // bundles (PanelBundle.sexSpecific), which still keeps PSA off a female
  // member's draft while leaving the doctor free to order it.
  const visibleCategories = catalog.categories;

  const subtext = [detail.age ? `${detail.age}y` : null, detail.sex].filter(Boolean).join(" · ");

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await saveLabOrder(memberId, [...selected]);
    setSaving(false);
    if (err) setError(err);
    else onSaved();
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

      {/* Panels this member's profile points to arrive pre-selected; the rest
          sit unselected. The trigger rationale lives in the card tooltip. */}
      <section aria-label="Panels">
        <div className="pb-panels">
          {[BASELINE_BUNDLE, ...offerableBundles(profileInput.sex)].map((bundle) => {
            const inPanel = bundle.codes.filter((code) => selected.has(code)).length;
            const active = inPanel === bundle.codes.length;
            const Icon = PANEL_ICONS[bundle.id] ?? FlaskConical;
            return (
              <button
                key={bundle.id}
                type="button"
                aria-pressed={active}
                title={bundle.reason}
                className={`pb-panel ${active ? "is-active" : ""}`}
                onClick={() => setCodes(bundle.codes, !active)}
              >
                <span className="pb-panel-head">
                  <strong>{bundle.label}</strong>
                  {active && <Check strokeWidth={2.2} aria-hidden="true" />}
                </span>
                <span className="pb-panel-meta">
                  {inPanel > 0 && !active
                    ? `${inPanel} of ${bundle.codes.length} markers`
                    : `${bundle.codes.length} markers`}
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
            {selected.size - addedCount} recommended
            {addedCount > 0 ? ` · ${addedCount} added` : ""}
          </span>
        </div>
        {error && <span className="doc-error">{error}</span>}
        <button
          type="button"
          className="pb-footer-reset"
          onClick={() => setSelected(new Set(recommended))}
        >
          Reset to recommended
        </button>
        <button
          type="button"
          className="p-btn"
          disabled={selected.size === 0}
          onClick={() => setReviewing(true)}
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
          onClose={() => setReviewing(false)}
          onConfirm={() => void save()}
        />
      )}
    </main>
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
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = categories.map((category) => ({
    name: category.name,
    markers: category.biomarkerIds.filter((id) => selected.has(id)),
  })).filter((group) => group.markers.length > 0);

  return (
    <div className="pb-review-layer" role="presentation">
      <button className="pb-review-backdrop" type="button" aria-label="Close review" onClick={onClose} />
      <div className="pb-review" role="dialog" aria-modal="true" aria-label="Review panel before saving">
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
