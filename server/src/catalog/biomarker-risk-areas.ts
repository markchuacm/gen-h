/**
 * Clinical coverage areas used by the doctor panel builder. These are kept
 * separate from laboratory/body-system categories: a marker can be reported
 * under one category while contributing to several clinical risk areas.
 *
 * Advanced Baseline deliberately is not listed here. It is a UI shortcut for
 * the complete active catalog, never a partial mapping that can drift from it.
 */
export type BiomarkerRiskAreaDefinition = {
  id: string;
  name: string;
  description: string;
  displayOrder: number;
  biomarkerIds: readonly string[];
};

const HEART = [
  "apolipoprotein-a1",
  "apolipoprotein-b-apob",
  "apolipoprotein-b-a1-ratio",
  "hdl-cholesterol",
  "ldl-cholesterol",
  "non-hdl-cholesterol",
  "total-cholesterol",
  "total-cholesterol-hdl-ratio",
  "triglycerides",
] as const;

const BLOOD = [
  "hematocrit",
  "hemoglobin",
  "mean-corpuscular-hemoglobin-mch",
  "mean-corpuscular-hemoglobin-concentration-mchc",
  "mean-corpuscular-volume-mcv",
  "peripheral-blood-film",
  "platelet-count",
  "red-blood-cell-count",
  "red-cell-distribution-width-rdw",
] as const;

const IMMUNE = [
  "basophils",
  "eosinophils",
  "erythrocyte-sedimentation-rate",
  "high-sensitivity-c-reactive-protein-hs-crp",
  "lymphocytes",
  "monocytes",
  "neutrophils",
  "white-blood-cell-count",
] as const;

const IRON_STUDIES = [
  "ferritin",
  "iron",
  "iron-percent-saturation",
  "iron-binding-capacity",
  "transferrin",
] as const;

const KIDNEYS = [
  "albumin-microalbumin-urine",
  "creatinine",
  "estimated-glomerular-filtration-rate-egfr",
  "urea",
  "urine-albumin-creatinine-ratio",
  "urine-creatinine",
] as const;

const ELECTROLYTES = ["chloride", "potassium", "sodium"] as const;

const URINE = [
  "other-urine-microscopy-findings",
  "squamous-epithelial-cells",
  "appearance-urine",
  "bilirubin-urine",
  "color-urine",
  "crystals-urine",
  "glucose-urine",
  "hyaline-casts-urine",
  "ketones-urine",
  "leukocyte-esterase-urine",
  "nitrite-urine",
  "occult-blood-urine",
  "ph-urine",
  "protein-urine",
  "red-blood-cell-urine",
  "specific-gravity-urine",
  "urobilinogen-urine",
  "white-blood-cell-urine",
] as const;

const LIVER = [
  "alanine-transaminase-alt",
  "albumin",
  "albumin-globulin-ratio",
  "alkaline-phosphatase-alp",
  "aspartate-aminotransferase-ast",
  "fibrosis-4-score",
  "gamma-glutamyl-transferase-ggt",
  "globulin",
  "total-bilirubin",
  "total-protein",
] as const;

const THYROID = [
  "free-thyroxine-free-t4",
  "free-triiodothyronine-free-t3",
  "thyroid-stimulating-hormone-tsh",
] as const;

const REPRODUCTIVE_HORMONES = [
  "dhea-sulfate",
  "estradiol",
  "follicle-stimulating-hormone-fsh",
  "free-androgen-index",
  "free-testosterone",
  "luteinizing-hormone-lh",
  "progesterone",
  "prolactin",
  "sex-hormone-binding-globulin-shbg",
  "total-testosterone",
] as const;

const INFECTIOUS = [
  "helicobacter-pylori-igg-antibody",
  "hepatitis-a-antibody",
  "hepatitis-b-surface-antibody",
  "hepatitis-b-surface-antigen",
  "hiv-antigen-antibody-screen",
  "treponema-pallidum-antibody",
] as const;

