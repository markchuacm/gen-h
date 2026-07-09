import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info, Search, Sparkles } from "lucide-react";
import { BIOMARKERS, BIOMARKER_CATEGORIES } from "../member-v2/screens/results/biomarkerData";
import type { Biomarker } from "../member-v2/screens/results/types";
import type { DoctorCaseDetail } from "../lib/api/doctor";
import { fetchLabOrder, saveLabOrder } from "../lib/api/labOrder";
import { recommendedCodes, relevantBundles } from "./recommendedPanel";
import type { RecommendationInput } from "./recommendedPanel";

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function matchesQuery(marker: Biomarker | undefined, query: string) {
  if (!query) return true;
  if (!marker) return false;
  const haystack = [marker.displayName, marker.name, ...marker.aliases].join(" ").toLowerCase();
  return haystack.includes(query.toLowerCase());
}

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

  const profileInput = useMemo<RecommendationInput>(
    () => ({
      sex: detail.sex ?? "",
      age: detail.age,
      goals: asStringList(detail.onboarding.goals),
      symptoms: asStringList(detail.onboarding.symptoms),
      family: asStringList(detail.onboarding.family),
    }),
    [detail],
  );

  const recommended = useMemo(() => recommendedCodes(profileInput), [profileInput]);
  const bundles = useMemo(() => relevantBundles(profileInput), [profileInput]);

  const [selected, setSelected] = useState<Set<string>>(() => new Set(recommended));
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [openInfo, setOpenInfo] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [existingOrder, setExistingOrder] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load any existing panel; otherwise the recommendation stands as the draft.
  useEffect(() => {
    let cancelled = false;
    fetchLabOrder(memberId).then(({ data }) => {
      if (cancelled) return;
      if (data && data.biomarker_codes.length > 0) {
        setSelected(new Set(data.biomarker_codes));
        setExistingOrder(true);
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

  const flags = [
    detail.age ? `${detail.age}` : null,
    detail.sex ? detail.sex[0].toUpperCase() : null,
  ]
    .filter(Boolean)
    .join("");
  const contextBits = [
    flags || null,
    profileInput.family.length ? `fam: ${profileInput.family.slice(0, 3).join(", ")}` : null,
    profileInput.symptoms.length ? profileInput.symptoms.slice(0, 2).join(", ") : null,
  ].filter(Boolean);

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
          <span className="doc-eyebrow">BLOOD PANEL</span>
          <h1>{detail.memberName ?? "Member"}</h1>
          {contextBits.length > 0 && <p className="doc-sub">{contextBits.join(" · ")}</p>}
        </div>
      </header>

      <div className="pb-banner">
        <Sparkles strokeWidth={1.7} aria-hidden="true" />
        <p>
          {existingOrder
            ? "Editing the saved panel. "
            : `${recommended.length} markers recommended from ${detail.memberName?.split(" ")[0] ?? "this member"}'s profile. `}
          Adjust anything before saving.
        </p>
        <button type="button" className="pb-reset" onClick={() => setSelected(new Set(recommended))}>
          Reset to recommended
        </button>
      </div>

      {bundles.length > 0 && (
        <div className="pb-bundles" aria-label="Quick-add panels for this member">
          {bundles.map((bundle) => {
            const active = bundleActive(bundle.codes);
            return (
              <button
                key={bundle.id}
                type="button"
                title={bundle.reason}
                className={`pb-bundle ${active ? "is-active" : ""}`}
                onClick={() => setCodes(bundle.codes, !active)}
              >
                {bundle.label}
                <span>{bundle.codes.length}</span>
              </button>
            );
          })}
        </div>
      )}

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
        </div>
        {error && <span className="doc-error">{error}</span>}
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
