import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Biomarker } from "../../member-v2/screens/results/types";
import { deriveStatus, setDeriveStatusCatalog } from "./deriveStatus";

const seed = JSON.parse(
  readFileSync(new URL("../../../server/seeds/biomarker-catalog.json", import.meta.url), "utf8"),
) as { biomarkers: Array<Record<string, unknown>> };
const catalog = new Map(
  seed.biomarkers
    .filter((marker) => marker.id === "folate" || marker.id === "vitamin-b12")
    .map((marker) => [marker.id as string, marker as unknown as Biomarker]),
);

const ctx = { sex: "female" as const, age: 42 };
const noLabReference: { refLow: null; refHigh: null; comparator: null } = {
  refLow: null,
  refHigh: null,
  comparator: null,
};

describe("deriveStatus vitamin thresholds", () => {
  it("keeps Folate's 10 nmol/L boundary optimal and 7 nmol/L at risk", () => {
    setDeriveStatusCatalog(catalog);

    expect(deriveStatus("folate", 10, ctx, noLabReference, null).status).toBe("optimal");
    expect(deriveStatus("folate", 9.99, ctx, noLabReference, null).status).toBe("at_risk");
    expect(deriveStatus("folate", 7, ctx, noLabReference, null).status).toBe("at_risk");
    expect(deriveStatus("folate", 6.99, ctx, noLabReference, null).status).toBe("needs_attention");
  });

  it("keeps Vitamin B12 at 258 pmol/L at risk because optimal is strictly above 258", () => {
    setDeriveStatusCatalog(catalog);

    expect(deriveStatus("vitamin-b12", 259, ctx, noLabReference, null).status).toBe("optimal");
    expect(deriveStatus("vitamin-b12", 258, ctx, noLabReference, null).status).toBe("at_risk");
    expect(deriveStatus("vitamin-b12", 133, ctx, noLabReference, null).status).toBe("at_risk");
    expect(deriveStatus("vitamin-b12", 132, ctx, noLabReference, null).status).toBe("needs_attention");
  });
});
