import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { FOCUS_AREA_TEMPLATES } from "./carePlanLibrary";

// Care-plan marker chips are stored as displayName strings and linked to the
// member's results screen by that name, so a typo or a retired marker gives the
// member a dead chip. This used to be an import-time assertion; the catalog is
// fetched now, so it lives here instead.

const seedPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../server/seeds/biomarker-catalog.json",
);
const seed = JSON.parse(readFileSync(seedPath, "utf8")) as {
  biomarkers: { displayName: string; isActive: boolean }[];
};
const activeNames = new Set(seed.biomarkers.filter((m) => m.isActive).map((m) => m.displayName));

describe("care plan focus-area templates", () => {
  it("only reference active catalog markers", () => {
    for (const template of FOCUS_AREA_TEMPLATES) {
      expect({
        template: template.id,
        unknown: template.markers.filter((marker) => !activeNames.has(marker)),
      }).toEqual({ template: template.id, unknown: [] });
    }
  });
});