export const BIOMARKER_RISK_AREAS: readonly BiomarkerRiskAreaDefinition[] = [
  {
    id: "cardiovascular-risk",
    name: "Cardiovascular Risk",
    description: "Lipids, inflammation, glucose regulation and vascular kidney markers.",
    displayOrder: 1,
    biomarkerIds: [
      ...HEART,
      "high-sensitivity-c-reactive-protein-hs-crp",
      "homocysteine",
      "glucose",
      "hemoglobin-a1c-hba1c",
      "insulin",
      "creatinine",
      "estimated-glomerular-filtration-rate-egfr",
      "albumin-microalbumin-urine",
      "urine-albumin-creatinine-ratio",
      "sodium",
      "potassium",
    ],
  },
  {
    id: "metabolic-health",
    name: "Metabolic Health",
    description: "Glycaemic, lipid, liver and urine markers for metabolic dysfunction.",
    displayOrder: 2,
    biomarkerIds: [
      "glucose",
      "hemoglobin-a1c-hba1c",
      "insulin",
      "uric-acid",
      "triglycerides",
      "hdl-cholesterol",
      "alanine-transaminase-alt",
      "aspartate-aminotransferase-ast",
      "gamma-glutamyl-transferase-ggt",
      "fibrosis-4-score",
      "glucose-urine",
      "ketones-urine",
      "protein-urine",
      "urine-albumin-creatinine-ratio",
    ],
  },
  {
    id: "blood-inflammation-immunity",
    name: "Blood, Inflammation & Immunity",
    description: "Full blood count, immune cells, inflammation and iron status.",
    displayOrder: 3,
    biomarkerIds: [...BLOOD, ...IMMUNE, ...IRON_STUDIES],
  },
  {
    id: "kidney-urinary-health",
    name: "Kidney & Urinary Health",
    description: "Kidney function, electrolytes, urinalysis and urine microscopy.",
    displayOrder: 4,
    biomarkerIds: [...KIDNEYS, ...ELECTROLYTES, ...URINE],
  },
  {
    id: "liver-digestive-health",
    name: "Liver & Digestive Health",
    description: "Liver proteins, enzymes, fibrosis, digestive and hepatitis screening.",
    displayOrder: 5,
    biomarkerIds: [
      ...LIVER,
      "helicobacter-pylori-igg-antibody",
      "hepatitis-a-antibody",
      "hepatitis-b-surface-antibody",
      "hepatitis-b-surface-antigen",
      "bilirubin-urine",
      "urobilinogen-urine",
    ],
  },
  {
    id: "thyroid-hormones-ageing",
    name: "Thyroid, Hormones & Ageing",
    description: "Thyroid, reproductive hormone, stress and healthy-ageing markers.",
    displayOrder: 6,
    biomarkerIds: [...THYROID, ...REPRODUCTIVE_HORMONES, "cortisol", "insulin-like-growth-factor-1"],
  },
  {
    id: "nutrients-bone-health",
    name: "Nutrients & Bone Health",
    description: "Vitamin D, mineral, iron and bone-related protein markers.",
    displayOrder: 7,
    biomarkerIds: [
      "vitamin-d",
      "calcium",
      "corrected-calcium",
      "magnesium",
      "phosphorus",
      ...IRON_STUDIES,
      "homocysteine",
      "albumin",
      "total-protein",
      "alkaline-phosphatase-alp",
    ],
  },
  {
    id: "infectious-disease-screening",
    name: "Infectious Disease Screening",
    description: "Screening assays for HIV, hepatitis, syphilis and H. pylori.",
    displayOrder: 8,
    biomarkerIds: INFECTIOUS,
  },
  {
    id: "life-stage-risk",
    name: "Life Stage Risk",
    description: "Tests selected for age, sex, symptoms, family history and clinical context.",
    displayOrder: 9,
    biomarkerIds: [
      "prostate-specific-antigen-psa-total",
      "alpha-fetoprotein",
      "cancer-antigen-19-9",
      "carcinoembryonic-antigen",
      ...REPRODUCTIVE_HORMONES,
      "cortisol",
      "insulin-like-growth-factor-1",
      "hiv-antigen-antibody-screen",
      "hepatitis-b-surface-antigen",
      "treponema-pallidum-antibody",
    ],
  },
];

/** Refuse to seed an incomplete or stale coverage map. */
export function validateRiskAreaMembership(activeBiomarkerIds: Iterable<string>): void {
  const active = new Set(activeBiomarkerIds);
  const covered = new Set<string>();
  const errors: string[] = [];

  for (const area of BIOMARKER_RISK_AREAS) {
    if (area.biomarkerIds.length === 0) errors.push(`${area.name}: contains no biomarkers`);
    const seen = new Set<string>();
    for (const id of area.biomarkerIds) {
      if (seen.has(id)) errors.push(`${area.name}: duplicates ${id}`);
      seen.add(id);
      if (!active.has(id)) errors.push(`${area.name}: references unknown or inactive biomarker ${id}`);
      else covered.add(id);
    }
  }

  for (const id of active) {
    if (!covered.has(id)) errors.push(`${id}: belongs to no risk area`);
  }

  if (errors.length) {
    throw new Error(`Invalid biomarker risk-area map:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
  }
}
