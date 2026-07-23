// Test-only profile seeding. Fills a member with three released lab reports
// covering the whole biomarker catalog plus a draft care plan, so the member,
// doctor and admin views can be reviewed in a fully populated state without
// hand-entering 147 markers.
//
// Nothing here is part of the real clinical flow: it is reachable only from the
// developer-mode card in CaseDetail, and every write goes through the same
// admin endpoints the console already uses (the care plan needs one dev-only
// endpoint, since care-plan writes are otherwise doctor-scoped).
import {
  createBiomarkersBulk,
  createLabReport,
  releaseLabReport,
  seedDemoCarePlan,
  type BiomarkerInput,
} from "../lib/api/admin";
import { loadCatalog } from "../lib/api/catalog";
import type { DraftSection } from "../lib/api/doctor";
import { deriveStatus, setDeriveStatusCatalog, type RangeCtx } from "./ingest/deriveStatus";
import { FOCUS_AREA_TEMPLATES, instantiateTemplate } from "../doctor/carePlanLibrary";
import type { Biomarker } from "../member-v2/screens/results/types";

const NO_LAB_REF = { refLow: null, refHigh: null, comparator: null } as const;

/** Roughly a real member's spread: mostly fine, a handful worth talking about. */
type Target = "optimal" | "at_risk" | "needs_attention";
function targetFor(index: number): Target {
  const slot = index % 10;
  if (slot === 3 || slot === 7) return "at_risk";
  if (slot === 8) return "needs_attention";
  return "optimal";
}

/** Deterministic jitter so repeated seeds of the same member look the same. */
function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function round(value: number): number {
  const magnitude = Math.abs(value);
  const decimals = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : magnitude >= 1 ? 2 : 3;
  return Number(value.toFixed(decimals));
}

/** A plausible value for the requested bucket, given the marker's resolved
    bounds. The bucket is a request, not a promise — the committed status always
    comes back from deriveStatus so the row stays self-consistent. */
function sampleValue(
  bounds: { optimalLow: number | null; optimalHigh: number | null; refLow: number | null; refHigh: number | null },
  target: Target,
  noise: number,
): number | null {
  const { optimalLow: lo, optimalHigh: hi, refHigh, refLow } = bounds;

  if (lo != null && hi != null) {
    const span = hi - lo || Math.abs(hi) * 0.1 || 1;
    if (target === "optimal") return round(lo + span * (0.25 + noise * 0.5));
    if (target === "at_risk") return round(noise < 0.5 ? hi + span * 0.06 : lo - span * 0.06);
    const above = refHigh != null && refHigh > hi ? refHigh + span * 0.25 : hi + span * 0.6;
    const below = refLow != null && refLow < lo ? refLow - span * 0.25 : lo - span * 0.6;
    return round(noise < 0.5 ? above : Math.max(below, 0));
  }

  if (hi != null) {
    // lower-is-better: no floor, so scale off the ceiling.
    if (target === "optimal") return round(hi * (0.45 + noise * 0.35));
    if (target === "at_risk") return round((refHigh != null && refHigh > hi ? (hi + refHigh) / 2 : hi * 1.15));
    return round((refHigh != null && refHigh > hi ? refHigh : hi * 1.3) * 1.25);
  }

  if (lo != null) {
    // higher-is-better.
    if (target === "optimal") return round(lo * (1.15 + noise * 0.4));
    if (target === "at_risk") return round((refLow != null && refLow < lo ? (lo + refLow) / 2 : lo * 0.9));
    return round((refLow != null && refLow < lo ? refLow : lo * 0.8) * 0.75);
  }

  // No optimal band, but the lab reference range still gives a plausible number
  // (e.g. Urine Creatinine). Sit comfortably inside it.
  if (refLow != null && refHigh != null) return round(refLow + (refHigh - refLow) * (0.3 + noise * 0.4));

  return null; // qualitative marker — the caller falls back to value_text.
}

/** Qualitative markers ("normal", "non-reactive") carry a label, not a number. */
function qualitativeText(marker: Biomarker): string {
  const label = (marker.optimalRangeLabel ?? "").trim();
  if (!label || label === "CONTEXT_REQUIRED" || /\d/.test(label)) return "Normal";
  return label.split(";")[0].trim();
}

/** Push a reading further from its optimal band, so an older draw trends the
    right way regardless of which side of the band the marker sits on. */
function applyDrift(
  value: number,
  bounds: { optimalLow: number | null; optimalHigh: number | null },
  drift: number,
  noise: number,
): number {
  if (drift === 0) return value;
  const { optimalLow: lo, optimalHigh: hi } = bounds;
  const centre = lo != null && hi != null ? (lo + hi) / 2 : hi != null ? hi * 0.6 : lo != null ? lo * 1.3 : value;
  const away = value >= centre ? 1 : -1;
  return round(value * (1 + away * drift * (0.5 + noise * 0.5)));
}

