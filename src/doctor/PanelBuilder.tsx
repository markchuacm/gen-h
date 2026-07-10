import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info, Search } from "lucide-react";
import { BIOMARKERS, BIOMARKER_CATEGORIES } from "../member-v2/screens/results/biomarkerData";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import { fetchLabOrder, saveLabOrder } from "../lib/api/labOrder";
import { BASELINE_BUNDLE, PANEL_BUNDLES, recommendedCodes, relevantBundles } from "./recommendedPanel";
import { CLEAR_ANSWERS, matchesQuery, toRecommendationInput } from "./caseSignals";

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
  const catalog = useMemo(() => new Map(BIOMARKERS.map((marker) => [marker.id, marker])), []);

  const profileInput = useMemo(() => toRecommendationInput(detail), [detail]);

  const recommended = useMemo(() => recommendedCodes(profileInput), [profileInput]);
  const recommendedSet = useMemo(() => new Set(recommended), [recommended]);
  const suggestedBundles = useMemo(() => relevantBundles(profileInput), [profileInput]);
  const otherBundles = useMemo(
    () => PANEL_BUNDLES.filter((bundle) => !bundle.applies(profileInput)),
    [profileInput],
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set(recommended));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openInfo, setOpenInfo] = useState<Set<string>>(new Set());
  const [showAllBundles, setShowAllBundles] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing panel; otherwise the recommendation stands as the draft.
  useEffect(() => {
    let cancelled = false;
    fetchLabOrder(memberId).then(({ data }) => {
      if (cancelled) return;
      if (data && data.biomarker_codes.length > 0) {
        setSelected(new Set(data.biomarker_codes));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const toggleSet = <T,>(setter: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) =>
    setter((current) => {
      const next = new Set(current);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });

  const toggleCode = (code: string) => toggleSet(setSelected, code);

  const setCodes = (codes: string[], on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      for (const code of codes) (on ? next.add(code) : next.delete(code));
      return next;
    });

  const bundleActive = (codes: string[]) => codes.every((code) => selected.has(code));

  const addedCount = [...selected].filter((id) => !recommendedSet.has(id)).length;

  const subtext = [detail.age ? `${detail.age}y` : null, detail.sex].filter(Boolean).join(" · ");
  const contextGroups = [
    { label: "Family history", items: profileInput.family, flag: true },
    { label: "Reported symptoms", items: profileInput.symptoms, flag: false },
    { label: "Goals", items: profileInput.goals, flag: false },
  ].filter((group) => group.items.length > 0);

  const save = async () => {
    setSaving(true);
    setError(null);
    const { error: err } = await saveLabOrder(memberId, [...selected]);
    setSaving(false);
    if (err) setError(err);
    else onSaved();
  };

  if (loading) {
    return (
      <main className="doc-page">
        <button type="button" className="doc-back" onClick={onBack}>
          ← Case brief
        </button>
        <p className="doc-muted">Loading panel…</p>
      </main>
    );
  }

  return (
    <main className="doc-page pb">
      <button type="button" className="doc-back" onClick={onBack}>
        ← Case brief
      </button>

      <header className="doc-head">
        <div>
          <span className="doc-eyebrow">Blood panel</span>
          <h1>{detail.memberName ?? "Member"}</h1>
          {subtext && <p className="doc-sub">{subtext}</p>}
        </div>
      </header>

      {contextGroups.length > 0 && (
        <section className="pb-context" aria-label="Clinical context">
          {contextGroups.map((group) => (
            <div className="pb-context-group" key={group.label}>
              <span className="pb-context-label">{group.label}</span>
              <ul className="pb-context-chips">
                {group.items.map((item) => (
                  <li key={item} className={group.flag && !CLEAR_ANSWERS.has(item) ? "is-flag" : ""}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      <div className="pb-bundles" aria-label="Quick-add panels">
        {[BASELINE_BUNDLE, ...suggestedBundles].map((bundle) => {
          const active = bundleActive(bundle.codes);
          return (
            <button
              key={bundle.id}
              type="button"
              title={bundle.reason}
              className={`pb-bundle ${bundle.id === "baseline" ? "pb-bundle--baseline" : ""} ${active ? "is-active" : ""}`}
              onClick={() => setCodes(bundle.codes, !active)}
            >
              {bundle.label}
              <span>{bundle.codes.length}</span>
            </button>
          );
        })}
        {otherBundles.length > 0 && (
          <button
            type="button"
            className="pb-bundles-more"
            aria-expanded={showAllBundles}
            onClick={() => setShowAllBundles((open) => !open)}
          >
            {showAllBundles ? "Fewer panels" : `More panels (${otherBundles.length})`}
          </button>
        )}
        {showAllBundles &&
          otherBundles.map((bundle) => {
            const active = bundleActive(bundle.codes);
            return (
              <button
                key={bundle.id}
                type="button"
                title={bundle.reason}
                className={`pb-bundle pb-bundle--extra ${active ? "is-active" : ""}`}
                onClick={() => setCodes(bundle.codes, !active)}
              >
                {bundle.label}
                <span>{bundle.codes.length}</span>
              </button>
            );
          })}
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

      <div className="pb-cats">
        {BIOMARKER_CATEGORIES.map((category) => {
          const visibleIds = category.biomarkerIds.filter((id) => matchesQuery(catalog.get(id), query));
          if (visibleIds.length === 0) return null;
          const selectedCount = category.biomarkerIds.filter((id) => selected.has(id)).length;
          const allSelected = selectedCount === category.biomarkerIds.length;
          const isOpen = expanded.has(category.name) || query.length > 0;

          return (
            <section className="pb-cat" key={category.name}>
              <div className="pb-cat-head">
                <button
                  type="button"
                  className="pb-cat-toggle"
                  aria-expanded={isOpen}
                  onClick={() => toggleSet(setExpanded, category.name)}
                >
                  <ChevronDown className={`pb-cat-chevron ${isOpen ? "is-open" : ""}`} strokeWidth={2} aria-hidden="true" />
                  <span className="pb-cat-name">{category.name}</span>
                  <span className={`pb-cat-count ${selectedCount > 0 ? "is-active" : ""}`}>
                    {selectedCount}/{category.biomarkerIds.length}
                  </span>
                </button>
                <button
                  type="button"
                  className="pb-cat-all"
                  onClick={() => setCodes(category.biomarkerIds, !allSelected)}
                >
                  {allSelected ? "Clear" : "Select all"}
                </button>
              </div>

              {isOpen && (
                <ul className="pb-rows">
                  {visibleIds.map((id) => {
                    const marker = catalog.get(id);
                    if (!marker) return null;
                    const checked = selected.has(id);
                    const infoOpen = openInfo.has(id);
                    const alias = marker.aliases.find((value) => value !== marker.displayName);
                    return (
                      <li key={`${category.name}-${id}`} className={`pb-row ${checked ? "is-checked" : ""}`}>
                        <label className="pb-check">
                          <input type="checkbox" checked={checked} onChange={() => toggleCode(id)} />
                          <span className="pb-row-name">
                            {marker.displayName}
                            {alias && <span className="pb-row-alias">{alias}</span>}
                            {checked && !recommendedSet.has(id) && (
                              <span className="pb-row-tag">Added</span>
                            )}
                          </span>
                        </label>
                        {marker.whatItMeasures && (
                          <button
                            type="button"
                            className={`pb-info-btn ${infoOpen ? "is-open" : ""}`}
                            aria-label={`What ${marker.displayName} measures`}
                            aria-expanded={infoOpen}
                            onClick={() => toggleSet(setOpenInfo, id)}
                          >
                            <Info strokeWidth={1.8} aria-hidden="true" />
                          </button>
                        )}
                        {infoOpen && marker.whatItMeasures && (
                          <p className="pb-info">{marker.whatItMeasures}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>

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
          className="doc-primary"
          disabled={saving || selected.size === 0}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save panel"}
        </button>
      </div>
    </main>
  );
}

export default PanelBuilder;
