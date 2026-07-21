// Loads server/seeds/biomarker-catalog.json into app.biomarkers,
// app.biomarker_categories and app.biomarker_category_members.
//
// Idempotent: safe to re-run on every deploy. Run it before shipping a frontend
// that expects the catalog, or the results page renders empty.
//
// IMPORTANT: the JSON is the clinical source of truth, so a re-seed RESETS
// `is_active` to whatever the JSON says. An admin's Activate/Deactivate toggle
// is an operational override between releases; if a marker should stay retired,
// retire it in the JSON as well.
//
// Markers present in the database but absent from the JSON are retired, never
// deleted — released results may still reference their codes.
//
//   pnpm --filter @verae/api catalog:seed

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Pool } from "pg";
import { adminDatabaseUrl } from "../config.js";
import { BIOMARKER_RISK_AREAS, validateRiskAreaMembership } from "../catalog/biomarker-risk-areas.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const seedPath = path.resolve(here, "../../seeds/biomarker-catalog.json");

const SCORING_MODES = new Set(["THREE_TIER", "TWO_TIER", "QUALITATIVE", "INFORMATIONAL"]);
const DIRECTIONALITY = new Set(["higher_is_better", "lower_is_better", "range_based", "qualitative"]);
const CONTEXTS = new Set(["sex", "age", "cycle_phase", "sample_timing"]);

type SeedCategory = {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
};

type SeedBiomarker = {
  id: string;
  name: string;
  displayName: string;
  aliases: string[];
  description: string;
  whatItMeasures: string;
  whyItMatters: string;
  unit: string;
  scoringMode: string;
  contextRequirements: string[];
  optimalRangeLabel: string;
  suboptimalRangeLabel: string;
  outOfRangeLabel: string;
  lowerOptimal: number | null;
  upperOptimal: number | null;
  lowerReference: number | null;
  upperReference: number | null;
  directionality: string;
  isActive: boolean;
  categories: string[];
};

type SeedFile = { categories: SeedCategory[]; biomarkers: SeedBiomarker[] };

