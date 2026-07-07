import { useEffect, useMemo, useState } from "react";
import { fetchAdminCases, STAGE_LABELS } from "../lib/api/admin";
import type { AdminCaseRow } from "../lib/api/admin";

type FilterKey =
  | "all"
  | "needs_action"
  | "profile_incomplete"
  | "doctor_unassigned"
  | "results_pending"
  | "results_ready"
  | "care_plan_drafting"
  | "completed";

const FILTERS: { key: FilterKey; label: string; test: (c: AdminCaseRow) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "needs_action", label: "Needs action", test: (c) => c.nextOwner === "admin" },
  { key: "profile_incomplete", label: "Profile incomplete", test: (c) => c.onboardingStatus !== "completed" },
  { key: "doctor_unassigned", label: "Doctor unassigned", test: (c) => !c.doctorId },
  { key: "results_pending", label: "Results pending", test: (c) => c.resultsStatus !== "released" },
  { key: "results_ready", label: "Results ready", test: (c) => c.resultsStatus === "released" },
  { key: "care_plan_drafting", label: "Care plan drafting", test: (c) => c.carePlanStatus === "draft" },
  { key: "completed", label: "Completed", test: (c) => c.nextOwner === "done" },
];

function StatusPill({ value }: { value: "none" | "draft" | "released" }) {
  const label = value === "none" ? "—" : value === "draft" ? "Draft" : "Released";
  return <span className={`adm-pill adm-pill-${value}`}>{label}</span>;
}

function CasesList({ onOpen }: { onOpen: (memberId: string) => void }) {
  const [cases, setCases] = useState<AdminCaseRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchAdminCases().then(({ data, error: err }) => {
      if (err) setError(err);
      else setCases(data);
    });
  }, []);

  const activeTest = FILTERS.find((f) => f.key === filter)!.test;

  const counts = useMemo(() => {
    const map = {} as Record<FilterKey, number>;
    for (const f of FILTERS) map[f.key] = (cases ?? []).filter(f.test).length;
    return map;
  }, [cases]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (cases ?? []).filter((c) => {
      if (!activeTest(c)) return false;
      if (!q) return true;
      return (
        (c.fullName ?? "").toLowerCase().includes(q) || (c.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [cases, activeTest, query]);

  return (
    <section className="adm-page">
      <div className="adm-page-head">
        <h1>Member cases</h1>
        <input
          className="adm-search"
          type="search"
          placeholder="Search name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="adm-filters" role="tablist" aria-label="Filter cases">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`adm-chip ${filter === f.key ? "is-active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="adm-chip-count">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="adm-error">Couldn't load cases ({error}).</p>}
      {cases === null && !error && <p className="adm-muted">Loading cases…</p>}
      {cases !== null && rows.length === 0 && !error && (
        <p className="adm-muted">No cases match this filter.</p>
      )}

      {rows.length > 0 && (
        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Stage</th>
                <th>Doctor</th>
                <th>Docs</th>
                <th>Results</th>
                <th>Care plan</th>
                <th>Next action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.memberId} onClick={() => onOpen(c.memberId)} tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && onOpen(c.memberId)}>
                  <td>
                    <span className="adm-member-name">{c.fullName ?? "—"}</span>
                    <span className="adm-member-email">{c.email}</span>
                  </td>
                  <td>{STAGE_LABELS[c.currentStage ?? ""] ?? c.currentStage ?? "—"}</td>
                  <td>{c.doctorName ?? <span className="adm-warn">Unassigned</span>}</td>
                  <td className="adm-num">{c.documentsCount}</td>
                  <td><StatusPill value={c.resultsStatus} /></td>
                  <td><StatusPill value={c.carePlanStatus} /></td>
                  <td>
                    <span className={`adm-next adm-next-${c.nextOwner}`}>{c.nextAction}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default CasesList;
