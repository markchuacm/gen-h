// ─── Doctor Review Brief · client rule bank ───────────────────────────────────
// Mirror of server/questionRules.mjs (keep in sync). The client copy exists so
// finding-driven questions still fire from persisted findings even when the
// pipeline (and its server-side merge) is unreachable — adaptivity never
// silently degrades to a generic question.

import type {
  DynamicQuestion,
  IntakeState,
  MarkerFinding,
  MarkerFlag,
} from "./types";

export const MARKER_ALIASES: Record<string, string[]> = {
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

type RuleFlag = "high" | "low" | "any";

type QuestionRule = {
  id: string;
  match: Array<{ key: string; flag: RuleFlag }>;
  question: Omit<DynamicQuestion, "triggeredBy" | "origin">;
  acks: Record<string, string>;
};

export const QUESTION_RULES: QuestionRule[] = [
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
    acks: {
      "I take creatine":
        "Noted — creatine can shift creatinine readings; your doctor will factor this in.",
      "Regular heavy resistance training":
        "Noted — heavy training can change kidney-related markers in context.",
      "High-protein diet":
        "Noted — protein intake is useful context for your doctor.",
      "I probably don't drink enough water":
        "Noted — hydration context helps your doctor read these markers.",
      "Kidney issues in my family or history":
        "Noted — family or personal history belongs in the brief.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Vegan or vegetarian diet":
        "Noted — diet pattern is useful context alongside B12.",
      "Digestive or gut issues":
        "Noted — gut context helps your doctor interpret B12.",
      "I already take a B12 supplement":
        "Noted — supplementation timing matters for your doctor.",
      "Ongoing fatigue": "Noted — symptoms will be included for review.",
      "Tingling or numbness in hands/feet":
        "Noted — that symptom context will go into the brief.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Heart disease runs in my family":
        "Noted — family history helps your doctor read lipid markers.",
      "My diet leans fried / processed / takeout":
        "Noted — diet pattern is helpful context for lipid review.",
      "I rarely exercise": "Noted — movement context will be included.",
      "Alcohol most weeks": "Noted — alcohol context will be included.",
      "Sleep is consistently poor":
        "Noted — sleep can matter when reviewing metabolic context.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Alcohol most weeks": "Noted — alcohol context will be included.",
      "Started a new medication":
        "Noted — recent medication changes are important for review.",
      "I take supplements regularly":
        "Noted — supplement use belongs in the doctor brief.",
      "Recent illness or infection":
        "Noted — recent illness can help your doctor interpret timing.",
      "Heavy training block lately":
        "Noted — recent training load will be included.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Ongoing fatigue": "Noted — symptom context will be included.",
      "Weight change without trying":
        "Noted — weight change context will be included.",
      "Feeling unusually cold or hot":
        "Noted — temperature sensitivity belongs in the brief.",
      "Thyroid issues in my family":
        "Noted — family thyroid history helps your doctor.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Fatigue or low energy": "Noted — symptom context will be included.",
      "Vegetarian or low red-meat diet":
        "Noted — diet pattern is useful for iron review.",
      "I take an iron supplement":
        "Noted — supplement use helps your doctor read iron markers.",
      "Heavy periods": "Noted — this context matters for iron studies.",
      "I donate blood regularly":
        "Noted — donation history is useful context for iron markers.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Sugary drinks or snacks most days":
        "Noted — diet pattern will be included for review.",
      "Diabetes runs in my family":
        "Noted — family history helps your doctor read glucose markers.",
      "I rarely exercise": "Noted — movement context will be included.",
      "Sleep is consistently poor":
        "Noted — sleep context will be included.",
      "Weight has crept up recently":
        "Noted — recent weight change will be included.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Mostly indoors during the day":
        "Noted — sun exposure context will be included.",
      "I already take vitamin D":
        "Noted — supplementation context helps your doctor.",
      "I use sunscreen daily":
        "Noted — sun exposure habits will be included.",
      "None of these": "Noted — that's useful context on its own.",
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
    acks: {
      "Recent illness or injury":
        "Noted — recent timing context will be included.",
      "Intense training this week":
        "Noted — recent training is useful context.",
      "Ongoing joint or gut issues":
        "Noted — symptom context will be included.",
      "Recent vaccination":
        "Noted — recent vaccination timing will be included.",
      "None of these": "Noted — that's useful context on its own.",
    },
  },
];

export const DEFAULT_RULE_ACK = "Added to your brief — this helps your doctor read the result in context.";

// Longer aliases first so "free t4" wins over shorter overlaps; word-boundary
// matching so "alt" never matches inside "alkaline".
const ALIAS_INDEX = Object.entries(MARKER_ALIASES)
  .flatMap(([key, aliases]) => aliases.map((alias) => ({ key, alias })))
  .sort((a, b) => b.alias.length - a.alias.length);

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Maps a printed marker name to its canonical key, or undefined. */
export function canonicalKeyFor(name: string): string | undefined {
  const normalized = normalizeName(name ?? "");
  if (!normalized) return undefined;
  for (const { key, alias } of ALIAS_INDEX) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(normalized)) {
      return key;
    }
  }
  return undefined;
}

