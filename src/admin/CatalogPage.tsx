import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCatalogBiomarkers, setBiomarkerActive } from "../lib/api/admin";
import type { CatalogBiomarkerRow } from "../lib/api/admin";
import { invalidateCatalog } from "../lib/api/catalog";

// Activate/deactivate for the biomarker panel. Deactivating hides a marker from
// the member dashboard and the doctor's panel picker without deleting it, so a
// marker dropped from the standard panel can be reintroduced later without a
// deploy. Retired markers stay listed here — they are invisible everywhere else
// by design, so this page is the only way back.

type Filter = "active" | "retired" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "retired", label: "Retired" },
  { key: "all", label: "All" },
];

function CatalogRow({ marker, onChange }: { marker: CatalogBiomarkerRow; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const usage = Number(marker.usage_count);

  return (
    <tr>
      <td>{marker.display_name}</td>
      <td className="adm-muted">{marker.id}</td>
      <td>{marker.categories.join(", ") || "—"}</td>
      <td>{marker.unit || "—"}</td>
      <td>
        <span className={`adm-pill ${marker.is_active ? "adm-pill-released" : "adm-pill-none"}`}>
          {marker.is_active ? "Active" : "Retired"}
        </span>
      </td>
      {/* Shows what members would lose sight of before an admin retires it. */}
      <td className="adm-num">{usage > 0 ? usage : "—"}</td>
      <td className="adm-row-actions">
        <button
          type="button"
          className="adm-link"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            await setBiomarkerActive(marker.id, !marker.is_active);
            // The catalog is cached per session; drop it so the member and
            // doctor views reflect the change without a reload.
            invalidateCatalog();
            await onChange();
            setBusy(false);
          }}
        >
          {marker.is_active ? "Deactivate" : "Activate"}
        </button>
      </td>
    </tr>
  );
}

function CatalogPage() {
  const [markers, setMarkers] = useState<CatalogBiomarkerRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const reload = useCallback(async () => {
    const result = await fetchCatalogBiomarkers();
    if (result.error) setError(result.error);
    else {
      setMarkers(result.data);
      setError(null);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const counts = useMemo(() => ({
    active: (markers ?? []).filter((marker) => marker.is_active).length,
    retired: (markers ?? []).filter((marker) => !marker.is_active).length,
    all: (markers ?? []).length,
  }), [markers]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (markers ?? []).filter((marker) => {
      if (filter === "active" && !marker.is_active) return false;
      if (filter === "retired" && marker.is_active) return false;
      if (!term) return true;
      return (
        marker.display_name.toLowerCase().includes(term) ||
        marker.id.includes(term) ||
        marker.categories.some((category) => category.toLowerCase().includes(term))
      );
    });
  }, [markers, query, filter]);

  return (
    <section className="adm-page">
      <div className="adm-page-head">
        <div>
          <p className="p-eyebrow">Admin · Biomarkers</p>
          <h1 className="p-h1">Biomarker panel</h1>
        </div>
        <div className="adm-page-head-actions">
          <input
            className="adm-search"
            type="search"
            placeholder="Search name, code or category"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search biomarkers"
          />
        </div>
      </div>

      <p className="adm-muted">
        Deactivating a marker hides it from members and from the doctor&rsquo;s panel picker. Nothing is
        deleted, so a marker can be brought back here at any time.
      </p>

      <div className="adm-filters" role="tablist" aria-label="Filter biomarkers">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`adm-chip ${filter === option.key ? "is-active" : ""}`}
            onClick={() => setFilter(option.key)}
          >
            {option.label}
            <span className="adm-chip-count">{counts[option.key]}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="adm-error">Couldn&rsquo;t load biomarkers ({error}).</p>}
      {markers === null && !error && <p className="adm-muted">Loading biomarkers…</p>}
      {markers !== null && visible.length === 0 && <p className="adm-muted">No biomarkers match.</p>}

      {visible.length > 0 && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Biomarker</th><th>Code</th><th>Category</th><th>Unit</th>
                <th>Status</th><th>Results</th><th />
              </tr>
            </thead>
            <tbody>
              {visible.map((marker) => <CatalogRow key={marker.id} marker={marker} onChange={reload} />)}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default CatalogPage;
