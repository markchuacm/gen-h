// The review step of PDF ingest: every parsed biomarker as an editable row the
// admin confirms, corrects, or excludes before anything is written. Nothing
// here commits — that's the modal's job. Confidence and warnings are surfaced
// per row so a bad parse is obvious at a glance.
import { useMemo, useState } from "react";
import type { BiomarkerInput } from "../../lib/api/admin";
import type { IngestRow } from "./types";
import { rebuildForCode } from "./ingestPipeline";
import type { RangeCtx } from "./deriveStatus";

const STATUS_LABELS: Record<string, string> = {
  optimal: "Optimal",
  at_risk: "At risk",
  needs_attention: "Needs attention",
};

const numOrNull = (v: string): number | null => (v.trim() === "" ? null : Number(v));

function ConfidencePill({ value, matched }: { value: number; matched: boolean }) {
  if (!matched) return <span className="adm-conf adm-conf-none">No match</span>;
  const tier = value >= 0.8 ? "high" : value >= 0.5 ? "mid" : "low";
  return <span className={`adm-conf adm-conf-${tier}`}>{Math.round(value * 100)}%</span>;
}

function Row({
  row,
  ctx,
  onChange,
}: {
  row: IngestRow;
  ctx: RangeCtx;
  onChange: (next: IngestRow) => void;
}) {
  const { input, parsed, match } = row;
  const setInput = (patch: Partial<BiomarkerInput>) =>
    onChange({ ...row, input: { ...input, ...patch } });

  return (
    <tbody className={row.include ? "" : "is-excluded"}>
      <tr>
        <td className="adm-ing-inc">
          <input
            type="checkbox"
            checked={row.include}
            aria-label="Include this biomarker"
            onChange={(e) => onChange({ ...row, include: e.target.checked })}
          />
        </td>
        <td>
          <input
            className="adm-ing-code"
            list="bio-codes"
            value={input.biomarker_code}
            placeholder="code"
            onChange={(e) => onChange(rebuildForCode(row, e.target.value.trim(), ctx))}
          />
        </td>
        <td>
          <input
            value={input.biomarker_name ?? ""}
            onChange={(e) => setInput({ biomarker_name: e.target.value || null })}
          />
        </td>
        <td className="adm-ing-val">
          <input
            type="number"
            step="any"
            value={input.value_numeric ?? ""}
            onChange={(e) => setInput({ value_numeric: numOrNull(e.target.value) })}
          />
          {input.value_numeric == null && (
            <input
              value={input.value_text ?? ""}
              placeholder="text"
              onChange={(e) => setInput({ value_text: e.target.value || null })}
            />
          )}
        </td>
        <td className="adm-ing-unit">
          <input
            className={match.unitMismatch ? "is-warn" : ""}
            value={input.unit ?? ""}
            onChange={(e) => setInput({ unit: e.target.value || null })}
          />
        </td>
        <td className="adm-ing-range">
          <input type="number" step="any" value={input.ref_low ?? ""} placeholder="low"
            onChange={(e) => setInput({ ref_low: numOrNull(e.target.value) })} />
          <input type="number" step="any" value={input.ref_high ?? ""} placeholder="high"
            onChange={(e) => setInput({ ref_high: numOrNull(e.target.value) })} />
        </td>
        <td>
          <select
            value={input.status}
            onChange={(e) => setInput({ status: e.target.value as BiomarkerInput["status"] })}
          >
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </td>
        <td><ConfidencePill value={match.confidence} matched={!!match.code} /></td>
      </tr>
      <tr className="adm-ing-source">
        <td />
        <td colSpan={7}>
          <span className="adm-ing-raw" title={parsed.raw}>p{parsed.page}: {parsed.raw}</span>
          {row.warnings.map((w) => (
            <span key={w} className="adm-ing-warn">{w}</span>
          ))}
        </td>
      </tr>
    </tbody>
  );
}

export default function IngestReviewTable({
  rows,
  unmatched,
  ctx,
  onRowsChange,
}: {
  rows: IngestRow[];
  unmatched: string[];
  ctx: RangeCtx;
  onRowsChange: (rows: IngestRow[]) => void;
}) {
  const [showUnmatched, setShowUnmatched] = useState(false);

  const includedCount = useMemo(() => rows.filter((r) => r.include).length, [rows]);

  const replaceRow = (next: IngestRow) =>
    onRowsChange(rows.map((r) => (r.id === next.id ? next : r)));

  const addBlankRow = (seedRaw?: string) => {
    const blank: IngestRow = {
      id: `manual-${Date.now()}`,
      include: true,
      parsed: {
        raw: seedRaw ?? "(added manually)",
        page: 0,
        labelText: "",
        value: null,
        valueText: null,
        unit: null,
        refLow: null,
        refHigh: null,
        refComparator: null,
        labFlag: null,
      },
      match: { code: null, name: "", category: null, unit: null, confidence: 0, via: "none", unitMismatch: false },
      input: {
        biomarker_code: "",
        biomarker_name: null,
        category: null,
        value_numeric: null,
        value_text: null,
        unit: null,
        ref_low: null,
        ref_high: null,
        optimal_low: null,
        optimal_high: null,
        status: "optimal",
        notes: null,
      },
      warnings: [],
    };
    onRowsChange([...rows, blank]);
  };

  return (
    <div className="adm-ing-review">
      <div className="adm-ing-review-head">
        <span className="adm-group-label">{includedCount} of {rows.length} markers selected</span>
        <button type="button" className="adm-btn-ghost" onClick={() => addBlankRow()}>＋ Add row</button>
      </div>

      <div className="adm-table-wrap adm-ing-table-wrap">
        <table className="adm-table adm-ing-table">
          <thead>
            <tr>
              <th aria-label="Include" />
              <th>Code</th>
              <th>Name</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Match</th>
            </tr>
          </thead>
          {rows.map((r) => (
            <Row key={r.id} row={r} ctx={ctx} onChange={replaceRow} />
          ))}
        </table>
      </div>

      {unmatched.length > 0 && (
        <div className="adm-ing-unmatched">
          <button
            type="button"
            className="adm-link"
            onClick={() => setShowUnmatched((s) => !s)}
          >
            {showUnmatched ? "Hide" : "Show"} {unmatched.length} unrecognised lines
          </button>
          {showUnmatched && (
            <ul>
              {unmatched.map((line, i) => (
                <li key={i}>
                  <span title={line}>{line}</span>
                  <button type="button" className="adm-link" onClick={() => addBlankRow(line)}>
                    ＋ add as row
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