function flagMatches(ruleFlag: RuleFlag, findingFlag: MarkerFlag): boolean {
  if (!findingFlag) return false;
  if (ruleFlag === "any") return true;
  return ruleFlag === findingFlag || findingFlag === "abnormal";
}

/** Matches out-of-range findings against the rule bank → DynamicQuestions. */
export function matchRules(findings: MarkerFinding[]): DynamicQuestion[] {
  const out: DynamicQuestion[] = [];
  for (const rule of QUESTION_RULES) {
    const triggeredBy: string[] = [];
    for (const finding of findings) {
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

function normalizePrompt(prompt: string): string {
  return prompt.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function findingsFromState(state: IntakeState): MarkerFinding[] {
  const findings: MarkerFinding[] = [];
  for (const file of state.uploadedFiles) {
    const insight = state.aiDocumentInsights?.[file.id];
    if (!insight) continue;
    (insight.markers ?? []).forEach((marker, index) => {
      const canonicalKey = canonicalKeyFor(marker.name);
      findings.push({
        ...marker,
        id: `${file.id}:${canonicalKey ?? "m"}:${index}`,
        canonicalKey,
        sourceFileId: file.id,
        sourceLabel:
          [insight.documentType, insight.provider].filter(Boolean).join(" · ") ||
          file.name,
      });
    });
  }
  return findings;
}

export function buildAdaptiveQueue(state: IntakeState): DynamicQuestion[] {
  const ruleQuestions = matchRules(findingsFromState(state).filter((f) => f.flag));
  const aiQuestions = Object.values(state.aiDocumentInsights ?? {}).flatMap(
    (insight) =>
      insight.status === "done"
        ? (insight.contextQuestions ?? []).filter(
            (question) => question.options.length >= 2,
          )
        : [],
  );
  const merged: DynamicQuestion[] = [];
  const seenPrompts = new Set<string>();
  const coveredTriggers = new Set<string>();

  for (const q of [...ruleQuestions, ...aiQuestions]) {
    if (merged.length >= 4) break;
    const promptKey = normalizePrompt(q.prompt);
    if (!promptKey || seenPrompts.has(promptKey)) continue;
    const triggers = (q.triggeredBy ?? []).map((t) => t.toLowerCase());
    if (triggers.length > 0 && triggers.every((t) => coveredTriggers.has(t))) {
      continue;
    }
    seenPrompts.add(promptKey);
    triggers.forEach((t) => coveredTriggers.add(t));
    merged.push(q);
  }
  return merged;
}

export function ackForAnswer(question: DynamicQuestion, answer: string): string {
  const parts = answer
    .split(" · ")
    .map((part) => part.trim())
    .filter(Boolean);
  const selectedOptions = question.options.filter((option) =>
    parts.includes(option),
  );
  if (parts.length === 0) return "";
  if (selectedOptions.includes("None of these"))
    return "Noted — that's useful context on its own.";
  if (question.origin === "rules") {
    const rule = QUESTION_RULES.find((r) => r.id === question.id);
    if (selectedOptions.length === 1) {
      return rule?.acks[selectedOptions[0]] ?? DEFAULT_RULE_ACK;
    }
    return "Noted — those details will help your doctor read these markers in context.";
  }
  const marker = question.triggeredBy?.[0] ?? "uploaded";
  return `Added to your brief — this helps your doctor read the ${marker} result in context.`;
}
