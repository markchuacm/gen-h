// Types shared across the lab-report ingest pipeline (extract → parse → match
// → status → review). Kept dependency-free so the parsing core can be unit-
// tested in isolation from React and pdf.js.
import type { BiomarkerInput } from "../../lib/api/admin";

/** A single reconstructed text line from the PDF, before interpretation. */
export type PageLine = { page: number; text: string };

/** One parsed measurement candidate pulled from a line. */
export type ParsedLine = {
  raw: string;
  page: number;
  /** Candidate marker label — the text before the first value, CJK stripped. */
  labelText: string;
  value: number | null;
  valueText: string | null;
  unit: string | null;
  refLow: number | null;
  refHigh: number | null;
  refComparator: "range" | "lt" | "gt" | null;
  /** Lab's own out-of-range marker (↑ ↓ H L C), when present. */
  labFlag: "high" | "low" | "critical" | null;
};

export type MatchVia = "code" | "alias" | "normalized" | "fuzzy" | "none";

export type MatchResult = {
  code: string | null;
  name: string;
  category: string | null;
  unit: string | null;
  confidence: number;
  via: MatchVia;
  unitMismatch: boolean;
};

/** A review-table row: what was parsed, what it matched, and a commit-ready
    BiomarkerInput the admin can still edit before saving. */
export type IngestRow = {
  id: string;
  include: boolean;
  parsed: ParsedLine;
  match: MatchResult;
  input: BiomarkerInput;
  warnings: string[];
};

export type IngestStage = "upload" | "processing" | "review" | "committing" | "done";
