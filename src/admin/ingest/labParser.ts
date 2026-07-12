// Line-by-line interpretation of reconstructed lab-report text. Pure and
// dependency-free (no catalog, no React) so it can be tuned against real
// reports in isolation. Tuned against three Malaysian lab formats (Gnosis,
// Prima/UNI Klinik, a single-page FBC): parenthesised and bare reference
// ranges, `H`/`L`/`↑`/`↓` out-of-range flags, doubled flagged values
// ("↑ 112 112"), interleaved Chinese marker names, split units ("x 10 9 /L"),
// and trailing ASCII bar-graphs.
import type { ParsedLine } from "./types";

// Units seen across catalog + sample reports. Longer/more-specific first so
// "mIU/mL" wins over "IU/mL". Used both to find the unit token and to know
// where the label ends.
const UNIT_PATTERNS = [
  "x10\\^\\d+\\s*/L",
  "10\\^\\d+\\s*/uL",
  "mmol/mol",
  "mmol/L",
  "ml/min/1\\.73m\\^?2",
  "g/dL",
  "g/dl",
  "g/L",
  "mg/dL",
  "mg/L",
  "mg/mmol",
  "ug/dL",
  "ug/dl",
  "ug/L",
  "ng/mL",
  "ng/ml",
  "ng/dL",
  "pg/mL",
  "pg/ml",
  "umol/L",
  "nmol/L",
  "pmol/L",
  "mIU/mL",
  "mIU/ml",
  "mIU/L",
  "uIU/mL",
  "uIU/ml",
  "IU/mL",
  "IU/L",
  "U/mL",
  "U/ml",
  "U/L",
  "mil/cumm",
  "tho/cumm",
  "mm/Hr",
  "mmHg",
  "fL",
  "fl",
  "pg",
  "%",
  "EIU",
  "index",
  "Ratio",
  "/HPF",
  "/LPF",
  "/hpf",
];

const UNIT_RE = new RegExp(`(?:${UNIT_PATTERNS.join("|")})`, "g");

const QUALITATIVE_RE =
  /\b(Non[-\s]?Reactive|Reactive|Negative|Positive|Not\s+detected|Not\s+Seen|Normal|Yellow|Clear|Pale\s+Yellow|Nil|Trace|n\.a\.?)\b/i;

/** Collapse whitespace and normalise the punctuation labs vary on. */
function normalize(line: string): string {
  return line
    .replace(/[‒–—−]/g, "-") // figure/en/em dash, minus → hyphen
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/≪/g, "<")
    .replace(/x\s*10\s*(\d{1,2})\s*\/\s*L/gi, "x10^$1/L")
    .replace(/\b10\s*\^?\s*(\d)\s*\/\s*uL/gi, "10^$1/uL")
    .replace(/[\s ]+/g, " ")
    .trim();
}

/** Strip CJK characters and the ASCII bar-graph tails ("-+----0---+-"). */
function stripNoise(line: string): string {
  return line
    .replace(/[　-鿿＀-￯]/g, " ") // CJK + fullwidth
    .replace(/-\+[-0+\s]*\+?-?\s*$/g, " ") // trailing bar graph
    .replace(/\s+/g, " ")
    .trim();
}

/** Normalise a split/spaced unit like "x 10 9 /L" → "x10^9/L". */
function cleanUnit(u: string): string {
  return u
    .replace(/x\s*10\s*(\d+)\s*\/L/i, "x10^$1/L")
    .replace(/10\s*\^?\s*(\d+)\s*\/uL/i, "10^$1/uL")
    .replace(/\s+/g, "")
    .trim();
}

