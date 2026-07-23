import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Biomarker } from "../member-v2/screens/results/types";
import { setDeriveStatusCatalog } from "./ingest/deriveStatus";
import { buildSeedRows } from "./demoSeed";

const seed = JSON.parse(
  readFileSync(new URL("../../server/seeds/biomarker-catalog.json", import.meta.url), "utf8"),
) as { biomarkers: Array<Record<string, unknown>> };

const markers = seed.biomarkers.map((marker) => ({
  ...marker,
  categories: (marker.categories as string[]) ?? [],
})) as unknown as Biomarker[];

const ctx = { sex: "female" as const, age: 42 };

function rows(drift = 0) {
  setDeriveStatusCatalog(new Map(markers.map((marker) => [marker.id, marker])));
  return buildSeedRows(markers, ctx, drift);
}

describe("demo seed rows", () => {
  it("gives every catalog marker a committable value", () => {
    for (const row of rows()) {
      expect(row.value_numeric != null || row.value_text != null).toBe(true);
      if (row.value_numeric != null) expect(Number.isFinite(row.value_numeric)).toBe(true);
    }
  });

  it("produces a mixed but mostly-optimal spread", () => {
    const counts = { optimal: 0, at_risk: 0, needs_attention: 0 };
    for (const row of rows()) counts[row.status] += 1;

    expect(counts.optimal).toBeGreaterThan(markers.length * 0.5);
    expect(counts.at_risk).toBeGreaterThan(0);
    expect(counts.needs_attention).toBeGreaterThan(0);
  });

  it("is deterministic, so re-seeding a member reads the same", () => {
    expect(rows()).toEqual(rows());
  });

  it("ages older draws away from optimal", () => {
    const today = rows(0);
    const lastYear = rows(0.16);
    const moved = today.filter((row, i) => row.value_numeric !== lastYear[i]!.value_numeric);

    expect(moved.length).toBeGreaterThan(markers.length * 0.5);
    expect(lastYear.filter((r) => r.status === "optimal").length)
      .toBeLessThanOrEqual(today.filter((r) => r.status === "optimal").length);
  });
});
