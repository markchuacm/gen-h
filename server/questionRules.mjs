// ─── Doctor Review Brief · marker vocabulary + rule-based questions ───────────
// Canonical marker keys, panel grouping, and the curated biomarker → intake
// question bank. This is the deterministic safety net: if the model produces no
// usable follow-up questions, these still fire from structured findings.
//
// Mirrored by src/member/doctor-review-brief/questionRules.ts — keep the two in
// sync when adding markers or rules.

export const MARKER_ALIASES = {
  // kidney
  creatinine: ["creatinine"],
  egfr: ["egfr", "estimated gfr", "estimated glomerular", "gfr"],
  urea: ["urea", "bun", "blood urea"],
  uric_acid: ["uric acid", "urate"],
  cystatin_c: ["cystatin"],
  // lipids
  total_cholesterol: ["total cholesterol", "cholesterol total", "cholesterol"],
  ldl: ["ldl"],
  hdl: ["hdl"],
  non_hdl: ["non-hdl", "non hdl"],
  triglycerides: ["triglyceride"],
  apob: ["apob", "apo b", "apolipoprotein b"],
  lpa: ["lp(a)", "lipoprotein (a)", "lipoprotein(a)"],
  // liver
  alt: ["alt", "alanine aminotransferase", "sgpt"],
  ast: ["ast", "aspartate aminotransferase", "sgot"],
  ggt: ["ggt", "gamma-glutamyl", "gamma glutamyl"],
  alp: ["alp", "alkaline phosphatase"],
  bilirubin: ["bilirubin"],
  // thyroid
  tsh: ["tsh", "thyroid stimulating"],
  ft4: ["ft4", "free t4", "thyroxine"],
  ft3: ["ft3", "free t3", "triiodothyronine"],
  // iron
  ferritin: ["ferritin"],
  iron: ["iron", "serum iron"],
  transferrin_saturation: ["transferrin saturation", "tsat"],
  tibc: ["tibc", "total iron binding"],
  transferrin: ["transferrin"],
  // glucose / metabolic
  glucose: ["glucose", "fasting blood sugar", "fbs"],
  hba1c: ["hba1c", "a1c", "glycated haemoglobin", "glycated hemoglobin"],
  insulin: ["insulin"],
  homa_ir: ["homa"],
  // blood count
  hemoglobin: ["haemoglobin", "hemoglobin", "hgb", "hb"],
  hematocrit: ["haematocrit", "hematocrit", "hct"],
  mcv: ["mcv", "mean corpuscular volume"],
  platelets: ["platelet"],
  wbc: ["wbc", "white blood cell", "white cell"],
  rbc: ["rbc", "red blood cell", "red cell"],
  // vitamins / other
  vitamin_b12: ["b12", "vitamin b12", "cobalamin"],
  folate: ["folate", "folic acid"],
  vitamin_d: ["vitamin d", "25-oh", "25 oh", "cholecalciferol"],
  homocysteine: ["homocysteine"],
  crp: ["crp", "c-reactive"],
  esr: ["esr", "erythrocyte sedimentation"],
};

export const PANEL_OF = {
  creatinine: "kidney",
  egfr: "kidney",
  urea: "kidney",
  uric_acid: "kidney",
  cystatin_c: "kidney",
  total_cholesterol: "lipids",
  ldl: "lipids",
  hdl: "lipids",
  non_hdl: "lipids",
  triglycerides: "lipids",
  apob: "lipids",
  lpa: "lipids",
  alt: "liver",
  ast: "liver",
  ggt: "liver",
  alp: "liver",
  bilirubin: "liver",
  tsh: "thyroid",
  ft4: "thyroid",
  ft3: "thyroid",
  ferritin: "iron",
  iron: "iron",
  transferrin_saturation: "iron",
  tibc: "iron",
  transferrin: "iron",
  glucose: "metabolic",
  hba1c: "metabolic",
  insulin: "metabolic",
  homa_ir: "metabolic",
  hemoglobin: "blood_count",
  hematocrit: "blood_count",
  mcv: "blood_count",
  platelets: "blood_count",
  wbc: "blood_count",
  rbc: "blood_count",
  vitamin_b12: "vitamins",
  folate: "vitamins",
  vitamin_d: "vitamins",
  homocysteine: "vitamins",
  crp: "inflammation",
  esr: "inflammation",
};

