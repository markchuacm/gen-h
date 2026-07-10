// Turns a member's profile into a recommended blood panel: a baseline everyone
// gets, plus condition-driven bundles triggered by their stated goals,
// symptoms and family history. All codes are catalog ids from biomarkerData.ts.
// Pure and self-contained so the doctor lands on a sensible, editable draft.

export type RecommendationInput = {
  sex: string;
  age: number | null;
  goals: string[];
  symptoms: string[];
  family: string[];
};

export type PanelBundle = {
  id: string;
  label: string;
  /** Why it surfaced — shown as the chip's tooltip. */
  reason: string;
  codes: string[];
  applies: (input: RecommendationInput) => boolean;
};

// A comprehensive baseline ("advanced blood baseline") ordered for everyone.
export const BASELINE_CODES: string[] = [
  // Heart
  "total-cholesterol",
  "ldl-cholesterol",
  "hdl-cholesterol",
  "non-hdl-cholesterol",
  "triglycerides",
  "apolipoprotein-b-apob",
  "high-sensitivity-c-reactive-protein-hs-crp",
  // Metabolic
  "glucose",
  "hemoglobin-a1c-hba1c",
  "insulin",
  // Nutrients
  "ferritin",
  "iron",
  "vitamin-d",
  "magnesium",
  "homocysteine",
  "omega-3-total",
  // Thyroid
  "thyroid-stimulating-hormone-tsh",
  // Liver
  "alanine-transaminase-alt",
  "aspartate-aminotransferase-ast",
  "gamma-glutamyl-transferase-ggt",
  "albumin",
  "total-protein",
  "total-bilirubin",
  "alkaline-phosphatase-alp",
  // Kidneys
  "creatinine",
  "estimated-glomerular-filtration-rate-egfr",
  "blood-urea-nitrogen-bun",
  "sodium",
  "potassium",
  "calcium",
  // Blood
  "hemoglobin",
  "hematocrit",
  "red-blood-cell-count",
  "white-blood-cell-count",
  "platelet-count",
  "mean-corpuscular-volume-mcv",
];

/** The baseline as a quick-add chip, so the 35 pre-ticked markers are visible
    and toggleable like any other bundle. Not part of PANEL_BUNDLES because it
    applies unconditionally. */
export const BASELINE_BUNDLE = {
  id: "baseline",
  label: "Advanced baseline",
  reason: "Ordered for every member",
  codes: BASELINE_CODES,
};

function hasAny(list: string[], values: string[]) {
  return values.some((value) => list.includes(value));
}

function isMale(sex: string) {
  return sex.toLowerCase().startsWith("m");
}

export const PANEL_BUNDLES: PanelBundle[] = [
  {
    id: "cardiovascular",
    label: "Cardiovascular",
    reason: "Family history or a cardiovascular-prevention goal",
    codes: [
      "apolipoprotein-b-apob",
      "lipoprotein-a",
      "ldl-particle-number",
      "ldl-small",
      "ldl-pattern",
      "total-cholesterol-hdl-ratio",
      "high-sensitivity-c-reactive-protein-hs-crp",
    ],
    applies: (input) =>
      hasAny(input.family, ["Heart disease", "High blood pressure", "High cholesterol", "Stroke"]) ||
      input.goals.includes("Cardiovascular prevention"),
  },
  {
    id: "metabolic",
    label: "Metabolic",
    reason: "Family history of diabetes or a metabolic / body-composition goal",
    codes: ["glucose", "hemoglobin-a1c-hba1c", "insulin", "uric-acid", "leptin"],
    applies: (input) =>
      input.family.includes("Diabetes") ||
      hasAny(input.goals, ["Blood sugar / metabolic health", "Body composition"]) ||
      input.symptoms.includes("Body composition concerns"),
  },
  {
    id: "thyroid-fatigue",
    label: "Thyroid & fatigue",
    reason: "Low energy, brain fog or an energy / focus goal",
    codes: [
      "thyroid-stimulating-hormone-tsh",
      "free-thyroxine-free-t4",
      "free-triiodothyronine-free-t3",
      "ferritin",
      "iron",
      "iron-percent-saturation",
      "vitamin-d",
      "methylmalonic-acid",
      "homocysteine",
    ],
    applies: (input) =>
      hasAny(input.symptoms, [
        "Low energy / afternoon crash",
        "Brain fog / poor focus",
        "Waking unrefreshed",
        "Frequent illness / slow recovery",
      ]) || hasAny(input.goals, ["Energy", "Focus / brain fog"]),
  },
  {
    id: "hormones-male",
    label: "Hormones — male",
    reason: "Libido, mood or hormone-related goals",
    codes: [
      "total-testosterone",
      "free-testosterone",
      "sex-hormone-binding-globulin-shbg",
      "estradiol",
      "luteinizing-hormone-lh",
      "follicle-stimulating-hormone-fsh",
      "prolactin",
      "dhea-sulfate",
    ],
    applies: (input) =>
      isMale(input.sex) &&
      (input.goals.includes("Libido / hormones") ||
        hasAny(input.symptoms, ["Low libido / drive", "Low mood / anxiety / irritability"])),
  },
  {
    id: "hormones-female",
    label: "Hormones — female",
    reason: "Libido, mood or hormone-related goals",
    codes: [
      "estradiol",
      "follicle-stimulating-hormone-fsh",
      "luteinizing-hormone-lh",
      "prolactin",
      "sex-hormone-binding-globulin-shbg",
      "total-testosterone",
      "free-testosterone",
      "anti-mullerian-hormone-amh",
      "dhea-sulfate",
    ],
    applies: (input) =>
      !isMale(input.sex) &&
      (input.goals.includes("Libido / hormones") ||
        hasAny(input.symptoms, ["Low libido / drive", "Low mood / anxiety / irritability"])),
  },
  {
    id: "stress",
    label: "Stress & adrenal",
    reason: "Mood / stress goal or low mood symptoms",
    codes: ["cortisol", "dhea-sulfate"],
    applies: (input) =>
      input.goals.includes("Mood / stress") ||
      input.symptoms.includes("Low mood / anxiety / irritability"),
  },
  {
    id: "prostate",
    label: "Prostate (PSA)",
    reason: "Male, age 45+",
    codes: [
      "prostate-specific-antigen-psa-total",
      "prostate-specific-antigen-psa-free",
      "prostate-specific-antigen-psa-percent-free",
    ],
    applies: (input) => isMale(input.sex) && (input.age ?? 0) >= 45,
  },
];

/** Bundles relevant to this member — drives the quick-add chips. */
export function relevantBundles(input: RecommendationInput): PanelBundle[] {
  return PANEL_BUNDLES.filter((bundle) => bundle.applies(input));
}

/** Baseline plus every relevant bundle — the pre-selected recommendation. */
export function recommendedCodes(input: RecommendationInput): string[] {
  const codes = new Set(BASELINE_CODES);
  for (const bundle of relevantBundles(input)) {
    for (const code of bundle.codes) codes.add(code);
  }
  return [...codes];
}