/** Fail before touching the database rather than half-applying a bad edit. */
function validate(seed: SeedFile): void {
  const problems: string[] = [];
  const slugByName = new Map(seed.categories.map((c) => [c.name, c.id]));
  const ids = new Set<string>();

  for (const category of seed.categories) {
    if (!/^[a-z0-9-]+$/.test(category.id)) problems.push(`category "${category.name}": id must be a slug`);
  }

  for (const marker of seed.biomarkers) {
    const where = `biomarker "${marker.id}"`;
    if (ids.has(marker.id)) problems.push(`${where}: duplicate id`);
    ids.add(marker.id);
    if (!SCORING_MODES.has(marker.scoringMode)) problems.push(`${where}: unknown scoringMode "${marker.scoringMode}"`);
    if (!DIRECTIONALITY.has(marker.directionality)) problems.push(`${where}: unknown directionality "${marker.directionality}"`);
    for (const context of marker.contextRequirements) {
      if (!CONTEXTS.has(context)) problems.push(`${where}: unknown context requirement "${context}"`);
    }
    if (marker.categories.length === 0) problems.push(`${where}: belongs to no category`);
    for (const name of marker.categories) {
      if (!slugByName.has(name)) problems.push(`${where}: unknown category "${name}"`);
    }
    // Mirrors the DB constraint, but with a message that names the marker.
    if (marker.scoringMode === "TWO_TIER" && marker.suboptimalRangeLabel.trim()) {
      problems.push(`${where}: TWO_TIER markers must not define a sub-optimal band`);
    }
    if (!marker.isActive) continue;
    if (!marker.whatItMeasures.trim() || !marker.whyItMatters.trim()) {
      problems.push(`${where}: active markers need both "what it measures" and "why it matters"`);
    }
    const scored = marker.scoringMode === "THREE_TIER" || marker.scoringMode === "TWO_TIER";
    if (scored && !marker.unit.trim()) problems.push(`${where}: active scored marker has no unit`);
    if (scored && ![marker.optimalRangeLabel, marker.suboptimalRangeLabel, marker.outOfRangeLabel].some((l) => l.trim())) {
      problems.push(`${where}: active scored marker has no range labels`);
    }
  }

  if (problems.length) {
    throw new Error(`Invalid biomarker catalog seed:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  }
}

export async function seedBiomarkerCatalog(): Promise<void> {
  const seed = JSON.parse(await readFile(seedPath, "utf8")) as SeedFile;
  validate(seed);
  validateRiskAreaMembership(seed.biomarkers.filter((marker) => marker.isActive).map((marker) => marker.id));

  const slugByName = new Map(seed.categories.map((c) => [c.name, c.id]));
  const pool = new Pool({ connectionString: adminDatabaseUrl(), application_name: "verae-catalog-seed" });
  const client = await pool.connect();

  try {
    await client.query("begin");

    for (const category of seed.categories) {
      await client.query(
        `insert into app.biomarker_categories (id, name, description, display_order, is_active)
         values ($1, $2, $3, $4, $5)
         on conflict (id) do update set
           name = excluded.name, description = excluded.description,
           display_order = excluded.display_order, is_active = excluded.is_active`,
        [category.id, category.name, category.description, category.displayOrder, category.isActive],
      );
    }

    for (const marker of seed.biomarkers) {
      await client.query(
        `insert into app.biomarkers (
           id, name, display_name, aliases, description, what_it_measures, why_it_matters, unit,
           scoring_mode, context_requirements, optimal_range_label, suboptimal_range_label,
           out_of_range_label, lower_optimal, upper_optimal, lower_reference, upper_reference,
           directionality, is_active, deactivated_at
         ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,
                   case when $19 then null else now() end)
         on conflict (id) do update set
           name = excluded.name, display_name = excluded.display_name, aliases = excluded.aliases,
           description = excluded.description, what_it_measures = excluded.what_it_measures,
           why_it_matters = excluded.why_it_matters, unit = excluded.unit,
           scoring_mode = excluded.scoring_mode, context_requirements = excluded.context_requirements,
           optimal_range_label = excluded.optimal_range_label,
           suboptimal_range_label = excluded.suboptimal_range_label,
           out_of_range_label = excluded.out_of_range_label,
           lower_optimal = excluded.lower_optimal, upper_optimal = excluded.upper_optimal,
           lower_reference = excluded.lower_reference, upper_reference = excluded.upper_reference,
           directionality = excluded.directionality, is_active = excluded.is_active,
           deactivated_at = case
             when excluded.is_active then null
             else coalesce(app.biomarkers.deactivated_at, now())
           end`,
        [
          marker.id, marker.name, marker.displayName, marker.aliases, marker.description,
          marker.whatItMeasures, marker.whyItMatters, marker.unit, marker.scoringMode,
          marker.contextRequirements, marker.optimalRangeLabel, marker.suboptimalRangeLabel,
          marker.outOfRangeLabel, marker.lowerOptimal, marker.upperOptimal,
          marker.lowerReference, marker.upperReference, marker.directionality, marker.isActive,
        ],
      );

      // Membership is replaced wholesale so a marker moving category (or losing
      // one) does not leave a stale row behind.
      await client.query("delete from app.biomarker_category_members where biomarker_id = $1", [marker.id]);
      for (const [index, name] of marker.categories.entries()) {
        await client.query(
          `insert into app.biomarker_category_members (biomarker_id, category_id, is_primary, display_order)
           values ($1, $2, $3, $4)`,
          [marker.id, slugByName.get(name), index === 0, index],
        );
      }
    }

    // Anything the JSON no longer mentions is retired, not deleted: released
    // biomarker_results rows may still carry the code.
    const orphaned = await client.query<{ id: string }>(
      `update app.biomarkers set is_active = false, deactivated_at = coalesce(deactivated_at, now())
       where id <> all($1::text[]) and is_active
       returning id`,
      [seed.biomarkers.map((m) => m.id)],
    );

    // Clinical coverage is maintained separately from laboratory categories.
    // Replace memberships wholesale so moving a marker between areas never
    // leaves a stale inclusion behind. Advanced Baseline is intentionally
    // absent: it is a complete-catalog shortcut, not another mapping.
    for (const area of BIOMARKER_RISK_AREAS) {
      await client.query(
        `insert into app.biomarker_risk_areas (id, name, description, display_order, is_active)
         values ($1, $2, $3, $4, true)
         on conflict (id) do update set
           name = excluded.name, description = excluded.description,
           display_order = excluded.display_order, is_active = true`,
        [area.id, area.name, area.description, area.displayOrder],
      );
      await client.query("delete from app.biomarker_risk_area_members where risk_area_id = $1", [area.id]);
      for (const biomarkerId of area.biomarkerIds) {
        await client.query(
          `insert into app.biomarker_risk_area_members (biomarker_id, risk_area_id)
           values ($1, $2)`,
          [biomarkerId, area.id],
        );
      }
    }
    await client.query(
      "update app.biomarker_risk_areas set is_active = false where id <> all($1::text[]) and is_active",
      [BIOMARKER_RISK_AREAS.map((area) => area.id)],
    );

    await client.query("commit");

    const active = seed.biomarkers.filter((m) => m.isActive).length;
    console.info(
      `Catalog seeded: ${active} active / ${seed.biomarkers.length} total markers, ` +
        `${seed.categories.filter((c) => c.isActive).length} active categories, ` +
        `${BIOMARKER_RISK_AREAS.length} active risk areas.`,
    );
    if (orphaned.rowCount) {
      console.info(`Retired ${orphaned.rowCount} marker(s) absent from the seed: ${orphaned.rows.map((r) => r.id).join(", ")}`);
    }
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Only self-run when invoked as a script; db/seed.ts imports the function.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  seedBiomarkerCatalog().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