export const PANEL_LABELS = {
  kidney: "Kidney markers",
  lipids: "Lipid & cardiovascular markers",
  liver: "Liver markers",
  thyroid: "Thyroid markers",
  iron: "Iron status markers",
  metabolic: "Blood sugar & metabolic markers",
  blood_count: "Blood count markers",
  vitamins: "Vitamin & nutrient markers",
  inflammation: "Inflammation markers",
};

// Longer aliases first so "free t4" wins over "t4"-style overlaps, and
// word-boundary matching so "alt" never matches inside "alkaline".
const ALIAS_INDEX = Object.entries(MARKER_ALIASES)
  .flatMap(([key, aliases]) => aliases.map((alias) => ({ key, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);

function normalizeName(name) {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Maps a printed marker name to its canonical key, or undefined. */
export function canonicalKeyFor(name) {
  const normalized = normalizeName(name);
  if (!normalized) return undefined;
  for (const { key, alias } of ALIAS_INDEX) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(normalized)) {
      return key;
    }
  }
  return undefined;
}

export function panelFor(canonicalKey) {
  return canonicalKey ? PANEL_OF[canonicalKey] : undefined;
}

// ─── Rule bank ────────────────────────────────────────────────────────────────
// match.flag: "high" | "low" | "any" ("any" = any out-of-range direction).
// Questions use single-select chips + free text (the DynamicQuestionInput model),
// so options read as "the one that fits best" with free text for nuance.

export const QUESTION_RULES = [
  {
    id: "rule_kidney",
    match: [
      { key: "creatinine", flag: "high" },
      { key: "egfr", flag: "low" },
      { key: "urea", flag: "high" },
      { key: "cystatin_c", flag: "high" },
    ],
    question: {
      id: "rule_kidney",
      prompt:
        "A kidney-related marker is outside its printed range. Does anything here apply to you?",
      options: [
        "I take creatine",
        "Regular heavy resistance training",
        "High-protein diet",
        "I probably don't drink enough water",
        "Kidney issues in my family or history",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Training, creatine, hydration and protein intake all shift these markers — this context helps your doctor read them accurately.",
    },
  },
  {
    id: "rule_b12",
    match: [{ key: "vitamin_b12", flag: "low" }],
    question: {
      id: "rule_b12",
      prompt:
        "Your B12 sits below its printed range. Does anything here fit your situation?",
      options: [
        "Vegan or vegetarian diet",
        "Digestive or gut issues",
        "I already take a B12 supplement",
        "Ongoing fatigue",
        "Tingling or numbness in hands/feet",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Diet, absorption and supplementation are the first things your doctor will want to understand alongside a low B12.",
    },
  },
  {
    id: "rule_lipids",
    match: [
      { key: "ldl", flag: "high" },
      { key: "total_cholesterol", flag: "high" },
      { key: "non_hdl", flag: "high" },
      { key: "triglycerides", flag: "high" },
      { key: "apob", flag: "high" },
      { key: "lpa", flag: "high" },
      { key: "hdl", flag: "low" },
    ],
    question: {
      id: "rule_lipids",
      prompt:
        "Some lipid markers are outside their printed ranges. What's most true for you?",
      options: [
        "Heart disease runs in my family",
        "My diet leans fried / processed / takeout",
        "I rarely exercise",
        "Alcohol most weeks",
        "Sleep is consistently poor",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Family history, diet, movement, alcohol and sleep are exactly what your doctor weighs next to lipid numbers.",
    },
  },
  {
    id: "rule_liver",
    match: [
      { key: "alt", flag: "high" },
      { key: "ast", flag: "high" },
      { key: "ggt", flag: "high" },
      { key: "alp", flag: "high" },
      { key: "bilirubin", flag: "high" },
    ],
    question: {
      id: "rule_liver",
      prompt:
        "A liver marker is above its printed range. Does anything here apply recently?",
      options: [
        "Alcohol most weeks",
        "Started a new medication",
        "I take supplements regularly",
        "Recent illness or infection",
        "Heavy training block lately",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Alcohol, medications, supplements, recent illness and hard training can each move liver enzymes — your doctor needs this context.",
    },
  },
  {
    id: "rule_thyroid",
    match: [
      { key: "tsh", flag: "any" },
      { key: "ft4", flag: "any" },
      { key: "ft3", flag: "any" },
    ],
    question: {
      id: "rule_thyroid",
      prompt:
        "A thyroid marker is outside its printed range. Have you noticed any of these?",
      options: [
        "Ongoing fatigue",
        "Weight change without trying",
        "Feeling unusually cold or hot",
        "Thyroid issues in my family",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Symptoms and family history help your doctor decide how to follow up on thyroid results.",
    },
  },
  {
    id: "rule_iron",
    match: [
      { key: "ferritin", flag: "any" },
      { key: "iron", flag: "low" },
      { key: "transferrin_saturation", flag: "any" },
      { key: "hemoglobin", flag: "low" },
    ],
    question: {
      id: "rule_iron",
      prompt:
        "An iron-related marker is outside its printed range. Does anything here apply?",
      options: [
        "Fatigue or low energy",
        "Vegetarian or low red-meat diet",
        "I take an iron supplement",
        "Heavy periods",
        "I donate blood regularly",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Diet, supplementation and blood loss are the usual context your doctor checks against iron studies.",
    },
  },
  {
    id: "rule_glucose",
    match: [
      { key: "glucose", flag: "high" },
      { key: "hba1c", flag: "high" },
      { key: "insulin", flag: "high" },
      { key: "homa_ir", flag: "high" },
    ],
    question: {
      id: "rule_glucose",
      prompt:
        "A blood sugar marker is above its printed range. What's most true for you?",
      options: [
        "Sugary drinks or snacks most days",
        "Diabetes runs in my family",
        "I rarely exercise",
        "Sleep is consistently poor",
        "Weight has crept up recently",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Diet, family history, movement and sleep shape how your doctor interprets glucose and HbA1c.",
    },
  },
  {
    id: "rule_vitd",
    match: [{ key: "vitamin_d", flag: "low" }],
    question: {
      id: "rule_vitd",
      prompt:
        "Your vitamin D sits below its printed range. Which fits you best?",
      options: [
        "Mostly indoors during the day",
        "I already take vitamin D",
        "I use sunscreen daily",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Sun exposure and supplementation are the first context your doctor pairs with a low vitamin D.",
    },
  },
  {
    id: "rule_inflammation",
    match: [
      { key: "crp", flag: "high" },
      { key: "esr", flag: "high" },
    ],
    question: {
      id: "rule_inflammation",
      prompt:
        "An inflammation marker is above its printed range. Anything recent that could explain it?",
      options: [
        "Recent illness or injury",
        "Intense training this week",
        "Ongoing joint or gut issues",
        "Recent vaccination",
        "None of these",
      ],
      allowFreeText: true,
      whyWeAsk:
        "Inflammation markers react to short-term events — recent context stops them being over-read.",
    },
  },
];

function flagMatches(ruleFlag, findingFlag) {
  if (!findingFlag) return false;
  if (ruleFlag === "any") return true;
  return ruleFlag === findingFlag || findingFlag === "abnormal";
}

/**
 * Matches structured out-of-range findings against the rule bank.
 * Returns DynamicQuestion objects (origin "rules", triggeredBy filled).
 */
export function matchRules(findings) {
  const out = [];
  for (const rule of QUESTION_RULES) {
    const triggeredBy = [];
    for (const finding of findings ?? []) {
      const key = finding.canonicalKey ?? canonicalKeyFor(finding.name);
      if (!key) continue;
      const matched = rule.match.some(
        (m) => m.key === key && flagMatches(m.flag, finding.flag),
      );
      if (matched && !triggeredBy.includes(finding.name)) {
        triggeredBy.push(finding.name);
      }
    }
    if (triggeredBy.length > 0) {
      out.push({
        ...rule.question,
        triggeredBy: triggeredBy.slice(0, 6),
        origin: "rules",
      });
    }
  }
  return out;
}