// A leading catalogue index ("19", "57.") that some labs print before the name.
const LEADING_INDEX_RE = /^(\d{1,3})[.)]?\s+(?=[A-Za-z~%(])/;
// A lab out-of-range flag before the value.
const FLAG_RE = /(?:^|\s)(↑|↓|H|L|C)\s+(?=[<>]?=?\s*\d|\.?\d)/;

function toFlag(sym: string | null): ParsedLine["labFlag"] {
  if (sym === "↑" || sym === "H") return "high";
  if (sym === "↓" || sym === "L") return "low";
  if (sym === "C") return "critical";
  return null;
}

/** Pull the reference range out of `rest`, returning the range plus the text
    with the range removed (so it can't be mistaken for the value). */
function extractRef(rest: string): {
  refLow: number | null;
  refHigh: number | null;
  refComparator: ParsedLine["refComparator"];
  remainder: string;
} {
  // Parenthesised forms first: ( 120 - 150 ), ( < 5.2 ), ( > 0.90 ), (<1.30)
  const paren = rest.match(/\(\s*([<>]?=?)\s*(\d+(?:\.\d+)?)\s*(?:-\s*(\d+(?:\.\d+)?))?\s*\)/);
  if (paren) {
    const remainder = (rest.slice(0, paren.index) + " " + rest.slice(paren.index! + paren[0].length)).trim();
    if (paren[3] != null) {
      return { refLow: Number(paren[2]), refHigh: Number(paren[3]), refComparator: "range", remainder };
    }
    if (paren[1].startsWith("<")) return { refLow: null, refHigh: Number(paren[2]), refComparator: "lt", remainder };
    if (paren[1].startsWith(">")) return { refLow: Number(paren[2]), refHigh: null, refComparator: "gt", remainder };
    return { refLow: Number(paren[2]), refHigh: null, refComparator: "range", remainder };
  }
  // Bare "13.0 - 18.0" (Gnosis reference column, no parens).
  const bare = rest.match(/(?:^|\s)(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)(?:\s|$)/);
  if (bare) {
    const remainder = (rest.slice(0, bare.index) + " " + rest.slice(bare.index! + bare[0].length)).trim();
    return { refLow: Number(bare[1]), refHigh: Number(bare[2]), refComparator: "range", remainder };
  }
  // Bare "<5.20" / ">1.03" reference (no parens, no value nearby).
  const cmp = rest.match(/(?:^|\s)([<>]=?)\s*(\d+(?:\.\d+)?)(?:\s|$)/);
  if (cmp) {
    const remainder = (rest.slice(0, cmp.index) + " " + rest.slice(cmp.index! + cmp[0].length)).trim();
    return cmp[1].startsWith("<")
      ? { refLow: null, refHigh: Number(cmp[2]), refComparator: "lt", remainder }
      : { refLow: Number(cmp[2]), refHigh: null, refComparator: "gt", remainder };
  }
  return { refLow: null, refHigh: null, refComparator: null, remainder: rest };
}

export function parseLine(rawLine: string, page: number): ParsedLine | null {
  const raw = normalize(rawLine);
  if (raw.length < 3) return null;

  let work = stripNoise(raw);

  // Drop a leading catalogue index number.
  work = work.replace(LEADING_INDEX_RE, "");

  // Capture and remove an out-of-range flag.
  let labFlag: ParsedLine["labFlag"] = null;
  const flag = work.match(FLAG_RE);
  if (flag) {
    labFlag = toFlag(flag[1]);
    work = (work.slice(0, flag.index) + " " + work.slice(flag.index! + flag[0].length)).trim();
  }

  // Collapse a doubled flagged value ("112 112" → "112").
  work = work.replace(/\b(\d+(?:\.\d+)?)\s+\1\b/g, "$1");

  // Find the unit; the label is everything before it (or before the value).
  UNIT_RE.lastIndex = 0;
  const unitMatch = UNIT_RE.exec(work);

  // Locate the primary value: the first number that isn't part of a range.
  // We search the portion up to the unit (values precede units on every format).
  const valueZone = unitMatch ? work.slice(0, unitMatch.index) : work;
  const valueMatch = valueZone.match(/(?:^|\s)(\d+(?:\.\d+)?)(?=\s|$)/g);

  let value: number | null = null;
  let labelEnd = -1;
  if (valueMatch) {
    // Take the LAST standalone number before the unit as the value — earlier
    // ones tend to be percentages or index numbers that survived stripping.
    const last = valueMatch[valueMatch.length - 1].trim();
    value = Number(last);
    labelEnd = valueZone.lastIndexOf(last);
  }

  const unit = unitMatch ? cleanUnit(unitMatch[0]) : null;

  // Reference range from the tail after the unit (falls back to whole line).
  const tail = unitMatch ? work.slice(unitMatch.index + unitMatch[0].length) : work;
  const { refLow, refHigh, refComparator } = extractRef(tail);

  // Qualitative result when there's no number (urinalysis, serology).
  let valueText: string | null = null;
  if (value == null) {
    const qual = work.match(QUALITATIVE_RE);
    if (qual) {
      valueText = qual[0].replace(/\s+/g, " ").trim();
      labelEnd = qual.index!;
    }
  }

  // Label = text before the value/qualitative token, cleaned of stray symbols.
  let labelText = (labelEnd >= 0 ? work.slice(0, labelEnd) : work)
    .replace(/[~():.\-]+$/g, "")
    .replace(/^[~\-\s]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  // A line with neither a numeric nor a qualitative value isn't a measurement.
  if (value == null && valueText == null) return null;
  // A line that's only a value with no label is noise (page numbers, totals).
  if (labelText.length < 3) return null;
  // Marker names are short; long labels are addresses, disclaimers, table rows.
  if (labelText.split(" ").length > 7) return null;
  // Contact details, file footers, and reference-table rows are not markers.
  if (/@|www\.|http|tel:|fax|\bsdn\b|\bbhd\b|jalan|verified by|printed|computer generated|reference|interpretation/i.test(labelText)) {
    return null;
  }
  // Report metadata / clinical reference-table leaders.
  if (/^(page|printed|collected|received|reported|copy|ref|lab|patient|age|sex|dob|id|no|name|gender|clinic|doctor|refer|category|normal|impression|stage|male|female|risk|moderate|elevated|low|good|pre[- ]?diabetes|diabetes|indeterminate|ifg|of|to|less than|more)\b/i.test(labelText)) {
    return null;
  }

  return { raw, page, labelText, value, valueText, unit, refLow, refHigh, refComparator, labFlag };
}

export function parseLines(lines: { page: number; text: string }[]): ParsedLine[] {
  const out: ParsedLine[] = [];
  for (const { page, text } of lines) {
    const parsed = parseLine(text, page);
    if (parsed) out.push(parsed);
  }
  return out;
}
