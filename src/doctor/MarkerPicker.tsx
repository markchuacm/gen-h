import { useMemo, useState } from "react";
import { AlertTriangle, Plus, X } from "lucide-react";
import { BIOMARKERS } from "../member-v2/screens/results/biomarkerData";
import { matchesQuery } from "./caseSignals";

const MAX_SUGGESTIONS = 8;

/** Section marker chips, constrained to biomarker catalog displayNames so the
    member's chips always link to a real result. Markers loaded from the DB
    that don't match the catalog (legacy free text) are kept — never silently
    dropped — but flagged as unlinked. */
function MarkerPicker({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const [query, setQuery] = useState("");

  const catalogNames = useMemo(() => new Set(BIOMARKERS.map((marker) => marker.displayName)), []);
  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return BIOMARKERS.filter(
      (marker) => matchesQuery(marker, query.trim()) && !value.includes(marker.displayName),
    ).slice(0, MAX_SUGGESTIONS);
  }, [query, value]);

  const add = (name: string) => {
    onChange([...value, name]);
    setQuery("");
  };

  const remove = (name: string) => onChange(value.filter((marker) => marker !== name));

  return (
    <div className="doc-marker-picker">
      {value.length > 0 && (
        <ul className="doc-chips">
          {value.map((marker) => {
            const unlinked = !catalogNames.has(marker);
            return (
              <li
                key={marker}
                className={unlinked ? "is-flag" : ""}
                title={unlinked ? "Not a catalog biomarker — won't link to the member's results" : undefined}
              >
                {unlinked && <AlertTriangle strokeWidth={1.9} aria-hidden="true" />}
                {marker}
                <button
                  type="button"
                  className="doc-chip-remove"
                  aria-label={`Remove ${marker}`}
                  onClick={() => remove(marker)}
                >
                  <X strokeWidth={2} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <input
        value={query}
        placeholder="Search the biomarker catalog to add a marker…"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && suggestions.length > 0) {
            event.preventDefault();
            add(suggestions[0].displayName);
          }
        }}
      />
      {suggestions.length > 0 && (
        <ul className="doc-marker-suggest" aria-label="Matching biomarkers">
          {suggestions.map((marker) => (
            <li key={marker.id}>
              <button type="button" onClick={() => add(marker.displayName)}>
                <Plus strokeWidth={2} aria-hidden="true" />
                {marker.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && suggestions.length === 0 && (
        <p className="doc-muted doc-marker-empty">No catalog biomarker matches "{query.trim()}".</p>
      )}
    </div>
  );
}

export default MarkerPicker;