/** Older draws drift toward the reference edges so the trend lines have shape:
    the earliest report is the worst, today's is the target. */
const DRAWS = [
  { monthsAgo: 12, drift: 0.16 },
  { monthsAgo: 6, drift: 0.07 },
  { monthsAgo: 0, drift: 0 },
];

function collectedAt(monthsAgo: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsAgo);
  return date.toISOString();
}

/** The focus areas a seeded plan starts with — enough sections to see how a
    dense plan reads without instantiating the entire library. */
const SEEDED_FOCUS_AREAS = ["cardiovascular", "metabolic", "sleep", "nutrients", "longevity"];

function buildSections(): DraftSection[] {
  return SEEDED_FOCUS_AREAS.flatMap((id, order) => {
    const template = FOCUS_AREA_TEMPLATES.find((t) => t.id === id);
    return template ? [instantiateTemplate(template, order)] : [];
  });
}

/**
 * One report's worth of rows: a value per marker, with the committed status and
 * bounds resolved through deriveStatus so a seeded row is indistinguishable in
 * shape from an ingested one. `drift` ages the draw (0 = today).
 *
 * Requires setDeriveStatusCatalog to have been primed with the same catalog.
 */
export function buildSeedRows(markers: Biomarker[], ctx: RangeCtx, drift: number): BiomarkerInput[] {
  return markers.map((marker, index) => {
    const bounds = deriveStatus(marker.id, null, ctx, NO_LAB_REF, null);
    const noise = jitter(index + 1);
    const raw = sampleValue(bounds, targetFor(index), noise);
    const value = raw == null ? null : applyDrift(raw, bounds, drift, noise);
    const derived = value == null ? bounds : deriveStatus(marker.id, value, ctx, NO_LAB_REF, null);

    // deriveStatus can only score against an optimal band; without one it
    // falls through to at_risk, which would be a lie here. Those markers are
    // the ones a reviewer marks by hand during ingest, so seed them clear.
    const scorable = bounds.optimalLow != null || bounds.optimalHigh != null;

    return {
      biomarker_code: marker.id,
      biomarker_name: marker.displayName || marker.name,
      category: marker.categories[0] ?? null,
      value_numeric: value,
      value_text: value == null ? qualitativeText(marker) : null,
      unit: (marker.unit || "").split(";")[0].trim() || null,
      ref_low: derived.refLow,
      ref_high: derived.refHigh,
      optimal_low: derived.optimalLow,
      optimal_high: derived.optimalHigh,
      status: value != null && scorable ? derived.status : "optimal",
      notes: null,
    };
  });
}

export type SeedProgress = (message: string) => void;

export type SeedResult = {
  reports: number;
  biomarkers: number;
  sections: number;
  /** Set when the labs seeded but the care plan couldn't (e.g. no doctor). */
  carePlanError: string | null;
};

/**
 * Populate a member with the full biomarker catalog across three released
 * reports, then attach a draft care plan under their assigned doctor.
 */
export async function seedFullProfile(
  memberId: string,
  member: { sex: string | null; age: number | null },
  onProgress: SeedProgress = () => {},
): Promise<{ data: SeedResult | null; error: string | null }> {
  onProgress("Loading biomarker catalog…");
  const catalog = await loadCatalog();
  setDeriveStatusCatalog(catalog.byCode);

  const ctx: RangeCtx = {
    sex: member.sex?.toLowerCase().startsWith("f") ? "female" : "male",
    age: member.age ?? 40,
  };
  const markers = catalog.biomarkers.filter((m) => !catalog.retiredCodes.has(m.id));

  let biomarkers = 0;
  for (const [draw, spec] of DRAWS.entries()) {
    onProgress(`Seeding report ${draw + 1} of ${DRAWS.length}…`);

    const { data: report, error: reportError } = await createLabReport(memberId, {
      lab_name: "Innoquest Pathology",
      panel_name: "Advanced Baseline",
      collected_at: collectedAt(spec.monthsAgo),
      document_id: null,
    });
    if (reportError || !report) return { data: null, error: reportError ?? "Couldn't create the lab report." };

    const rows = buildSeedRows(markers, ctx, spec.drift);

    const { inserted, error: bulkError } = await createBiomarkersBulk(report.id, memberId, rows);
    if (bulkError) return { data: null, error: bulkError };
    biomarkers += inserted;

    const { error: releaseError } = await releaseLabReport(report.id);
    if (releaseError) return { data: null, error: releaseError };
  }

  onProgress("Drafting the care plan…");
  const sections = buildSections();
  const { error: planError } = await seedDemoCarePlan(memberId, {
    title: "Your care plan",
    summary:
      "A starting point built from your latest results — the areas worth your attention first, and what to do about each one.",
    sections,
  });

  return {
    data: {
      reports: DRAWS.length,
      biomarkers,
      sections: planError ? 0 : sections.length,
      carePlanError: planError,
    },
    error: null,
  };
}
