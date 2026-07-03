import type { Biomarker, BiomarkerCategory, PatientResult } from "./types";
// Generated from Core rows in Gen-h_full-biomarkers_cleaned.xlsx.
// SI units and range expressions come from function_health_biomarkers_dashboard_ranges_clean_SI_reference_labs.xlsx.
// Function Health explanation fields are blank when no direct or aliased match was found.

export const BIOMARKER_CATEGORIES: BiomarkerCategory[] = [
  {
    "name": "Heart",
    "description": "Cholesterol, lipid particles and inflammation markers that help frame cardiovascular risk.",
    "biomarkerIds": [
      "apolipoprotein-b-apob",
      "hdl-cholesterol",
      "hdl-large",
      "high-sensitivity-c-reactive-protein-hs-crp",
      "ldl-cholesterol",
      "ldl-medium",
      "ldl-particle-number",
      "ldl-pattern",
      "ldl-peak-size",
      "ldl-small",
      "lipoprotein-a",
      "non-hdl-cholesterol",
      "total-cholesterol",
      "total-cholesterol-hdl-ratio",
      "triglycerides"
    ]
  },
  {
    "name": "Thyroid",
    "description": "Hormones and antibodies that help your doctor understand thyroid signalling and activity.",
    "biomarkerIds": [
      "thyroglobulin-antibodies-tgab",
      "thyroid-peroxidase-antibodies-tpo",
      "thyroid-stimulating-hormone-tsh",
      "free-thyroxine-free-t4",
      "free-triiodothyronine-free-t3"
    ]
  },
  {
    "name": "Autoimmunity",
    "description": "Immune markers that can point to patterns your doctor may interpret with symptoms and history.",
    "biomarkerIds": [
      "antinuclear-antibodies-ana-pattern",
      "antinuclear-antibodies-ana-screen",
      "antinuclear-antibodies-titer",
      "rheumatoid-factor-rf"
    ]
  },
  {
    "name": "Immune Regulation",
    "description": "White blood cell and inflammation markers that reflect immune activity and balance.",
    "biomarkerIds": [
      "basophils",
      "eosinophils",
      "high-sensitivity-c-reactive-protein-hs-crp",
      "lymphocytes",
      "monocytes",
      "neutrophils",
      "white-blood-cell-count"
    ]
  },
  {
    "name": "Female Health",
    "description": "Hormone markers commonly interpreted in reproductive, cycle and endocrine context.",
    "biomarkerIds": [
      "anti-mullerian-hormone-amh",
      "dhea-sulfate",
      "estradiol",
      "follicle-stimulating-hormone-fsh",
      "luteinizing-hormone-lh",
      "prolactin",
      "sex-hormone-binding-globulin-shbg",
      "free-testosterone",
      "total-testosterone"
    ]
  },
  {
    "name": "Male Health",
    "description": "Hormone and prostate markers interpreted alongside age, symptoms and health history.",
    "biomarkerIds": [
      "dhea-sulfate",
      "estradiol",
      "follicle-stimulating-hormone-fsh",
      "luteinizing-hormone-lh",
      "prolactin",
      "prostate-specific-antigen-psa-percent-free",
      "prostate-specific-antigen-psa-free",
      "prostate-specific-antigen-psa-total",
      "sex-hormone-binding-globulin-shbg",
      "free-testosterone",
      "total-testosterone"
    ]
  },
  {
    "name": "Metabolic",
    "description": "Blood sugar, insulin signalling and energy-regulation markers tied to metabolic health.",
    "biomarkerIds": [
      "glucose",
      "hemoglobin-a1c-hba1c",
      "insulin",
      "leptin",
      "uric-acid"
    ]
  },
  {
    "name": "Nutrients",
    "description": "Vitamin, mineral, fatty acid and iron markers that help assess nutritional status.",
    "biomarkerIds": [
      "arachidonic-acid-epa-ratio",
      "calcium",
      "ferritin",
      "homocysteine",
      "iron",
      "iron-percent-saturation",
      "iron-binding-capacity",
      "magnesium",
      "methylmalonic-acid",
      "omega-3-total",
      "omega-3-dha",
      "omega-3-dpa",
      "omega-3-epa",
      "omega-6-omega-3-ratio",
      "omega-6-total",
      "omega-6-arachidonic-acid",
      "omega-6-linoleic-acid",
      "vitamin-d",
      "zinc"
    ]
  },
  {
    "name": "Stress & Aging",
    "description": "Hormone markers that can reflect adrenal output and stress physiology over time.",
    "biomarkerIds": [
      "cortisol",
      "dhea-sulfate"
    ]
  },
  {
    "name": "Liver",
    "description": "Proteins, enzymes and bilirubin markers used to understand liver and biliary patterns.",
    "biomarkerIds": [
      "alanine-transaminase-alt",
      "albumin",
      "albumin-globulin-ratio",
      "alkaline-phosphatase-alp",
      "aspartate-aminotransferase-ast",
      "gamma-glutamyl-transferase-ggt",
      "globulin",
      "total-bilirubin",
      "total-protein"
    ]
  },
  {
    "name": "Kidneys",
    "description": "Filtration, electrolyte and urine-protein markers that help frame kidney function.",
    "biomarkerIds": [
      "albumin-microalbumin-urine",
      "blood-urea-nitrogen-bun",
      "bun-creatinine-ratio",
      "calcium",
      "chloride",
      "creatinine",
      "estimated-glomerular-filtration-rate-egfr",
      "potassium",
      "sodium"
    ]
  },
  {
    "name": "Pancreas",
    "description": "Digestive enzyme markers that may be interpreted when pancreatic stress is a concern.",
    "biomarkerIds": [
      "amylase",
      "lipase"
    ]
  },
  {
    "name": "Blood",
    "description": "Blood count and blood-type markers that describe oxygen carrying, clotting and cell patterns.",
    "biomarkerIds": [
      "abo-group-and-rhesus-rh-factor",
      "hematocrit",
      "hemoglobin",
      "mean-corpuscular-hemoglobin-mch",
      "mean-corpuscular-hemoglobin-concentration-mchc",
      "mean-corpuscular-volume-mcv",
      "mean-platelet-volume-mpv",
      "platelet-count",
      "red-blood-cell-count",
      "red-cell-distribution-width-rdw"
    ]
  },
  {
    "name": "Electrolytes",
    "description": "Minerals and acid-base markers important for hydration, nerve and muscle function.",
    "biomarkerIds": [
      "calcium",
      "carbon-dioxide",
      "chloride",
      "magnesium",
      "potassium",
      "sodium"
    ]
  },
  {
    "name": "Urine",
    "description": "Urinalysis markers that can show hydration, kidney, infection or metabolic clues.",
    "biomarkerIds": [
      "albumin-microalbumin-urine",
      "amorphous-sediment-urine",
      "appearance-urine",
      "bacteria-urine",
      "bilirubin-urine",
      "calcium-oxalate-crystals-urine",
      "color-urine",
      "glucose-urine",
      "hyaline-casts-urine",
      "ketones-urine",
      "leukocyte-esterase-urine",
      "leukocyte-urine",
      "nitrite-urine",
      "occult-blood-urine",
      "ph-urine",
      "protein-urine",
      "red-blood-cell-urine",
      "specific-gravity-urine",
      "squamous-epithelial-cells",
      "white-blood-cell-urine",
      "yeast-urine"
    ]
  },
  {
    "name": "Environmental Toxins",
    "description": "Heavy metal markers interpreted with exposure history and clinical context.",
    "biomarkerIds": [
      "lead",
      "mercury"
    ]
  }
];

export const BIOMARKERS: Biomarker[] = [
  {
    "id": "apolipoprotein-b-apob",
    "name": "Apolipoprotein B - ApoB",
    "displayName": "Apolipoprotein B",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "ApoB",
      "ApoB Apolipoprotein B",
      "Apolipoprotein B",
      "Apolipoprotein B (ApoB)",
      "Apolipoprotein B - ApoB"
    ],
    "description": "Counts the number of atherogenic lipoprotein particles that can enter artery walls; often a sharper cardiovascular risk marker than LDL-C alone.",
    "whatItMeasures": "Counts the number of atherogenic lipoprotein particles that can enter artery walls; often a sharper cardiovascular risk marker than LDL-C alone.",
    "whyItMatters": "This can be associated with cardiovascular disease; atherosclerosis; dyslipidemia; metabolic syndrome; insulin resistance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "g/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<0.8; <0.65",
    "suboptimalRangeLabel": "0.8-0.99; 1-1.29",
    "outOfRangeLabel": ">=1.3",
    "lowerOptimal": null,
    "upperOptimal": 0.8,
    "lowerReference": null,
    "upperReference": 1.3,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 0.58,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.56,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.57,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.58,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "hdl-cholesterol",
    "name": "HDL Cholesterol",
    "displayName": "HDL Cholesterol",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "HDL Cholesterol"
    ],
    "description": "Measures cholesterol carried by HDL particles, commonly interpreted alongside triglycerides, LDL and other lipid markers for cardiometabolic risk.",
    "whatItMeasures": "Measures cholesterol carried by HDL particles, commonly interpreted alongside triglycerides, LDL and other lipid markers for cardiometabolic risk.",
    "whyItMatters": "This can be associated with low hdl; cardiovascular risk; metabolic syndrome; insulin resistance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": ">=1.55",
    "suboptimalRangeLabel": "M:1.04-1.53; F:1.29-1.53",
    "outOfRangeLabel": "M:<1.04; F:<1.29",
    "lowerOptimal": 1.55,
    "upperOptimal": null,
    "lowerReference": 1.04,
    "upperReference": null,
    "directionality": "higher_is_better",
    "status": "optimal",
    "latestValue": 1.74,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.67,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.72,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.74,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "hdl-large",
    "name": "HDL Large",
    "displayName": "HDL Large",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "HDL Large"
    ],
    "description": "Estimates larger HDL particles, one part of advanced lipid profiling that may reflect reverse cholesterol transport and cardiometabolic status.",
    "whatItMeasures": "Estimates larger HDL particles, one part of advanced lipid profiling that may reflect reverse cholesterol transport and cardiometabolic status.",
    "whyItMatters": "This can be associated with cardiovascular risk; dyslipidemia; metabolic syndrome. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": ">6729",
    "suboptimalRangeLabel": "5353-6729",
    "outOfRangeLabel": "<5353",
    "lowerOptimal": 6729.0,
    "upperOptimal": null,
    "lowerReference": 5353.0,
    "upperReference": null,
    "directionality": "higher_is_better",
    "status": "optimal",
    "latestValue": 7536.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 7235.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 7461.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 7536.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "high-sensitivity-c-reactive-protein-hs-crp",
    "name": "High-Sensitivity C-Reactive Protein - hs-CRP",
    "displayName": "High-Sensitivity C-Reactive Protein",
    "category": "Heart",
    "categories": [
      "Heart",
      "Immune Regulation"
    ],
    "aliases": [
      "High-Sensitivity C-Reactive Protein",
      "High-Sensitivity C-Reactive Protein (hs-CRP)",
      "High-Sensitivity C-Reactive Protein - hs-CRP",
      "hs-CRP",
      "hs-CRP High-Sensitivity C-Reactive Protein"
    ],
    "description": "Measures low-grade systemic inflammation and is often used with lipid markers to refine cardiovascular and inflammatory risk.",
    "whatItMeasures": "Measures low-grade systemic inflammation and is often used with lipid markers to refine cardiovascular and inflammatory risk.",
    "whyItMatters": "This can be associated with systemic inflammation; cardiovascular risk; infection/inflammatory states; metabolic syndrome. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mg/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<1.0; <0.5",
    "suboptimalRangeLabel": "1.0-3.0; 3.0-10",
    "outOfRangeLabel": ">10",
    "lowerOptimal": null,
    "upperOptimal": 1.0,
    "lowerReference": null,
    "upperReference": 10.0,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 0.7,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.7,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.7,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.7,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "ldl-cholesterol",
    "name": "LDL Cholesterol",
    "displayName": "LDL Cholesterol",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "LDL Cholesterol"
    ],
    "description": "Measures cholesterol carried in LDL particles, a standard marker used in cardiovascular risk assessment.",
    "whatItMeasures": "Measures cholesterol carried in LDL particles, a standard marker used in cardiovascular risk assessment.",
    "whyItMatters": "This can be associated with high ldl; atherosclerosis; cardiovascular disease; familial hypercholesterolemia. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<2.59; <1.81",
    "suboptimalRangeLabel": "2.59-3.34; 3.37-4.12",
    "outOfRangeLabel": ">=4.14; >=4.92",
    "lowerOptimal": null,
    "upperOptimal": 2.59,
    "lowerReference": null,
    "upperReference": 4.14,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 1.86,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.79,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.84,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.86,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "ldl-medium",
    "name": "LDL Medium",
    "displayName": "LDL Medium",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "LDL Medium"
    ],
    "description": "Measures medium-sized LDL particles as part of advanced lipid subfraction testing.",
    "whatItMeasures": "Measures medium-sized LDL particles as part of advanced lipid subfraction testing.",
    "whyItMatters": "This can be associated with dyslipidemia; atherosclerosis; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "<215",
    "suboptimalRangeLabel": "215-301",
    "outOfRangeLabel": ">301",
    "lowerOptimal": null,
    "upperOptimal": 215.0,
    "lowerReference": null,
    "upperReference": 301.0,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 155.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 149.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 153.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 155.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "ldl-particle-number",
    "name": "LDL Particle Number",
    "displayName": "LDL Particle Number",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "LDL Particle Number"
    ],
    "description": "Counts LDL particles rather than cholesterol mass; higher particle counts generally mean more opportunities for particles to enter vessel walls.",
    "whatItMeasures": "Counts LDL particles rather than cholesterol mass; higher particle counts generally mean more opportunities for particles to enter vessel walls.",
    "whyItMatters": "This can be associated with atherosclerosis; cardiovascular disease; dyslipidemia; metabolic syndrome. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<1000",
    "suboptimalRangeLabel": "1000-1299; 1300-1599",
    "outOfRangeLabel": ">=1600; >=2000",
    "lowerOptimal": null,
    "upperOptimal": 1000.0,
    "lowerReference": null,
    "upperReference": 1600.0,
    "directionality": "lower_is_better",
    "status": "at_risk",
    "latestValue": 1270.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1156.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 1232.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 1270.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "ldl-pattern",
    "name": "LDL Pattern",
    "displayName": "LDL Pattern",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "LDL Pattern"
    ],
    "description": "Classifies LDL particle pattern, often distinguishing smaller, denser LDL patterns from larger, more buoyant patterns.",
    "whatItMeasures": "Classifies LDL particle pattern, often distinguishing smaller, denser LDL patterns from larger, more buoyant patterns.",
    "whyItMatters": "This can be associated with atherogenic dyslipidemia; metabolic syndrome; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "categorical",
    "ruleType": "CATEGORICAL",
    "optimalRangeLabel": "A",
    "suboptimalRangeLabel": "A/B",
    "outOfRangeLabel": "B",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "A",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "ldl-peak-size",
    "name": "LDL Peak Size",
    "displayName": "LDL Peak Size",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "LDL Peak Size"
    ],
    "description": "Reports the dominant LDL particle size; smaller peak sizes can accompany insulin resistance and a more atherogenic lipid pattern.",
    "whatItMeasures": "Reports the dominant LDL particle size; smaller peak sizes can accompany insulin resistance and a more atherogenic lipid pattern.",
    "whyItMatters": "This can be associated with atherogenic dyslipidemia; insulin resistance; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nm",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": ">22.29",
    "suboptimalRangeLabel": "21.74-22.29",
    "outOfRangeLabel": "<21.74",
    "lowerOptimal": 22.29,
    "upperOptimal": null,
    "lowerReference": 21.74,
    "upperReference": null,
    "directionality": "higher_is_better",
    "status": "optimal",
    "latestValue": 25.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 24.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 24.8,
        "testDate": "2025-12-12"
      },
      {
        "value": 25.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "ldl-small",
    "name": "LDL Small",
    "displayName": "LDL Small",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "LDL Small"
    ],
    "description": "Measures small dense LDL particles, a pattern associated with insulin resistance and higher cardiovascular risk.",
    "whatItMeasures": "Measures small dense LDL particles, a pattern associated with insulin resistance and higher cardiovascular risk.",
    "whyItMatters": "This can be associated with atherogenic dyslipidemia; insulin resistance; metabolic syndrome; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "<142",
    "suboptimalRangeLabel": "142-219",
    "outOfRangeLabel": ">219",
    "lowerOptimal": null,
    "upperOptimal": 142.0,
    "lowerReference": null,
    "upperReference": 219.0,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 102.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 98.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 101.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 102.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "lipoprotein-a",
    "name": "Lipoprotein(a)",
    "displayName": "Lipoprotein(a)",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "Lipoprotein(a)"
    ],
    "description": "Measures a largely inherited cholesterol-carrying particle that can increase lifetime plaque and clotting risk independent of standard cholesterol.",
    "whatItMeasures": "Measures a largely inherited cholesterol-carrying particle that can increase lifetime plaque and clotting risk independent of standard cholesterol.",
    "whyItMatters": "This can be associated with cardiovascular disease; atherosclerosis; aortic valve disease; familial lipid risk; stroke risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<75",
    "suboptimalRangeLabel": "75-124",
    "outOfRangeLabel": ">=125",
    "lowerOptimal": null,
    "upperOptimal": 75.0,
    "lowerReference": null,
    "upperReference": 125.0,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 54.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 52.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 53.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 54.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "non-hdl-cholesterol",
    "name": "Non-HDL Cholesterol",
    "displayName": "Non-HDL Cholesterol",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "Non-HDL Cholesterol"
    ],
    "description": "Captures cholesterol carried by all non-HDL, potentially plaque-forming particles; useful when triglycerides are elevated.",
    "whatItMeasures": "Captures cholesterol carried by all non-HDL, potentially plaque-forming particles; useful when triglycerides are elevated.",
    "whyItMatters": "This can be associated with dyslipidemia; cardiovascular disease; metabolic syndrome. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<3.37; <2.59; <2.2",
    "suboptimalRangeLabel": "3.37-4.12",
    "outOfRangeLabel": ">=4.14",
    "lowerOptimal": null,
    "upperOptimal": 3.37,
    "lowerReference": null,
    "upperReference": 4.14,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 2.43,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 2.33,
        "testDate": "2025-06-20"
      },
      {
        "value": 2.41,
        "testDate": "2025-12-12"
      },
      {
        "value": 2.43,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "total-cholesterol",
    "name": "Total Cholesterol",
    "displayName": "Total Cholesterol",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "Total Cholesterol"
    ],
    "description": "Measures the overall amount of cholesterol across lipoprotein particles and is interpreted with HDL, LDL, triglycerides and ApoB.",
    "whatItMeasures": "Measures the overall amount of cholesterol across lipoprotein particles and is interpreted with HDL, LDL, triglycerides and ApoB.",
    "whyItMatters": "This can be associated with dyslipidemia; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "3.88-5.15",
    "suboptimalRangeLabel": "5.18-6.19; <3.88",
    "outOfRangeLabel": ">=6.22",
    "lowerOptimal": 3.88,
    "upperOptimal": 5.15,
    "lowerReference": 3.88,
    "upperReference": 6.22,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 5.63,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 5.12,
        "testDate": "2025-06-20"
      },
      {
        "value": 5.46,
        "testDate": "2025-12-12"
      },
      {
        "value": 5.63,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "total-cholesterol-hdl-ratio",
    "name": "Total Cholesterol / HDL Ratio",
    "displayName": "Total Cholesterol / HDL Ratio",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "Total Cholesterol / HDL Ratio"
    ],
    "description": "Compares total cholesterol with HDL and provides a simple lipid risk ratio, though it should be interpreted with ApoB and LDL metrics.",
    "whatItMeasures": "Compares total cholesterol with HDL and provides a simple lipid risk ratio, though it should be interpreted with ApoB and LDL metrics.",
    "whyItMatters": "This can be associated with cardiovascular risk; dyslipidemia; metabolic syndrome. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "ratio",
    "ruleType": "NUMERIC_RATIO",
    "optimalRangeLabel": "<3.5",
    "suboptimalRangeLabel": "3.5-5.0",
    "outOfRangeLabel": ">5.0",
    "lowerOptimal": null,
    "upperOptimal": 3.5,
    "lowerReference": null,
    "upperReference": 5.0,
    "directionality": "lower_is_better",
    "status": "at_risk",
    "latestValue": 4.17,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 3.79,
        "testDate": "2025-06-20"
      },
      {
        "value": 4.04,
        "testDate": "2025-12-12"
      },
      {
        "value": 4.17,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "triglycerides",
    "name": "Triglycerides",
    "displayName": "Triglycerides",
    "category": "Heart",
    "categories": [
      "Heart"
    ],
    "aliases": [
      "Triglycerides"
    ],
    "description": "Measures circulating triglyceride-rich fats, which can rise with insulin resistance, alcohol intake, diet, liver stress, or genetics.",
    "whatItMeasures": "Measures circulating triglyceride-rich fats, which can rise with insulin resistance, alcohol intake, diet, liver stress, or genetics.",
    "whyItMatters": "This can be associated with hypertriglyceridemia; metabolic syndrome; diabetes risk; pancreatitis risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<1.13; <1.69",
    "suboptimalRangeLabel": "1.13-1.68; 1.69-2.25",
    "outOfRangeLabel": ">=2.26; >=5.65",
    "lowerOptimal": null,
    "upperOptimal": 1.13,
    "lowerReference": null,
    "upperReference": 2.26,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 0.81,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.78,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.8,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.81,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "thyroglobulin-antibodies-tgab",
    "name": "Thyroglobulin Antibodies - TgAb",
    "displayName": "Thyroglobulin Antibodies",
    "category": "Thyroid",
    "categories": [
      "Thyroid"
    ],
    "aliases": [
      "TgAb",
      "TgAb Thyroglobulin Antibodies",
      "Thyroglobulin Antibodies",
      "Thyroglobulin Antibodies (TgAb)",
      "Thyroglobulin Antibodies - TgAb"
    ],
    "description": "Detects antibodies against thyroglobulin, often used to assess autoimmune thyroid activity.",
    "whatItMeasures": "Detects antibodies against thyroglobulin, often used to assess autoimmune thyroid activity.",
    "whyItMatters": "This can be associated with hashimoto thyroiditis; graves disease; autoimmune thyroid disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "IU/mL",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "<4.0",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": ">=4.0",
    "lowerOptimal": null,
    "upperOptimal": 4.0,
    "lowerReference": null,
    "upperReference": 4.0,
    "directionality": "lower_is_better",
    "status": "optimal",
    "latestValue": 2.88,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 2.76,
        "testDate": "2025-06-20"
      },
      {
        "value": 2.85,
        "testDate": "2025-12-12"
      },
      {
        "value": 2.88,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "thyroid-peroxidase-antibodies-tpo",
    "name": "Thyroid Peroxidase Antibodies - TPO",
    "displayName": "Thyroid Peroxidase Antibodies",
    "category": "Thyroid",
    "categories": [
      "Thyroid"
    ],
    "aliases": [
      "TPO",
      "TPO Thyroid Peroxidase Antibodies",
      "Thyroid Peroxidase Antibodies",
      "Thyroid Peroxidase Antibodies (TPO)",
      "Thyroid Peroxidase Antibodies - TPO"
    ],
    "description": "",
    "whatItMeasures": "",
    "whyItMatters": "",
    "unit": "",
    "ruleType": "",
    "optimalRangeLabel": "",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "thyroid-stimulating-hormone-tsh",
    "name": "Thyroid-Stimulating Hormone - TSH",
    "displayName": "Thyroid-Stimulating Hormone",
    "category": "Thyroid",
    "categories": [
      "Thyroid"
    ],
    "aliases": [
      "TSH",
      "TSH Thyroid-Stimulating Hormone",
      "Thyroid-Stimulating Hormone",
      "Thyroid-Stimulating Hormone (TSH)",
      "Thyroid-Stimulating Hormone - TSH"
    ],
    "description": "Measures pituitary signaling to the thyroid and is the primary screening marker for thyroid under- or over-activity.",
    "whatItMeasures": "Measures pituitary signaling to the thyroid and is the primary screening marker for thyroid under- or over-activity.",
    "whyItMatters": "This can be associated with hypothyroidism; hyperthyroidism; thyroid dysfunction. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mIU/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "1.0-2.5",
    "suboptimalRangeLabel": "2.5-4.5; 0.1-0.4",
    "outOfRangeLabel": "<0.1; >10",
    "lowerOptimal": 1.0,
    "upperOptimal": 2.5,
    "lowerReference": 0.1,
    "upperReference": 10.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 1.8,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.7,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.8,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.8,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "free-thyroxine-free-t4",
    "name": "Free Thyroxine - Free T4",
    "displayName": "Free Thyroxine",
    "category": "Thyroid",
    "categories": [
      "Thyroid"
    ],
    "aliases": [
      "Free T4",
      "Free T4 Free Thyroxine",
      "Free Thyroxine",
      "Free Thyroxine (Free T4)",
      "Free Thyroxine - Free T4"
    ],
    "description": "Measures the main circulating thyroid hormone available for conversion to T3; interpreted with TSH and Free T3.",
    "whatItMeasures": "Measures the main circulating thyroid hormone available for conversion to T3; interpreted with TSH and Free T3.",
    "whyItMatters": "This can be associated with hypothyroidism; hyperthyroidism; thyroid dysfunction. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "pmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "11.6-21.9",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<11.6; >21.9",
    "lowerOptimal": 11.6,
    "upperOptimal": 21.9,
    "lowerReference": 11.6,
    "upperReference": 21.9,
    "directionality": "range_based",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "free-triiodothyronine-free-t3",
    "name": "Free Triiodothyronine - Free T3",
    "displayName": "Free Triiodothyronine",
    "category": "Thyroid",
    "categories": [
      "Thyroid"
    ],
    "aliases": [
      "Free T3",
      "Free T3 Free Triiodothyronine",
      "Free Triiodothyronine",
      "Free Triiodothyronine (Free T3)",
      "Free Triiodothyronine - Free T3"
    ],
    "description": "Measures the active thyroid hormone available to tissues and helps interpret thyroid conversion and hyperthyroid patterns.",
    "whatItMeasures": "Measures the active thyroid hormone available to tissues and helps interpret thyroid conversion and hyperthyroid patterns.",
    "whyItMatters": "This can be associated with hyperthyroidism; thyroid conversion issues; thyroid dysfunction. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "pmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "3.1-6.8",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<3.1; >6.8",
    "lowerOptimal": 3.1,
    "upperOptimal": 6.8,
    "lowerReference": 3.1,
    "upperReference": 6.8,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 4.65,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 4.46,
        "testDate": "2025-06-20"
      },
      {
        "value": 4.6,
        "testDate": "2025-12-12"
      },
      {
        "value": 4.65,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "antinuclear-antibodies-ana-pattern",
    "name": "Antinuclear Antibodies - ANA Pattern",
    "displayName": "Antinuclear Antibodies",
    "category": "Autoimmunity",
    "categories": [
      "Autoimmunity"
    ],
    "aliases": [
      "ANA Pattern",
      "ANA Pattern Antinuclear Antibodies",
      "Antinuclear Antibodies",
      "Antinuclear Antibodies (ANA Pattern)",
      "Antinuclear Antibodies - ANA Pattern"
    ],
    "description": "Describes the staining pattern of ANA antibodies and can guide follow-up autoimmune testing.",
    "whatItMeasures": "Describes the staining pattern of ANA antibodies and can guide follow-up autoimmune testing.",
    "whyItMatters": "This can be associated with systemic lupus erythematosus; sjogren syndrome; scleroderma; mixed connective tissue disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "categorical",
    "ruleType": "NOT_IMPLEMENTABLE",
    "optimalRangeLabel": "NOT_APPLICABLE",
    "suboptimalRangeLabel": "NOT_APPLICABLE",
    "outOfRangeLabel": "NOT_APPLICABLE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "at_risk",
    "latestValue": "Not Applicable",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "antinuclear-antibodies-ana-screen",
    "name": "Antinuclear Antibodies - ANA Screen",
    "displayName": "Antinuclear Antibodies",
    "category": "Autoimmunity",
    "categories": [
      "Autoimmunity"
    ],
    "aliases": [
      "ANA Screen",
      "ANA Screen Antinuclear Antibodies",
      "Antinuclear Antibodies",
      "Antinuclear Antibodies (ANA Screen)",
      "Antinuclear Antibodies - ANA Screen"
    ],
    "description": "Screens for antinuclear antibodies that may appear in systemic autoimmune conditions, though positives can occur without disease.",
    "whatItMeasures": "Screens for antinuclear antibodies that may appear in systemic autoimmune conditions, though positives can occur without disease.",
    "whyItMatters": "This can be associated with lupus; sjogren syndrome; scleroderma; autoimmune hepatitis; thyroid autoimmunity. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "BORDERLINE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "antinuclear-antibodies-titer",
    "name": "Antinuclear Antibodies Titer",
    "displayName": "Antinuclear Antibodies Titer",
    "category": "Autoimmunity",
    "categories": [
      "Autoimmunity"
    ],
    "aliases": [
      "Antinuclear Antibodies Titer"
    ],
    "description": "Quantifies ANA antibody dilution level; higher titers are more suggestive but still require clinical context.",
    "whatItMeasures": "Quantifies ANA antibody dilution level; higher titers are more suggestive but still require clinical context.",
    "whyItMatters": "This can be associated with systemic autoimmune disease; lupus; sjogren syndrome; scleroderma. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "titer",
    "ruleType": "TITER",
    "optimalRangeLabel": "<1:80",
    "suboptimalRangeLabel": "1:80",
    "outOfRangeLabel": ">=1:160",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "80",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "rheumatoid-factor-rf",
    "name": "Rheumatoid Factor - RF",
    "displayName": "Rheumatoid Factor",
    "category": "Autoimmunity",
    "categories": [
      "Autoimmunity"
    ],
    "aliases": [
      "RF",
      "RF Rheumatoid Factor",
      "Rheumatoid Factor",
      "Rheumatoid Factor (RF)",
      "Rheumatoid Factor - RF"
    ],
    "description": "Detects an autoantibody commonly associated with rheumatoid arthritis but also seen in other inflammatory or infectious states.",
    "whatItMeasures": "Detects an autoantibody commonly associated with rheumatoid arthritis but also seen in other inflammatory or infectious states.",
    "whyItMatters": "This can be associated with rheumatoid arthritis; sjogren syndrome; chronic infection; autoimmune disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "IU/mL",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "BORDERLINE_POSITIVE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "basophils",
    "name": "Basophils",
    "displayName": "Basophils",
    "category": "Immune Regulation",
    "categories": [
      "Immune Regulation"
    ],
    "aliases": [
      "Basophils"
    ],
    "description": "Counts a white blood cell type involved in allergic and inflammatory responses.",
    "whatItMeasures": "Counts a white blood cell type involved in allergic and inflammatory responses.",
    "whyItMatters": "This can be associated with allergic disease; chronic inflammation; myeloproliferative disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^9/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "0.0-0.1",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": ">0.1",
    "lowerOptimal": 0.0,
    "upperOptimal": 0.1,
    "lowerReference": 0.0,
    "upperReference": 0.1,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 0.042,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.04,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.042,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.042,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "eosinophils",
    "name": "Eosinophils",
    "displayName": "Eosinophils",
    "category": "Immune Regulation",
    "categories": [
      "Immune Regulation"
    ],
    "aliases": [
      "Eosinophils"
    ],
    "description": "Counts white blood cells associated with allergy, asthma, parasites and certain inflammatory disorders.",
    "whatItMeasures": "Counts white blood cells associated with allergy, asthma, parasites and certain inflammatory disorders.",
    "whyItMatters": "This can be associated with allergies; asthma; parasitic infection; eosinophilic disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^9/L; %",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "0.0-0.4",
    "suboptimalRangeLabel": "0.4-0.5",
    "outOfRangeLabel": ">0.5",
    "lowerOptimal": 0.0,
    "upperOptimal": 0.4,
    "lowerReference": 0.0,
    "upperReference": 0.5,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 0.182,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.175,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.18,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.182,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "lymphocytes",
    "name": "Lymphocytes",
    "displayName": "Lymphocytes",
    "category": "Immune Regulation",
    "categories": [
      "Immune Regulation"
    ],
    "aliases": [
      "Lymphocytes"
    ],
    "description": "Counts immune cells central to viral defense and adaptive immunity.",
    "whatItMeasures": "Counts immune cells central to viral defense and adaptive immunity.",
    "whyItMatters": "This can be associated with viral infection; immune deficiency; lymphoproliferative disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^9/L; %",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "1.2-3.5",
    "suboptimalRangeLabel": "1.0-1.1; 3.6-4.0",
    "outOfRangeLabel": "<1.0; >4.0",
    "lowerOptimal": 1.2,
    "upperOptimal": 3.5,
    "lowerReference": 1.0,
    "upperReference": 4.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 2.33,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 2.24,
        "testDate": "2025-06-20"
      },
      {
        "value": 2.31,
        "testDate": "2025-12-12"
      },
      {
        "value": 2.33,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "monocytes",
    "name": "Monocytes",
    "displayName": "Monocytes",
    "category": "Immune Regulation",
    "categories": [
      "Immune Regulation"
    ],
    "aliases": [
      "Monocytes"
    ],
    "description": "Counts immune cells involved in cleanup, chronic inflammation and infection response.",
    "whatItMeasures": "Counts immune cells involved in cleanup, chronic inflammation and infection response.",
    "whyItMatters": "This can be associated with chronic inflammation; infection; autoimmune disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^9/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "0.2-0.8",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<0.2; >0.8",
    "lowerOptimal": 0.2,
    "upperOptimal": 0.8,
    "lowerReference": 0.2,
    "upperReference": 0.8,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 0.2,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.182,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.194,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.2,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "neutrophils",
    "name": "Neutrophils",
    "displayName": "Neutrophils",
    "category": "Immune Regulation",
    "categories": [
      "Immune Regulation"
    ],
    "aliases": [
      "Neutrophils"
    ],
    "description": "Counts frontline white blood cells that often rise with bacterial infection or acute inflammation.",
    "whatItMeasures": "Counts frontline white blood cells that often rise with bacterial infection or acute inflammation.",
    "whyItMatters": "This can be associated with bacterial infection; acute inflammation; bone marrow stress. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^9/L; %",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "2.5-6.0",
    "suboptimalRangeLabel": "1.5-2.4; 6.1-8.0",
    "outOfRangeLabel": "<1.5; >8.0",
    "lowerOptimal": 2.5,
    "upperOptimal": 6.0,
    "lowerReference": 1.5,
    "upperReference": 8.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 4.46,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 4.28,
        "testDate": "2025-06-20"
      },
      {
        "value": 4.42,
        "testDate": "2025-12-12"
      },
      {
        "value": 4.46,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "white-blood-cell-count",
    "name": "White Blood Cell Count",
    "displayName": "White Blood Cell Count",
    "category": "Immune Regulation",
    "categories": [
      "Immune Regulation"
    ],
    "aliases": [
      "White Blood Cell Count"
    ],
    "description": "Measures total white blood cells as a broad screen for infection, inflammation and marrow response.",
    "whatItMeasures": "Measures total white blood cells as a broad screen for infection, inflammation and marrow response.",
    "whyItMatters": "This can be associated with infection; inflammation; leukopenia/leukocytosis; bone marrow disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^9/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "4.5-8.0",
    "suboptimalRangeLabel": "3.4-4.4; 8.1-9.6",
    "outOfRangeLabel": "<3.4; >9.6",
    "lowerOptimal": 4.5,
    "upperOptimal": 8.0,
    "lowerReference": 3.4,
    "upperReference": 9.6,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 5.97,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 5.73,
        "testDate": "2025-06-20"
      },
      {
        "value": 5.91,
        "testDate": "2025-12-12"
      },
      {
        "value": 5.97,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "anti-mullerian-hormone-amh",
    "name": "Anti-Mullerian Hormone - AMH",
    "displayName": "Anti-Mullerian Hormone",
    "category": "Female Health",
    "categories": [
      "Female Health"
    ],
    "aliases": [
      "AMH",
      "AMH Anti-Mullerian Hormone",
      "Anti-Mullerian Hormone",
      "Anti-Mullerian Hormone (AMH)",
      "Anti-Mullerian Hormone - AMH"
    ],
    "description": "Reflects ovarian reserve and is commonly used in fertility and reproductive planning contexts.",
    "whatItMeasures": "Reflects ovarian reserve and is commonly used in fertility and reproductive planning contexts.",
    "whyItMatters": "This can be associated with low ovarian reserve; pcos; fertility assessment. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "pmol/L",
    "ruleType": "CONTEXTUAL",
    "optimalRangeLabel": "CONTEXT_REQUIRED",
    "suboptimalRangeLabel": "CONTEXT_REQUIRED",
    "outOfRangeLabel": "CONTEXT_REQUIRED",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Context Required",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "dhea-sulfate",
    "name": "DHEA-Sulfate",
    "displayName": "DHEA-Sulfate",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health",
      "Stress & Aging"
    ],
    "aliases": [
      "DHEA-Sulfate"
    ],
    "description": "Measures an adrenal androgen precursor that can reflect adrenal output and androgen balance.",
    "whatItMeasures": "Measures an adrenal androgen precursor that can reflect adrenal output and androgen balance.",
    "whyItMatters": "This can be associated with adrenal dysfunction; pcos; androgen excess; aging-related hormonal change. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "SEX_AGE_SPECIFIC",
    "optimalRangeLabel": "M18-30:2.85-19.76; M31-40:1.55-14.17; M41-50:0.92-10.72; M51-60:0.54-8.11; M61-70:0.33-6.16; M71+:0.18-4.40; F18-30:2.25-10.23; F31-40:1.22-8.01; F41-50:0.73-6.51; F51-60:0.43-5.29; F61-70:0.26-4.31; F71+:0.14-3.36",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "OUTSIDE_AGE_SEX_RANGE",
    "lowerOptimal": 2.85,
    "upperOptimal": 19.76,
    "lowerReference": 2.85,
    "upperReference": 19.76,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 11.1,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 10.7,
        "testDate": "2025-06-20"
      },
      {
        "value": 11.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 11.1,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "estradiol",
    "name": "Estradiol",
    "displayName": "Estradiol",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health"
    ],
    "aliases": [
      "Estradiol"
    ],
    "description": "Measures a primary estrogen important for reproductive, bone, brain and cardiometabolic health.",
    "whatItMeasures": "Measures a primary estrogen important for reproductive, bone, brain and cardiometabolic health.",
    "whyItMatters": "This can be associated with menopause transition; estrogen deficiency/excess; fertility issues; pcos. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "pmol/L",
    "ruleType": "CYCLE_SPECIFIC",
    "optimalRangeLabel": "Premenopause:55.1-1286.6; Postmenopause:<36.8",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "Premenopause:<55.1; Premenopause:>1286.6; Postmenopause:>=36.8",
    "lowerOptimal": 55.1,
    "upperOptimal": 1286.6,
    "lowerReference": 55.1,
    "upperReference": 36.8,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 702.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 674.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 695.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 702.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "follicle-stimulating-hormone-fsh",
    "name": "Follicle Stimulating Hormone - FSH",
    "displayName": "Follicle Stimulating Hormone",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health"
    ],
    "aliases": [
      "FSH",
      "FSH Follicle Stimulating Hormone",
      "Follicle Stimulating Hormone",
      "Follicle Stimulating Hormone (FSH)",
      "Follicle Stimulating Hormone - FSH"
    ],
    "description": "Measures pituitary signaling to the ovaries or testes; useful for fertility, ovarian reserve, menopause and gonadal function.",
    "whatItMeasures": "Measures pituitary signaling to the ovaries or testes; useful for fertility, ovarian reserve, menopause and gonadal function.",
    "whyItMatters": "This can be associated with menopause transition; ovarian insufficiency; hypogonadism; fertility issues. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mIU/mL",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "M:1.5-12.4",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "M:<1.5; M:>12.4",
    "lowerOptimal": 1.5,
    "upperOptimal": 12.4,
    "lowerReference": 1.5,
    "upperReference": 12.4,
    "directionality": "range_based",
    "status": "needs_attention",
    "latestValue": 1.4,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.1,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.3,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.4,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "luteinizing-hormone-lh",
    "name": "Luteinizing Hormone - LH",
    "displayName": "Luteinizing Hormone",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health"
    ],
    "aliases": [
      "LH",
      "LH Luteinizing Hormone",
      "Luteinizing Hormone",
      "Luteinizing Hormone (LH)",
      "Luteinizing Hormone - LH"
    ],
    "description": "Measures pituitary signaling involved in ovulation and testosterone production.",
    "whatItMeasures": "Measures pituitary signaling involved in ovulation and testosterone production.",
    "whyItMatters": "This can be associated with pcos; ovulatory dysfunction; hypogonadism; menopause transition. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mIU/mL",
    "ruleType": "CYCLE_SPECIFIC",
    "optimalRangeLabel": "Follicular:1.37-9.0; Ovulation:6.17-17.2; Luteal:1.09-9.2; Postmenopause:19.3-100.6",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "OUTSIDE_CYCLE_RANGE",
    "lowerOptimal": 1.37,
    "upperOptimal": 9.0,
    "lowerReference": 1.37,
    "upperReference": 9.0,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 9.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 8.19,
        "testDate": "2025-06-20"
      },
      {
        "value": 8.73,
        "testDate": "2025-12-12"
      },
      {
        "value": 9.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "prolactin",
    "name": "Prolactin",
    "displayName": "Prolactin",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health"
    ],
    "aliases": [
      "Prolactin"
    ],
    "description": "Measures a pituitary hormone involved in lactation and reproductive signaling; elevations can disrupt cycles or testosterone.",
    "whatItMeasures": "Measures a pituitary hormone involved in lactation and reproductive signaling; elevations can disrupt cycles or testosterone.",
    "whyItMatters": "This can be associated with hyperprolactinemia; pituitary adenoma; infertility; hypogonadism. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5g/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "F:4.8-23.3; M:4.0-15.2",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "F:<4.8; F:>23.3; M:<4.0; M:>15.2",
    "lowerOptimal": 4.0,
    "upperOptimal": 15.2,
    "lowerReference": 4.0,
    "upperReference": 15.2,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 9.1,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 8.7,
        "testDate": "2025-06-20"
      },
      {
        "value": 9.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 9.1,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "sex-hormone-binding-globulin-shbg",
    "name": "Sex Hormone Binding Globulin - SHBG",
    "displayName": "Sex Hormone Binding Globulin",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health"
    ],
    "aliases": [
      "SHBG",
      "SHBG Sex Hormone Binding Globulin",
      "Sex Hormone Binding Globulin",
      "Sex Hormone Binding Globulin (SHBG)",
      "Sex Hormone Binding Globulin - SHBG"
    ],
    "description": "Measures the protein that binds sex hormones and affects how much testosterone or estradiol is bioavailable.",
    "whatItMeasures": "Measures the protein that binds sex hormones and affects how much testosterone or estradiol is bioavailable.",
    "whyItMatters": "This can be associated with hormone imbalance; insulin resistance; pcos; liver/thyroid influences. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "SEX_AGE_SPECIFIC",
    "optimalRangeLabel": "F18-46:18.2-135.5; F47-91:16.8-125.2",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "F18-46:<18.2; F18-46:>135.5; F47-91:<16.8; F47-91:>125.2",
    "lowerOptimal": 18.2,
    "upperOptimal": 135.5,
    "lowerReference": 18.2,
    "upperReference": 135.5,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 76.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 73.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 75.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 76.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "free-testosterone",
    "name": "Free Testosterone",
    "displayName": "Free Testosterone",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health"
    ],
    "aliases": [
      "Free Testosterone"
    ],
    "description": "Measures the unbound fraction of testosterone available to tissues.",
    "whatItMeasures": "Measures the unbound fraction of testosterone available to tissues.",
    "whyItMatters": "This can be associated with low testosterone; androgen excess; pcos; hypogonadism. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "pmol/L",
    "ruleType": "SEX_AGE_SPECIFIC",
    "optimalRangeLabel": "F20-25:<4.5-37.5; F25-30:<4.5-36.8; F30-35:<4.5-35.7; F35-40:<4.5-34.7; F40-45:<4.5-34.0; F45-50:<4.5-32.9",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "OUTSIDE_AGE_RANGE",
    "lowerOptimal": null,
    "upperOptimal": 4.5,
    "lowerReference": null,
    "upperReference": 6.3,
    "directionality": "lower_is_better",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "total-testosterone",
    "name": "Total Testosterone",
    "displayName": "Total Testosterone",
    "category": "Female Health",
    "categories": [
      "Female Health",
      "Male Health"
    ],
    "aliases": [
      "Total Testosterone"
    ],
    "description": "Measures total circulating testosterone, including bound and free fractions.",
    "whatItMeasures": "Measures total circulating testosterone, including bound and free fractions.",
    "whyItMatters": "This can be associated with low testosterone; androgen excess; hypogonadism; pcos. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "F:0.52-1.60",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "F:<0.52; F:>1.60",
    "lowerOptimal": 0.52,
    "upperOptimal": 1.6,
    "lowerReference": 0.52,
    "upperReference": 1.6,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 1.12,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.08,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.11,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.12,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "prostate-specific-antigen-psa-percent-free",
    "name": "Prostate Specific Antigen - PSA % Free",
    "displayName": "Prostate Specific Antigen",
    "category": "Male Health",
    "categories": [
      "Male Health"
    ],
    "aliases": [
      "PSA % Free",
      "PSA % Free Prostate Specific Antigen",
      "Prostate Specific Antigen",
      "Prostate Specific Antigen (PSA % Free)",
      "Prostate Specific Antigen - PSA % Free"
    ],
    "description": "Calculates free PSA as a percentage of total PSA to help distinguish benign enlargement from higher-risk prostate patterns.",
    "whatItMeasures": "Calculates free PSA as a percentage of total PSA to help distinguish benign enlargement from higher-risk prostate patterns.",
    "whyItMatters": "This can be associated with benign prostatic hyperplasia; prostate cancer risk; prostatitis. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "%",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": ">25",
    "suboptimalRangeLabel": "10-25",
    "outOfRangeLabel": "<10; 4-10",
    "lowerOptimal": 25.0,
    "upperOptimal": null,
    "lowerReference": 4.0,
    "upperReference": null,
    "directionality": "higher_is_better",
    "status": "optimal",
    "latestValue": 28.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 26.9,
        "testDate": "2025-06-20"
      },
      {
        "value": 27.7,
        "testDate": "2025-12-12"
      },
      {
        "value": 28.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "prostate-specific-antigen-psa-free",
    "name": "Prostate Specific Antigen - PSA Free",
    "displayName": "Prostate Specific Antigen",
    "category": "Male Health",
    "categories": [
      "Male Health"
    ],
    "aliases": [
      "PSA Free",
      "PSA Free Prostate Specific Antigen",
      "Prostate Specific Antigen",
      "Prostate Specific Antigen (PSA Free)",
      "Prostate Specific Antigen - PSA Free"
    ],
    "description": "Measures unbound prostate-specific antigen; interpreted with total PSA to refine prostate risk assessment.",
    "whatItMeasures": "Measures unbound prostate-specific antigen; interpreted with total PSA to refine prostate risk assessment.",
    "whyItMatters": "This can be associated with benign prostatic hyperplasia; prostatitis; prostate cancer risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5g/L",
    "ruleType": "CONTEXTUAL",
    "optimalRangeLabel": "CONTEXT_REQUIRED",
    "suboptimalRangeLabel": "CONTEXT_REQUIRED",
    "outOfRangeLabel": "CONTEXT_REQUIRED",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Context Required",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "prostate-specific-antigen-psa-total",
    "name": "Prostate Specific Antigen - PSA Total",
    "displayName": "Prostate Specific Antigen",
    "category": "Male Health",
    "categories": [
      "Male Health"
    ],
    "aliases": [
      "PSA Total",
      "PSA Total Prostate Specific Antigen",
      "Prostate Specific Antigen",
      "Prostate Specific Antigen (PSA Total)",
      "Prostate Specific Antigen - PSA Total"
    ],
    "description": "Measures total prostate-specific antigen, a prostate marker that can rise with benign enlargement, inflammation, or cancer.",
    "whatItMeasures": "Measures total prostate-specific antigen, a prostate marker that can rise with benign enlargement, inflammation, or cancer.",
    "whyItMatters": "This can be associated with benign prostatic hyperplasia; prostatitis; prostate cancer risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5g/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "<4.0",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": ">=4.0",
    "lowerOptimal": null,
    "upperOptimal": 4.0,
    "lowerReference": null,
    "upperReference": 4.0,
    "directionality": "lower_is_better",
    "status": "at_risk",
    "latestValue": 4.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 3.64,
        "testDate": "2025-06-20"
      },
      {
        "value": 3.88,
        "testDate": "2025-12-12"
      },
      {
        "value": 4.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "glucose",
    "name": "Glucose",
    "displayName": "Glucose",
    "category": "Metabolic",
    "categories": [
      "Metabolic"
    ],
    "aliases": [
      "Glucose"
    ],
    "description": "Measures current blood sugar level and helps identify impaired fasting glucose, diabetes risk, or acute glucose dysregulation.",
    "whatItMeasures": "Measures current blood sugar level and helps identify impaired fasting glucose, diabetes risk, or acute glucose dysregulation.",
    "whyItMatters": "This can be associated with prediabetes; diabetes; hypoglycemia; insulin resistance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "3.9-4.9; 5-5.5",
    "suboptimalRangeLabel": "5.5-6.9",
    "outOfRangeLabel": ">=7; <3.9",
    "lowerOptimal": 3.9,
    "upperOptimal": 4.9,
    "lowerReference": 3.9,
    "upperReference": 7.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 4.42,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 4.24,
        "testDate": "2025-06-20"
      },
      {
        "value": 4.38,
        "testDate": "2025-12-12"
      },
      {
        "value": 4.42,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "hemoglobin-a1c-hba1c",
    "name": "Hemoglobin A1c - HbA1c",
    "displayName": "Hemoglobin A1c",
    "category": "Metabolic",
    "categories": [
      "Metabolic"
    ],
    "aliases": [
      "HbA1c",
      "HbA1c Hemoglobin A1c",
      "Hemoglobin A1c",
      "Hemoglobin A1c (HbA1c)",
      "Hemoglobin A1c - HbA1c"
    ],
    "description": "Estimates average blood sugar over roughly the prior two to three months by measuring glycated hemoglobin.",
    "whatItMeasures": "Estimates average blood sugar over roughly the prior two to three months by measuring glycated hemoglobin.",
    "whyItMatters": "This can be associated with prediabetes; diabetes; poor glycemic control; insulin resistance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "%",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<5.4; <5.7",
    "suboptimalRangeLabel": "5.4-5.6; 5.7-6.4",
    "outOfRangeLabel": ">=6.5",
    "lowerOptimal": null,
    "upperOptimal": 5.4,
    "lowerReference": null,
    "upperReference": 6.5,
    "directionality": "lower_is_better",
    "status": "at_risk",
    "latestValue": 5.9,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 5.37,
        "testDate": "2025-06-20"
      },
      {
        "value": 5.72,
        "testDate": "2025-12-12"
      },
      {
        "value": 5.9,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "insulin",
    "name": "Insulin",
    "displayName": "Insulin",
    "category": "Metabolic",
    "categories": [
      "Metabolic"
    ],
    "aliases": [
      "Insulin"
    ],
    "description": "",
    "whatItMeasures": "",
    "whyItMatters": "",
    "unit": "",
    "ruleType": "",
    "optimalRangeLabel": "",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "leptin",
    "name": "Leptin",
    "displayName": "Leptin",
    "category": "Metabolic",
    "categories": [
      "Metabolic"
    ],
    "aliases": [
      "Leptin"
    ],
    "description": "Measures a hormone involved in appetite and energy regulation; high levels can suggest leptin resistance or excess adiposity.",
    "whatItMeasures": "Measures a hormone involved in appetite and energy regulation; high levels can suggest leptin resistance or excess adiposity.",
    "whyItMatters": "This can be associated with obesity; leptin resistance; metabolic syndrome; insulin resistance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5g/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "M:0.7-5.3; F:3.3-18.3",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "M:<0.7; M:>5.3; F:<3.3; F:>18.3",
    "lowerOptimal": 0.7,
    "upperOptimal": 5.3,
    "lowerReference": 0.7,
    "upperReference": 5.3,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 2.79,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 2.68,
        "testDate": "2025-06-20"
      },
      {
        "value": 2.76,
        "testDate": "2025-12-12"
      },
      {
        "value": 2.79,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "uric-acid",
    "name": "Uric Acid",
    "displayName": "Uric Acid",
    "category": "Metabolic",
    "categories": [
      "Metabolic"
    ],
    "aliases": [
      "Uric Acid"
    ],
    "description": "Measures a purine breakdown product; elevated levels can contribute to gout and may track cardiometabolic or kidney risk.",
    "whatItMeasures": "Measures a purine breakdown product; elevated levels can contribute to gout and may track cardiometabolic or kidney risk.",
    "whyItMatters": "This can be associated with gout; kidney stones; kidney dysfunction; metabolic syndrome. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "208-327",
    "suboptimalRangeLabel": "M:333-410; F:303-351",
    "outOfRangeLabel": ">=416; >=357",
    "lowerOptimal": 208.0,
    "upperOptimal": 327.0,
    "lowerReference": 208.0,
    "upperReference": 357.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 266.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 255.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 263.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 266.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "arachidonic-acid-epa-ratio",
    "name": "Arachidonic Acid / EPA Ratio",
    "displayName": "Arachidonic Acid / EPA Ratio",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Arachidonic Acid / EPA Ratio"
    ],
    "description": "Compares pro-inflammatory omega-6 arachidonic acid with anti-inflammatory omega-3 EPA, indicating fatty acid balance.",
    "whatItMeasures": "Compares pro-inflammatory omega-6 arachidonic acid with anti-inflammatory omega-3 EPA, indicating fatty acid balance.",
    "whyItMatters": "This can be associated with inflammatory balance; cardiovascular risk; low omega-3 status. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "N/A; contextual",
    "ruleType": "CONTEXTUAL",
    "optimalRangeLabel": "CONTEXT_REQUIRED",
    "suboptimalRangeLabel": "CONTEXT_REQUIRED",
    "outOfRangeLabel": "CONTEXT_REQUIRED",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Context Required",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "calcium",
    "name": "Calcium",
    "displayName": "Calcium",
    "category": "Nutrients",
    "categories": [
      "Nutrients",
      "Kidneys",
      "Electrolytes"
    ],
    "aliases": [
      "Calcium"
    ],
    "description": "Measures blood calcium, important for bone, parathyroid, kidney, nerve and muscle function.",
    "whatItMeasures": "Measures blood calcium, important for bone, parathyroid, kidney, nerve and muscle function.",
    "whyItMatters": "This can be associated with hypercalcemia; hypocalcemia; parathyroid disorders; kidney disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "2.05-2.55",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<2.05; >2.55",
    "lowerOptimal": 2.05,
    "upperOptimal": 2.55,
    "lowerReference": 2.05,
    "upperReference": 2.55,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 2.55,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 2.32,
        "testDate": "2025-06-20"
      },
      {
        "value": 2.47,
        "testDate": "2025-12-12"
      },
      {
        "value": 2.55,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "ferritin",
    "name": "Ferritin",
    "displayName": "Ferritin",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Ferritin"
    ],
    "description": "Reflects stored iron and can also rise with inflammation or liver stress.",
    "whatItMeasures": "Reflects stored iron and can also rise with inflammation or liver stress.",
    "whyItMatters": "This can be associated with iron deficiency; iron overload; inflammation; liver disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5g/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "F:50-100; M:75-150",
    "suboptimalRangeLabel": "F:20-49; M:30-74",
    "outOfRangeLabel": ">300; >400; >1000",
    "lowerOptimal": 75.0,
    "upperOptimal": 150.0,
    "lowerReference": 75.0,
    "upperReference": 300.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 106.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 102.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 105.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 106.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "homocysteine",
    "name": "Homocysteine",
    "displayName": "Homocysteine",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Homocysteine"
    ],
    "description": "Measures an amino acid linked to methylation, B-vitamin status and vascular risk when elevated.",
    "whatItMeasures": "Measures an amino acid linked to methylation, B-vitamin status and vascular risk when elevated.",
    "whyItMatters": "This can be associated with b12/folate deficiency; cardiovascular risk; methylation issues. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<8; 5-8",
    "suboptimalRangeLabel": "10-15",
    "outOfRangeLabel": ">=15",
    "lowerOptimal": null,
    "upperOptimal": 8.0,
    "lowerReference": null,
    "upperReference": 15.0,
    "directionality": "lower_is_better",
    "status": "needs_attention",
    "latestValue": 16.2,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 13.3,
        "testDate": "2025-06-20"
      },
      {
        "value": 15.1,
        "testDate": "2025-12-12"
      },
      {
        "value": 16.2,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "iron",
    "name": "Iron",
    "displayName": "Iron",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Iron"
    ],
    "description": "Measures circulating iron available for red blood cell production and other functions.",
    "whatItMeasures": "Measures circulating iron available for red blood cell production and other functions.",
    "whyItMatters": "This can be associated with iron deficiency; iron overload; anemia. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "M:8.9-26.8; F:6.3-26.0",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "M:<8.9; M:>26.8; F:<6.3; F:>26.0",
    "lowerOptimal": 8.9,
    "upperOptimal": 26.8,
    "lowerReference": 8.9,
    "upperReference": 26.8,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 17.7,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 17.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 17.5,
        "testDate": "2025-12-12"
      },
      {
        "value": 17.7,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "iron-percent-saturation",
    "name": "Iron % Saturation",
    "displayName": "Iron % Saturation",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Iron % Saturation"
    ],
    "description": "Shows the percentage of transferrin iron-binding sites that are occupied by iron.",
    "whatItMeasures": "Shows the percentage of transferrin iron-binding sites that are occupied by iron.",
    "whyItMatters": "This can be associated with iron deficiency; hemochromatosis; anemia. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "%",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "25-35; 20-45",
    "suboptimalRangeLabel": "15-19; 45-50",
    "outOfRangeLabel": ">45; <15",
    "lowerOptimal": 25.0,
    "upperOptimal": 35.0,
    "lowerReference": 15.0,
    "upperReference": 45.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 30.2,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 29.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 29.9,
        "testDate": "2025-12-12"
      },
      {
        "value": 30.2,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "iron-binding-capacity",
    "name": "Iron Binding Capacity",
    "displayName": "Iron Binding Capacity",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Iron Binding Capacity"
    ],
    "description": "Measures the blood's capacity to bind iron and helps distinguish iron deficiency from inflammation-related patterns.",
    "whatItMeasures": "Measures the blood's capacity to bind iron and helps distinguish iron deficiency from inflammation-related patterns.",
    "whyItMatters": "This can be associated with iron deficiency; anemia of inflammation; iron overload. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "44.8-62.6",
    "suboptimalRangeLabel": "62.6-80.5",
    "outOfRangeLabel": "<44.8; >80.5",
    "lowerOptimal": 44.8,
    "upperOptimal": 62.6,
    "lowerReference": 44.8,
    "upperReference": 80.5,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 54.8,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 52.6,
        "testDate": "2025-06-20"
      },
      {
        "value": 54.3,
        "testDate": "2025-12-12"
      },
      {
        "value": 54.8,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "magnesium",
    "name": "Magnesium",
    "displayName": "Magnesium",
    "category": "Nutrients",
    "categories": [
      "Nutrients",
      "Electrolytes"
    ],
    "aliases": [
      "Magnesium"
    ],
    "description": "Measures magnesium status relevant to muscle, nerve, glucose, blood pressure and energy metabolism.",
    "whatItMeasures": "Measures magnesium status relevant to muscle, nerve, glucose, blood pressure and energy metabolism.",
    "whyItMatters": "This can be associated with magnesium deficiency; arrhythmia risk; muscle cramps; metabolic dysfunction. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "0.70-0.91",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<0.70; >0.91",
    "lowerOptimal": 0.7,
    "upperOptimal": 0.91,
    "lowerReference": 0.7,
    "upperReference": 0.91,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 0.788,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.756,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.78,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.788,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "methylmalonic-acid",
    "name": "Methylmalonic Acid",
    "displayName": "Methylmalonic Acid",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Methylmalonic Acid"
    ],
    "description": "A functional marker of vitamin B12 status; elevations can appear before serum B12 is clearly low.",
    "whatItMeasures": "A functional marker of vitamin B12 status; elevations can appear before serum B12 is clearly low.",
    "whyItMatters": "This can be associated with vitamin b12 deficiency; neuropathy risk; anemia. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "<=0.40",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": ">0.40",
    "lowerOptimal": null,
    "upperOptimal": 0.4,
    "lowerReference": null,
    "upperReference": 0.4,
    "directionality": "lower_is_better",
    "status": "at_risk",
    "latestValue": 0.4,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.364,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.388,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.4,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "omega-3-total",
    "name": "Omega-3 Total",
    "displayName": "Omega-3 Total",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-3 Total"
    ],
    "description": "Measures total omega-3 fatty acid status, often used to assess dietary intake and cardiovascular-inflammatory balance.",
    "whatItMeasures": "Measures total omega-3 fatty acid status, often used to assess dietary intake and cardiovascular-inflammatory balance.",
    "whyItMatters": "This can be associated with low omega-3 status; cardiovascular risk; inflammatory imbalance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "% of total fatty acids",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": ">=8",
    "suboptimalRangeLabel": "4-8",
    "outOfRangeLabel": "<4",
    "lowerOptimal": 8.0,
    "upperOptimal": null,
    "lowerReference": 4.0,
    "upperReference": null,
    "directionality": "higher_is_better",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "omega-3-dha",
    "name": "Omega-3 DHA",
    "displayName": "Omega-3 DHA",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-3 DHA"
    ],
    "description": "Measures docosahexaenoic acid, an omega-3 important for brain, retina and cell membrane health.",
    "whatItMeasures": "Measures docosahexaenoic acid, an omega-3 important for brain, retina and cell membrane health.",
    "whyItMatters": "This can be associated with low omega-3 status; neurocognitive health risk; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "% fatty acids",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "1.4-5.1",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<1.4; >5.1",
    "lowerOptimal": 1.4,
    "upperOptimal": 5.1,
    "lowerReference": 1.4,
    "upperReference": 5.1,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 3.34,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 3.21,
        "testDate": "2025-06-20"
      },
      {
        "value": 3.31,
        "testDate": "2025-12-12"
      },
      {
        "value": 3.34,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "omega-3-dpa",
    "name": "Omega-3 DPA",
    "displayName": "Omega-3 DPA",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-3 DPA"
    ],
    "description": "Measures docosapentaenoic acid, an intermediate omega-3 fatty acid related to EPA and DHA metabolism.",
    "whatItMeasures": "Measures docosapentaenoic acid, an intermediate omega-3 fatty acid related to EPA and DHA metabolism.",
    "whyItMatters": "This can be associated with low omega-3 status; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "% fatty acids",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "0.8-1.8",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<0.8; >1.8",
    "lowerOptimal": 0.8,
    "upperOptimal": 1.8,
    "lowerReference": 0.8,
    "upperReference": 1.8,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 1.36,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.31,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.35,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.36,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "omega-3-epa",
    "name": "Omega-3 EPA",
    "displayName": "Omega-3 EPA",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-3 EPA"
    ],
    "description": "Measures eicosapentaenoic acid, an omega-3 linked to triglyceride and inflammatory balance.",
    "whatItMeasures": "Measures eicosapentaenoic acid, an omega-3 linked to triglyceride and inflammatory balance.",
    "whyItMatters": "This can be associated with low omega-3 status; hypertriglyceridemia; inflammatory imbalance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "% fatty acids",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "0.2-2.3",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<0.2; >2.3",
    "lowerOptimal": 0.2,
    "upperOptimal": 2.3,
    "lowerReference": 0.2,
    "upperReference": 2.3,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 1.08,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.04,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.07,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.08,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "omega-6-omega-3-ratio",
    "name": "Omega-6 / Omega-3 Ratio",
    "displayName": "Omega-6 / Omega-3 Ratio",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-6 / Omega-3 Ratio"
    ],
    "description": "Compares omega-6 to omega-3 fatty acids; a high ratio can suggest an imbalance toward pro-inflammatory fatty acids.",
    "whatItMeasures": "Compares omega-6 to omega-3 fatty acids; a high ratio can suggest an imbalance toward pro-inflammatory fatty acids.",
    "whyItMatters": "This can be associated with inflammatory imbalance; cardiovascular risk; low omega-3 status. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "N/A; contextual",
    "ruleType": "CONTEXTUAL",
    "optimalRangeLabel": "CONTEXT_REQUIRED",
    "suboptimalRangeLabel": "CONTEXT_REQUIRED",
    "outOfRangeLabel": "CONTEXT_REQUIRED",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Context Required",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "omega-6-total",
    "name": "Omega-6 Total",
    "displayName": "Omega-6 Total",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-6 Total"
    ],
    "description": "Measures total omega-6 fatty acid status, interpreted alongside omega-3 levels and ratios.",
    "whatItMeasures": "Measures total omega-6 fatty acid status, interpreted alongside omega-3 levels and ratios.",
    "whyItMatters": "This can be associated with fatty acid imbalance; inflammatory balance. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "% fatty acids",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "REFERENCE_ONLY",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "REFERENCE_ONLY",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Reference Only",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "omega-6-arachidonic-acid",
    "name": "Omega-6 Arachidonic Acid",
    "displayName": "Omega-6 Arachidonic Acid",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-6 Arachidonic Acid"
    ],
    "description": "Measures arachidonic acid, an omega-6 fatty acid involved in inflammatory signaling.",
    "whatItMeasures": "Measures arachidonic acid, an omega-6 fatty acid involved in inflammatory signaling.",
    "whyItMatters": "This can be associated with inflammatory balance; cardiovascular risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "% fatty acids",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "8.6-15.6",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<8.6; >15.6",
    "lowerOptimal": 8.6,
    "upperOptimal": 15.6,
    "lowerReference": 8.6,
    "upperReference": 15.6,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 15.6,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 14.2,
        "testDate": "2025-06-20"
      },
      {
        "value": 15.1,
        "testDate": "2025-12-12"
      },
      {
        "value": 15.6,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "omega-6-linoleic-acid",
    "name": "Omega-6 Linoleic Acid",
    "displayName": "Omega-6 Linoleic Acid",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Omega-6 Linoleic Acid"
    ],
    "description": "Measures linoleic acid, an essential omega-6 fatty acid from diet.",
    "whatItMeasures": "Measures linoleic acid, an essential omega-6 fatty acid from diet.",
    "whyItMatters": "This can be associated with fatty acid imbalance; essential fatty acid status. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "% fatty acids",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "18.6-29.5",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<18.6; >29.5",
    "lowerOptimal": 18.6,
    "upperOptimal": 29.5,
    "lowerReference": 18.6,
    "upperReference": 29.5,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 24.7,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 23.7,
        "testDate": "2025-06-20"
      },
      {
        "value": 24.5,
        "testDate": "2025-12-12"
      },
      {
        "value": 24.7,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "vitamin-d",
    "name": "Vitamin D",
    "displayName": "Vitamin D",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Vitamin D"
    ],
    "description": "Measures vitamin D status, important for bone, immune, muscle and metabolic health.",
    "whatItMeasures": "Measures vitamin D status, important for bone, immune, muscle and metabolic health.",
    "whyItMatters": "This can be associated with vitamin d deficiency; bone loss; immune dysfunction. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L 25(OH)D",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "75-125; 100-150; >=50",
    "suboptimalRangeLabel": "50-72; >125",
    "outOfRangeLabel": "<50; >250",
    "lowerOptimal": 75.0,
    "upperOptimal": 125.0,
    "lowerReference": 50.0,
    "upperReference": 250.0,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 181.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 165.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 176.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 181.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "zinc",
    "name": "Zinc",
    "displayName": "Zinc",
    "category": "Nutrients",
    "categories": [
      "Nutrients"
    ],
    "aliases": [
      "Zinc"
    ],
    "description": "Measures zinc status, which supports immunity, wound healing, hormones and enzyme function.",
    "whatItMeasures": "Measures zinc status, which supports immunity, wound healing, hormones and enzyme function.",
    "whyItMatters": "This can be associated with zinc deficiency; immune dysfunction; poor wound healing. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "9.2-16.2",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<9.2; >16.2",
    "lowerOptimal": 9.2,
    "upperOptimal": 16.2,
    "lowerReference": 9.2,
    "upperReference": 16.2,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 12.4,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 11.9,
        "testDate": "2025-06-20"
      },
      {
        "value": 12.3,
        "testDate": "2025-12-12"
      },
      {
        "value": 12.4,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "cortisol",
    "name": "Cortisol",
    "displayName": "Cortisol",
    "category": "Stress & Aging",
    "categories": [
      "Stress & Aging"
    ],
    "aliases": [
      "Cortisol"
    ],
    "description": "Measures a snapshot of cortisol, the main stress hormone produced by the adrenal glands.",
    "whatItMeasures": "Measures a snapshot of cortisol, the main stress hormone produced by the adrenal glands.",
    "whyItMatters": "This can be associated with adrenal dysfunction; cushing syndrome; addison disease; stress physiology. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L",
    "ruleType": "TIME_SPECIFIC",
    "optimalRangeLabel": "AM:193-690; PM:55-386",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "AM:<193; AM:>690; PM:<55; PM:>386",
    "lowerOptimal": 193.0,
    "upperOptimal": 690.0,
    "lowerReference": 193.0,
    "upperReference": 690.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 437.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 420.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 433.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 437.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "alanine-transaminase-alt",
    "name": "Alanine Transaminase - ALT",
    "displayName": "Alanine Transaminase",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "ALT",
      "ALT Alanine Transaminase",
      "Alanine Transaminase",
      "Alanine Transaminase (ALT)",
      "Alanine Transaminase - ALT"
    ],
    "description": "A liver enzyme that rises when liver cells are irritated or damaged.",
    "whatItMeasures": "A liver enzyme that rises when liver cells are irritated or damaged.",
    "whyItMatters": "This can be associated with fatty liver disease; hepatitis; liver injury. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "U/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "4-36",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<4; >36",
    "lowerOptimal": 4.0,
    "upperOptimal": 36.0,
    "lowerReference": 4.0,
    "upperReference": 36.0,
    "directionality": "range_based",
    "status": "needs_attention",
    "latestValue": 3.7,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 3.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 3.4,
        "testDate": "2025-12-12"
      },
      {
        "value": 3.7,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "albumin",
    "name": "Albumin",
    "displayName": "Albumin",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "Albumin"
    ],
    "description": "Measures the main blood protein made by the liver; low levels can reflect liver, kidney, inflammation or nutrition issues.",
    "whatItMeasures": "Measures the main blood protein made by the liver; low levels can reflect liver, kidney, inflammation or nutrition issues.",
    "whyItMatters": "This can be associated with liver disease; kidney protein loss; malnutrition; inflammation. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "g/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "34-54",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<34; >54",
    "lowerOptimal": 34.0,
    "upperOptimal": 54.0,
    "lowerReference": 34.0,
    "upperReference": 54.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 45.2,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 43.4,
        "testDate": "2025-06-20"
      },
      {
        "value": 44.7,
        "testDate": "2025-12-12"
      },
      {
        "value": 45.2,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "albumin-globulin-ratio",
    "name": "Albumin / Globulin Ratio",
    "displayName": "Albumin / Globulin Ratio",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "Albumin / Globulin Ratio"
    ],
    "description": "Compares albumin and globulin levels to flag shifts in liver production, immune proteins or protein loss.",
    "whatItMeasures": "Compares albumin and globulin levels to flag shifts in liver production, immune proteins or protein loss.",
    "whyItMatters": "This can be associated with liver disease; chronic inflammation; immune disorders; kidney disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "N/A; contextual",
    "ruleType": "CONTEXTUAL",
    "optimalRangeLabel": "CONTEXT_REQUIRED",
    "suboptimalRangeLabel": "CONTEXT_REQUIRED",
    "outOfRangeLabel": "CONTEXT_REQUIRED",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "at_risk",
    "latestValue": "Context Required",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "alkaline-phosphatase-alp",
    "name": "Alkaline Phosphatase - ALP",
    "displayName": "Alkaline Phosphatase",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "ALP",
      "ALP Alkaline Phosphatase",
      "Alkaline Phosphatase",
      "Alkaline Phosphatase (ALP)",
      "Alkaline Phosphatase - ALP"
    ],
    "description": "An enzyme from bile ducts and bone; elevations can reflect cholestasis or increased bone turnover.",
    "whatItMeasures": "An enzyme from bile ducts and bone; elevations can reflect cholestasis or increased bone turnover.",
    "whyItMatters": "This can be associated with bile duct disease; liver disease; bone disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "U/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "20-130",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<20; >130",
    "lowerOptimal": 20.0,
    "upperOptimal": 130.0,
    "lowerReference": 20.0,
    "upperReference": 130.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 70.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 67.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 69.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 70.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "aspartate-aminotransferase-ast",
    "name": "Aspartate Aminotransferase - AST",
    "displayName": "Aspartate Aminotransferase",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "AST",
      "AST Aspartate Aminotransferase",
      "Aspartate Aminotransferase",
      "Aspartate Aminotransferase (AST)",
      "Aspartate Aminotransferase - AST"
    ],
    "description": "An enzyme found in liver and muscle; elevations can reflect liver injury, muscle injury, or alcohol-related stress.",
    "whatItMeasures": "An enzyme found in liver and muscle; elevations can reflect liver injury, muscle injury, or alcohol-related stress.",
    "whyItMatters": "This can be associated with liver injury; muscle injury; alcohol-related liver disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "U/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "8-33",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<8; >33",
    "lowerOptimal": 8.0,
    "upperOptimal": 33.0,
    "lowerReference": 8.0,
    "upperReference": 33.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 20.2,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 19.4,
        "testDate": "2025-06-20"
      },
      {
        "value": 20.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 20.2,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "gamma-glutamyl-transferase-ggt",
    "name": "Gamma-Glutamyl Transferase - GGT",
    "displayName": "Gamma-Glutamyl Transferase",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "GGT",
      "GGT Gamma-Glutamyl Transferase",
      "Gamma-Glutamyl Transferase",
      "Gamma-Glutamyl Transferase (GGT)",
      "Gamma-Glutamyl Transferase - GGT"
    ],
    "description": "A liver and bile duct enzyme often sensitive to alcohol exposure, fatty liver and cholestasis.",
    "whatItMeasures": "A liver and bile duct enzyme often sensitive to alcohol exposure, fatty liver and cholestasis.",
    "whyItMatters": "This can be associated with fatty liver disease; alcohol-related liver stress; bile duct disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "U/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "2-30",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<2; >30",
    "lowerOptimal": 2.0,
    "upperOptimal": 30.0,
    "lowerReference": 2.0,
    "upperReference": 30.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 16.7,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 16.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 16.5,
        "testDate": "2025-12-12"
      },
      {
        "value": 16.7,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "globulin",
    "name": "Globulin",
    "displayName": "Globulin",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "Globulin"
    ],
    "description": "Measures a group of proteins that include antibodies; abnormal levels can reflect immune, liver, or inflammatory changes.",
    "whatItMeasures": "Measures a group of proteins that include antibodies; abnormal levels can reflect immune, liver, or inflammatory changes.",
    "whyItMatters": "This can be associated with chronic inflammation; liver disease; immune disorders; monoclonal gammopathy. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "g/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "20-35",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<20; >35",
    "lowerOptimal": 20.0,
    "upperOptimal": 35.0,
    "lowerReference": 20.0,
    "upperReference": 35.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 28.4,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 27.3,
        "testDate": "2025-06-20"
      },
      {
        "value": 28.1,
        "testDate": "2025-12-12"
      },
      {
        "value": 28.4,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "total-bilirubin",
    "name": "Total Bilirubin",
    "displayName": "Total Bilirubin",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "Total Bilirubin"
    ],
    "description": "Measures bilirubin from red blood cell breakdown and liver/bile processing.",
    "whatItMeasures": "Measures bilirubin from red blood cell breakdown and liver/bile processing.",
    "whyItMatters": "This can be associated with gilbert syndrome; liver disease; bile obstruction; hemolysis. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "5.1-20.5",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<5.1; >20.5",
    "lowerOptimal": 5.1,
    "upperOptimal": 20.5,
    "lowerReference": 5.1,
    "upperReference": 20.5,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 11.6,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 11.1,
        "testDate": "2025-06-20"
      },
      {
        "value": 11.5,
        "testDate": "2025-12-12"
      },
      {
        "value": 11.6,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "total-protein",
    "name": "Total Protein",
    "displayName": "Total Protein",
    "category": "Liver",
    "categories": [
      "Liver"
    ],
    "aliases": [
      "Total Protein"
    ],
    "description": "",
    "whatItMeasures": "",
    "whyItMatters": "",
    "unit": "",
    "ruleType": "",
    "optimalRangeLabel": "",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "albumin-microalbumin-urine",
    "name": "Albumin / Microalbumin - Urine",
    "displayName": "Albumin / Microalbumin",
    "category": "Kidneys",
    "categories": [
      "Kidneys",
      "Urine"
    ],
    "aliases": [
      "Albumin / Microalbumin",
      "Albumin / Microalbumin (Urine)",
      "Albumin / Microalbumin - Urine",
      "Urine",
      "Urine Albumin / Microalbumin"
    ],
    "description": "Measures albumin protein in urine, an early sign of kidney or vascular damage when persistent.",
    "whatItMeasures": "Measures albumin protein in urine, an early sign of kidney or vascular damage when persistent.",
    "whyItMatters": "This can be associated with chronic kidney disease; diabetes-related kidney disease; hypertension-related kidney damage. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "g/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<300",
    "suboptimalRangeLabel": "300-3000",
    "outOfRangeLabel": ">3000",
    "lowerOptimal": null,
    "upperOptimal": 300.0,
    "lowerReference": null,
    "upperReference": 3000.0,
    "directionality": "lower_is_better",
    "status": "at_risk",
    "latestValue": 1515.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1379.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 1470.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 1515.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "blood-urea-nitrogen-bun",
    "name": "Blood Urea Nitrogen - BUN",
    "displayName": "Blood Urea Nitrogen",
    "category": "Kidneys",
    "categories": [
      "Kidneys"
    ],
    "aliases": [
      "BUN",
      "BUN Blood Urea Nitrogen",
      "Blood Urea Nitrogen",
      "Blood Urea Nitrogen (BUN)",
      "Blood Urea Nitrogen - BUN"
    ],
    "description": "Measures urea nitrogen from protein metabolism, affected by kidney filtration, hydration and protein intake.",
    "whatItMeasures": "Measures urea nitrogen from protein metabolism, affected by kidney filtration, hydration and protein intake.",
    "whyItMatters": "This can be associated with kidney dysfunction; dehydration; high protein catabolism. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L urea",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "2.9-8.2",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<2.9; >8.2",
    "lowerOptimal": 2.9,
    "upperOptimal": 8.2,
    "lowerReference": 2.9,
    "upperReference": 8.2,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 5.68,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 5.45,
        "testDate": "2025-06-20"
      },
      {
        "value": 5.62,
        "testDate": "2025-12-12"
      },
      {
        "value": 5.68,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "bun-creatinine-ratio",
    "name": "BUN / Creatinine Ratio",
    "displayName": "BUN / Creatinine Ratio",
    "category": "Kidneys",
    "categories": [
      "Kidneys"
    ],
    "aliases": [
      "BUN / Creatinine Ratio"
    ],
    "description": "Compares BUN with creatinine to help interpret hydration, kidney perfusion and kidney function patterns.",
    "whatItMeasures": "Compares BUN with creatinine to help interpret hydration, kidney perfusion and kidney function patterns.",
    "whyItMatters": "This can be associated with dehydration; kidney dysfunction; gastrointestinal bleeding. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "N/A; contextual",
    "ruleType": "CONTEXTUAL",
    "optimalRangeLabel": "CONTEXT_REQUIRED",
    "suboptimalRangeLabel": "CONTEXT_REQUIRED",
    "outOfRangeLabel": "CONTEXT_REQUIRED",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Context Required",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "chloride",
    "name": "Chloride",
    "displayName": "Chloride",
    "category": "Kidneys",
    "categories": [
      "Kidneys",
      "Electrolytes"
    ],
    "aliases": [
      "Chloride"
    ],
    "description": "Measures a major electrolyte involved in acid-base balance and fluid regulation.",
    "whatItMeasures": "Measures a major electrolyte involved in acid-base balance and fluid regulation.",
    "whyItMatters": "This can be associated with dehydration; kidney dysfunction; acid-base disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "96-106",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<96; >106",
    "lowerOptimal": 96.0,
    "upperOptimal": 106.0,
    "lowerReference": 96.0,
    "upperReference": 106.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 100.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 96.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 99.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 100.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "creatinine",
    "name": "Creatinine",
    "displayName": "Creatinine",
    "category": "Kidneys",
    "categories": [
      "Kidneys"
    ],
    "aliases": [
      "Creatinine"
    ],
    "description": "Measures a muscle metabolism waste product used to estimate kidney filtration.",
    "whatItMeasures": "Measures a muscle metabolism waste product used to estimate kidney filtration.",
    "whyItMatters": "This can be associated with kidney dysfunction; chronic kidney disease; acute kidney injury. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "53-106",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<53; >106",
    "lowerOptimal": 53.0,
    "upperOptimal": 106.0,
    "lowerReference": 53.0,
    "upperReference": 106.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 77.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 74.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 76.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 77.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "estimated-glomerular-filtration-rate-egfr",
    "name": "Estimated Glomerular Filtration Rate - eGFR",
    "displayName": "Estimated Glomerular Filtration Rate",
    "category": "Kidneys",
    "categories": [
      "Kidneys"
    ],
    "aliases": [
      "Estimated Glomerular Filtration Rate",
      "Estimated Glomerular Filtration Rate (eGFR)",
      "Estimated Glomerular Filtration Rate - eGFR",
      "eGFR",
      "eGFR Estimated Glomerular Filtration Rate"
    ],
    "description": "Estimates kidney filtration capacity from creatinine and demographic factors.",
    "whatItMeasures": "Estimates kidney filtration capacity from creatinine and demographic factors.",
    "whyItMatters": "This can be associated with chronic kidney disease; acute kidney dysfunction; diabetes-related kidney disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mL/min/1.73m\u00b2",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": ">=90",
    "suboptimalRangeLabel": "60-89",
    "outOfRangeLabel": "<60; >=3; <30",
    "lowerOptimal": 90.0,
    "upperOptimal": null,
    "lowerReference": 60.0,
    "upperReference": null,
    "directionality": "higher_is_better",
    "status": "optimal",
    "latestValue": 100.8,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 96.8,
        "testDate": "2025-06-20"
      },
      {
        "value": 99.8,
        "testDate": "2025-12-12"
      },
      {
        "value": 100.8,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "potassium",
    "name": "Potassium",
    "displayName": "Potassium",
    "category": "Kidneys",
    "categories": [
      "Kidneys",
      "Electrolytes"
    ],
    "aliases": [
      "Potassium"
    ],
    "description": "Measures a key electrolyte for heart rhythm, muscle and nerve function.",
    "whatItMeasures": "Measures a key electrolyte for heart rhythm, muscle and nerve function.",
    "whyItMatters": "This can be associated with hyperkalemia; hypokalemia; kidney dysfunction; arrhythmia risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "4.0-4.5",
    "suboptimalRangeLabel": "3.5-3.9; 4.6-5.0",
    "outOfRangeLabel": "<3.5; >5.0; >6",
    "lowerOptimal": 4.0,
    "upperOptimal": 4.5,
    "lowerReference": 3.5,
    "upperReference": 5.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 4.26,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 4.09,
        "testDate": "2025-06-20"
      },
      {
        "value": 4.22,
        "testDate": "2025-12-12"
      },
      {
        "value": 4.26,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "sodium",
    "name": "Sodium",
    "displayName": "Sodium",
    "category": "Kidneys",
    "categories": [
      "Kidneys",
      "Electrolytes"
    ],
    "aliases": [
      "Sodium"
    ],
    "description": "Measures a major electrolyte that reflects fluid balance and neurologic risk when abnormal.",
    "whatItMeasures": "Measures a major electrolyte that reflects fluid balance and neurologic risk when abnormal.",
    "whyItMatters": "This can be associated with hyponatremia; hypernatremia; dehydration; kidney/adrenal disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "138-142",
    "suboptimalRangeLabel": "135-137; 143-145",
    "outOfRangeLabel": "<135; >145",
    "lowerOptimal": 138.0,
    "upperOptimal": 142.0,
    "lowerReference": 135.0,
    "upperReference": 145.0,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 136.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 124.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 132.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 136.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "amylase",
    "name": "Amylase",
    "displayName": "Amylase",
    "category": "Pancreas",
    "categories": [
      "Pancreas"
    ],
    "aliases": [
      "Amylase"
    ],
    "description": "A digestive enzyme from pancreas and salivary glands; elevations can occur with pancreatic or salivary inflammation.",
    "whatItMeasures": "A digestive enzyme from pancreas and salivary glands; elevations can occur with pancreatic or salivary inflammation.",
    "whyItMatters": "This can be associated with pancreatitis; salivary gland disease; pancreatic stress. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "U/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "40-140",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<40; >140",
    "lowerOptimal": 40.0,
    "upperOptimal": 140.0,
    "lowerReference": 40.0,
    "upperReference": 140.0,
    "directionality": "range_based",
    "status": "needs_attention",
    "latestValue": 146.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 120.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 136.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 146.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "lipase",
    "name": "Lipase",
    "displayName": "Lipase",
    "category": "Pancreas",
    "categories": [
      "Pancreas"
    ],
    "aliases": [
      "Lipase"
    ],
    "description": "A pancreatic enzyme that rises more specifically with pancreatic inflammation.",
    "whatItMeasures": "A pancreatic enzyme that rises more specifically with pancreatic inflammation.",
    "whyItMatters": "This can be associated with pancreatitis; pancreatic injury. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "U/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "13-60",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<13; >60",
    "lowerOptimal": 13.0,
    "upperOptimal": 60.0,
    "lowerReference": 13.0,
    "upperReference": 60.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 34.4,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 33.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 34.1,
        "testDate": "2025-12-12"
      },
      {
        "value": 34.4,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "abo-group-and-rhesus-rh-factor",
    "name": "ABO Group and Rhesus - Rh Factor",
    "displayName": "ABO Group and Rhesus",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "ABO Group and Rhesus",
      "ABO Group and Rhesus (Rh Factor)",
      "ABO Group and Rhesus - Rh Factor",
      "Rh Factor",
      "Rh Factor ABO Group and Rhesus"
    ],
    "description": "Identifies ABO blood type, useful for transfusion compatibility and some risk stratification contexts.",
    "whatItMeasures": "Identifies ABO blood type, useful for transfusion compatibility and some risk stratification contexts.",
    "whyItMatters": "This can be associated with transfusion compatibility; blood type-related risk context. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "categorical",
    "ruleType": "NOT_IMPLEMENTABLE",
    "optimalRangeLabel": "NOT_APPLICABLE",
    "suboptimalRangeLabel": "NOT_APPLICABLE",
    "outOfRangeLabel": "NOT_APPLICABLE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Not Applicable",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "hematocrit",
    "name": "Hematocrit",
    "displayName": "Hematocrit",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "Hematocrit"
    ],
    "description": "Measures the percentage of blood volume made up by red blood cells.",
    "whatItMeasures": "Measures the percentage of blood volume made up by red blood cells.",
    "whyItMatters": "This can be associated with anemia; polycythemia; dehydration. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "%",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "M:38.3-48.6; F:35.5-44.9",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "M:<38.3; M:>48.6; F:<35.5; F:>44.9",
    "lowerOptimal": 38.3,
    "upperOptimal": 48.6,
    "lowerReference": 38.3,
    "upperReference": 48.6,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 43.7,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 42.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 43.3,
        "testDate": "2025-12-12"
      },
      {
        "value": 43.7,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "hemoglobin",
    "name": "Hemoglobin",
    "displayName": "Hemoglobin",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "Hemoglobin"
    ],
    "description": "Measures the oxygen-carrying protein in red blood cells.",
    "whatItMeasures": "Measures the oxygen-carrying protein in red blood cells.",
    "whyItMatters": "This can be associated with anemia; polycythemia; iron deficiency. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "g/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "M:132-166; F:116-150",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "M:<132; M:>166; F:<116; F:>150",
    "lowerOptimal": 132.0,
    "upperOptimal": 166.0,
    "lowerReference": 132.0,
    "upperReference": 166.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 151.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 145.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 149.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 151.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "mean-corpuscular-hemoglobin-mch",
    "name": "Mean Corpuscular Hemoglobin - MCH",
    "displayName": "Mean Corpuscular Hemoglobin",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "MCH",
      "MCH Mean Corpuscular Hemoglobin",
      "Mean Corpuscular Hemoglobin",
      "Mean Corpuscular Hemoglobin (MCH)",
      "Mean Corpuscular Hemoglobin - MCH"
    ],
    "description": "",
    "whatItMeasures": "",
    "whyItMatters": "",
    "unit": "",
    "ruleType": "",
    "optimalRangeLabel": "",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "mean-corpuscular-hemoglobin-concentration-mchc",
    "name": "Mean Corpuscular Hemoglobin Concentration - MCHC",
    "displayName": "Mean Corpuscular Hemoglobin Concentration",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "MCHC",
      "MCHC Mean Corpuscular Hemoglobin Concentration",
      "Mean Corpuscular Hemoglobin Concentration",
      "Mean Corpuscular Hemoglobin Concentration (MCHC)",
      "Mean Corpuscular Hemoglobin Concentration - MCHC"
    ],
    "description": "",
    "whatItMeasures": "",
    "whyItMatters": "",
    "unit": "",
    "ruleType": "",
    "optimalRangeLabel": "",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "mean-corpuscular-volume-mcv",
    "name": "Mean Corpuscular Volume - MCV",
    "displayName": "Mean Corpuscular Volume",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "MCV",
      "MCV Mean Corpuscular Volume",
      "Mean Corpuscular Volume",
      "Mean Corpuscular Volume (MCV)",
      "Mean Corpuscular Volume - MCV"
    ],
    "description": "Measures average red blood cell size, helping classify anemia patterns.",
    "whatItMeasures": "Measures average red blood cell size, helping classify anemia patterns.",
    "whyItMatters": "This can be associated with iron deficiency anemia; b12/folate deficiency; alcohol/liver disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "fL",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "85-92",
    "suboptimalRangeLabel": "80-84; 93-100",
    "outOfRangeLabel": "<80; >100",
    "lowerOptimal": 85.0,
    "upperOptimal": 92.0,
    "lowerReference": 80.0,
    "upperReference": 100.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 88.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 84.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 87.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 88.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "mean-platelet-volume-mpv",
    "name": "Mean Platelet Volume - MPV",
    "displayName": "Mean Platelet Volume",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "MPV",
      "MPV Mean Platelet Volume",
      "Mean Platelet Volume",
      "Mean Platelet Volume (MPV)",
      "Mean Platelet Volume - MPV"
    ],
    "description": "Measures average platelet size, which can reflect platelet production and activation patterns.",
    "whatItMeasures": "Measures average platelet size, which can reflect platelet production and activation patterns.",
    "whyItMatters": "This can be associated with platelet production disorders; inflammation; thrombosis risk context. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "fL",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "8-12",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<8; >12",
    "lowerOptimal": 8.0,
    "upperOptimal": 12.0,
    "lowerReference": 8.0,
    "upperReference": 12.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 10.1,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 9.7,
        "testDate": "2025-06-20"
      },
      {
        "value": 10.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 10.1,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "platelet-count",
    "name": "Platelet Count",
    "displayName": "Platelet Count",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "Platelet Count"
    ],
    "description": "Counts platelets involved in clotting and inflammation.",
    "whatItMeasures": "Counts platelets involved in clotting and inflammation.",
    "whyItMatters": "This can be associated with thrombocytopenia; thrombocytosis; bone marrow/liver/inflammatory disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^9/L",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "180-320",
    "suboptimalRangeLabel": "150-179; 321-400",
    "outOfRangeLabel": "<150; >400",
    "lowerOptimal": 180.0,
    "upperOptimal": 320.0,
    "lowerReference": 150.0,
    "upperReference": 400.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 258.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 248.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 255.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 258.0,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "red-blood-cell-count",
    "name": "Red Blood Cell Count",
    "displayName": "Red Blood Cell Count",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "Red Blood Cell Count"
    ],
    "description": "Counts red blood cells, interpreted with hemoglobin and hematocrit for oxygen-carrying capacity.",
    "whatItMeasures": "Counts red blood cells, interpreted with hemoglobin and hematocrit for oxygen-carrying capacity.",
    "whyItMatters": "This can be associated with anemia; polycythemia; dehydration. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "x10^12/L",
    "ruleType": "SEX_SPECIFIC",
    "optimalRangeLabel": "M:4.35-5.65; F:3.92-5.13",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "M:<4.35; M:>5.65; F:<3.92; F:>5.13",
    "lowerOptimal": 4.35,
    "upperOptimal": 5.65,
    "lowerReference": 4.35,
    "upperReference": 5.65,
    "directionality": "range_based",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "red-cell-distribution-width-rdw",
    "name": "Red Cell Distribution Width - RDW",
    "displayName": "Red Cell Distribution Width",
    "category": "Blood",
    "categories": [
      "Blood"
    ],
    "aliases": [
      "RDW",
      "RDW Red Cell Distribution Width",
      "Red Cell Distribution Width",
      "Red Cell Distribution Width (RDW)",
      "Red Cell Distribution Width - RDW"
    ],
    "description": "Measures variation in red blood cell size and can rise early in nutritional anemia or chronic disease patterns.",
    "whatItMeasures": "Measures variation in red blood cell size and can rise early in nutritional anemia or chronic disease patterns.",
    "whyItMatters": "This can be associated with iron deficiency; b12/folate deficiency; anemia; inflammation. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "%",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "11.5-13.0",
    "suboptimalRangeLabel": "13.1-14.5",
    "outOfRangeLabel": ">14.5",
    "lowerOptimal": 11.5,
    "upperOptimal": 13.0,
    "lowerReference": 11.5,
    "upperReference": 14.5,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 12.2,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 11.7,
        "testDate": "2025-06-20"
      },
      {
        "value": 12.1,
        "testDate": "2025-12-12"
      },
      {
        "value": 12.2,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "carbon-dioxide",
    "name": "Carbon Dioxide",
    "displayName": "Carbon Dioxide",
    "category": "Electrolytes",
    "categories": [
      "Electrolytes"
    ],
    "aliases": [
      "Carbon Dioxide"
    ],
    "description": "Reflects bicarbonate level and acid-base balance in routine chemistry panels.",
    "whatItMeasures": "Reflects bicarbonate level and acid-base balance in routine chemistry panels.",
    "whyItMatters": "This can be associated with metabolic acidosis; metabolic alkalosis; kidney/lung disorders. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "mmol/L",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "22-28",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "<22; >28",
    "lowerOptimal": 22.0,
    "upperOptimal": 28.0,
    "lowerReference": 22.0,
    "upperReference": 28.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 24.9,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 23.9,
        "testDate": "2025-06-20"
      },
      {
        "value": 24.7,
        "testDate": "2025-12-12"
      },
      {
        "value": 24.9,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "amorphous-sediment-urine",
    "name": "Amorphous Sediment, Urine",
    "displayName": "Urine Amorphous Sediment",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Amorphous Sediment, Urine",
      "Urine Amorphous Sediment"
    ],
    "description": "Reports non-specific crystals or sediment seen in urine microscopy.",
    "whatItMeasures": "Reports non-specific crystals or sediment seen in urine microscopy.",
    "whyItMatters": "This can be associated with urine concentration changes; crystalluria; kidney stone risk context. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NONE/FEW",
    "suboptimalRangeLabel": "MODERATE",
    "outOfRangeLabel": "MANY",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "at_risk",
    "latestValue": "Moderate",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "appearance-urine",
    "name": "Appearance, Urine",
    "displayName": "Urine Appearance",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Appearance, Urine",
      "Urine Appearance"
    ],
    "description": "Describes urine clarity; cloudiness can reflect cells, crystals, bacteria or mucus.",
    "whatItMeasures": "Describes urine clarity; cloudiness can reflect cells, crystals, bacteria or mucus.",
    "whyItMatters": "This can be associated with uti; crystalluria; dehydration; kidney/urinary inflammation. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "categorical",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "CLEAR",
    "suboptimalRangeLabel": "SLIGHTLY_CLOUDY",
    "outOfRangeLabel": "CLOUDY/TURBID",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "bacteria-urine",
    "name": "Bacteria, Urine",
    "displayName": "Urine Bacteria",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Bacteria, Urine",
      "Urine Bacteria"
    ],
    "description": "Detects bacteria on urine microscopy, interpreted with symptoms and leukocyte/nitrite markers.",
    "whatItMeasures": "Detects bacteria on urine microscopy, interpreted with symptoms and leukocyte/nitrite markers.",
    "whyItMatters": "This can be associated with urinary tract infection; contamination. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NONE",
    "suboptimalRangeLabel": "FEW",
    "outOfRangeLabel": "MODERATE_MANY",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "bilirubin-urine",
    "name": "Bilirubin, Urine",
    "displayName": "Urine Bilirubin",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Bilirubin, Urine",
      "Urine Bilirubin"
    ],
    "description": "Detects bilirubin in urine, which may signal liver or bile duct problems.",
    "whatItMeasures": "Detects bilirubin in urine, which may signal liver or bile duct problems.",
    "whyItMatters": "This can be associated with liver disease; bile duct obstruction; hepatitis. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "TRACE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "calcium-oxalate-crystals-urine",
    "name": "Calcium Oxalate Crystals, Urine",
    "displayName": "Urine Calcium Oxalate Crystals",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Calcium Oxalate Crystals, Urine",
      "Urine Calcium Oxalate Crystals"
    ],
    "description": "Detects calcium oxalate crystals, which can be associated with kidney stone risk.",
    "whatItMeasures": "Detects calcium oxalate crystals, which can be associated with kidney stone risk.",
    "whyItMatters": "This can be associated with kidney stones; hyperoxaluria; dehydration. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NONE/FEW",
    "suboptimalRangeLabel": "MODERATE",
    "outOfRangeLabel": "MANY",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "needs_attention",
    "latestValue": "Many",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "color-urine",
    "name": "Color, Urine",
    "displayName": "Urine Color",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Color, Urine",
      "Urine Color"
    ],
    "description": "Describes urine color, influenced by hydration, medications, blood, bilirubin and diet.",
    "whatItMeasures": "Describes urine color, influenced by hydration, medications, blood, bilirubin and diet.",
    "whyItMatters": "This can be associated with dehydration; hematuria; liver/bile disease; medication/diet effects. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "categorical",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "PALE_YELLOW-YELLOW",
    "suboptimalRangeLabel": "DARK_YELLOW",
    "outOfRangeLabel": "RED/BROWN/OTHER",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Pale Yellow-Yellow",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "glucose-urine",
    "name": "Glucose, Urine",
    "displayName": "Urine Glucose",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Glucose, Urine",
      "Urine Glucose"
    ],
    "description": "Detects glucose spilling into urine, usually when blood glucose is high or renal glucose handling is altered.",
    "whatItMeasures": "Detects glucose spilling into urine, usually when blood glucose is high or renal glucose handling is altered.",
    "whyItMatters": "This can be associated with diabetes; hyperglycemia; renal glycosuria. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "TRACE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "hyaline-casts-urine",
    "name": "Hyaline Casts, Urine",
    "displayName": "Urine Hyaline Casts",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Hyaline Casts, Urine",
      "Urine Hyaline Casts"
    ],
    "description": "Reports casts formed in kidney tubules; small numbers can occur with dehydration or exercise, higher levels may indicate kidney stress.",
    "whatItMeasures": "Reports casts formed in kidney tubules; small numbers can occur with dehydration or exercise, higher levels may indicate kidney stress.",
    "whyItMatters": "This can be associated with dehydration; kidney disease; exercise-related changes. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "casts/LPF",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "0-2",
    "suboptimalRangeLabel": "3-5",
    "outOfRangeLabel": ">5",
    "lowerOptimal": 0.0,
    "upperOptimal": 2.0,
    "lowerReference": 0.0,
    "upperReference": 5.0,
    "directionality": "range_based",
    "status": "at_risk",
    "latestValue": 3.35,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 3.05,
        "testDate": "2025-06-20"
      },
      {
        "value": 3.25,
        "testDate": "2025-12-12"
      },
      {
        "value": 3.35,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "ketones-urine",
    "name": "Ketones, Urine",
    "displayName": "Urine Ketones",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Ketones, Urine",
      "Urine Ketones"
    ],
    "description": "Detects ketones from fat metabolism, fasting, low-carbohydrate intake, or uncontrolled diabetes.",
    "whatItMeasures": "Detects ketones from fat metabolism, fasting, low-carbohydrate intake, or uncontrolled diabetes.",
    "whyItMatters": "This can be associated with diabetic ketoacidosis risk; fasting/ketosis; poor glycemic control. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "TRACE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "at_risk",
    "latestValue": "Trace",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "leukocyte-esterase-urine",
    "name": "Leukocyte Esterase, Urine",
    "displayName": "Urine Leukocyte Esterase",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Leukocyte Esterase, Urine",
      "Urine Leukocyte Esterase"
    ],
    "description": "Screens for white blood cell activity in urine, often used in UTI assessment.",
    "whatItMeasures": "Screens for white blood cell activity in urine, often used in UTI assessment.",
    "whyItMatters": "This can be associated with urinary tract infection; urinary inflammation. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "TRACE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "leukocyte-urine",
    "name": "Leukocyte, Urine",
    "displayName": "Urine Leukocyte",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Leukocyte, Urine",
      "Urine Leukocyte"
    ],
    "description": "Counts white cells in urine, supporting infection or urinary tract inflammation assessment.",
    "whatItMeasures": "Counts white cells in urine, supporting infection or urinary tract inflammation assessment.",
    "whyItMatters": "This can be associated with urinary tract infection; kidney/urinary inflammation. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "WBC/HPF",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "0-5",
    "suboptimalRangeLabel": "6-10",
    "outOfRangeLabel": ">10",
    "lowerOptimal": 0.0,
    "upperOptimal": 5.0,
    "lowerReference": 0.0,
    "upperReference": 10.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 2.6,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 2.5,
        "testDate": "2025-06-20"
      },
      {
        "value": 2.6,
        "testDate": "2025-12-12"
      },
      {
        "value": 2.6,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "nitrite-urine",
    "name": "Nitrite, Urine",
    "displayName": "Urine Nitrite",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Nitrite, Urine",
      "Urine Nitrite"
    ],
    "description": "Detects nitrite-producing bacteria in urine, supporting UTI diagnosis when positive.",
    "whatItMeasures": "Detects nitrite-producing bacteria in urine, supporting UTI diagnosis when positive.",
    "whyItMatters": "This can be associated with urinary tract infection. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "occult-blood-urine",
    "name": "Occult Blood, Urine",
    "displayName": "Urine Occult Blood",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Occult Blood, Urine",
      "Urine Occult Blood"
    ],
    "description": "Detects blood or hemoglobin in urine and should be interpreted with microscopy and clinical context.",
    "whatItMeasures": "Detects blood or hemoglobin in urine and should be interpreted with microscopy and clinical context.",
    "whyItMatters": "This can be associated with hematuria; kidney stones; uti; kidney disease. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "TRACE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "ph-urine",
    "name": "pH, Urine",
    "displayName": "Urine pH",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Urine pH",
      "pH, Urine"
    ],
    "description": "Measures urine acidity/alkalinity, influenced by diet, infection, kidney handling and stone risk.",
    "whatItMeasures": "Measures urine acidity/alkalinity, influenced by diet, infection, kidney handling and stone risk.",
    "whyItMatters": "This can be associated with kidney stone risk; uti; renal tubular acidosis. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "pH",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "5.5-7.5",
    "suboptimalRangeLabel": "5.0-5.4; 7.6-8.0",
    "outOfRangeLabel": "<5.0; >8.0",
    "lowerOptimal": 5.5,
    "upperOptimal": 7.5,
    "lowerReference": 5.0,
    "upperReference": 8.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 6.41,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 6.15,
        "testDate": "2025-06-20"
      },
      {
        "value": 6.35,
        "testDate": "2025-12-12"
      },
      {
        "value": 6.41,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "protein-urine",
    "name": "Protein, Urine",
    "displayName": "Urine Protein",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Protein, Urine",
      "Urine Protein"
    ],
    "description": "Screens for protein leakage into urine, a marker of kidney or urinary tract pathology when persistent.",
    "whatItMeasures": "Screens for protein leakage into urine, a marker of kidney or urinary tract pathology when persistent.",
    "whyItMatters": "This can be associated with kidney disease; diabetes-related kidney disease; hypertension-related kidney damage. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NEGATIVE",
    "suboptimalRangeLabel": "TRACE",
    "outOfRangeLabel": "POSITIVE",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "needs_attention",
    "latestValue": "Positive",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "red-blood-cell-urine",
    "name": "Red Blood Cell, Urine",
    "displayName": "Urine Red Blood Cell",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Red Blood Cell, Urine",
      "Urine Red Blood Cell"
    ],
    "description": "Counts red cells in urine microscopy, helping confirm hematuria.",
    "whatItMeasures": "Counts red cells in urine microscopy, helping confirm hematuria.",
    "whyItMatters": "This can be associated with kidney stones; uti; kidney disease; urinary tract bleeding. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "RBC/HPF",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "0-2",
    "suboptimalRangeLabel": "3-5",
    "outOfRangeLabel": ">3",
    "lowerOptimal": 0.0,
    "upperOptimal": 2.0,
    "lowerReference": 0.0,
    "upperReference": 3.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 1.05,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 1.01,
        "testDate": "2025-06-20"
      },
      {
        "value": 1.04,
        "testDate": "2025-12-12"
      },
      {
        "value": 1.05,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "specific-gravity-urine",
    "name": "Specific Gravity, Urine",
    "displayName": "Urine Specific Gravity",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Specific Gravity, Urine",
      "Urine Specific Gravity"
    ],
    "description": "Measures urine concentration and hydration status.",
    "whatItMeasures": "Measures urine concentration and hydration status.",
    "whyItMatters": "This can be associated with dehydration; overhydration; kidney concentrating defects. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "specific_gravity",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "1.010-1.025",
    "suboptimalRangeLabel": "1.005-1.009; 1.026-1.030",
    "outOfRangeLabel": "<1.005; >1.030",
    "lowerOptimal": 1.01,
    "upperOptimal": 1.025,
    "lowerReference": 1.005,
    "upperReference": 1.03,
    "directionality": "range_based",
    "status": "not_available",
    "latestValue": null,
    "latestDate": null,
    "historicalValues": []
  },
  {
    "id": "squamous-epithelial-cells",
    "name": "Squamous Epithelial Cells",
    "displayName": "Squamous Epithelial Cells",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Squamous Epithelial Cells"
    ],
    "description": "Counts skin/genital tract cells in urine; high levels often indicate sample contamination.",
    "whatItMeasures": "Counts skin/genital tract cells in urine; high levels often indicate sample contamination.",
    "whyItMatters": "This can be associated with sample contamination; urinary tract inflammation context. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "cells/HPF",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NONE/FEW",
    "suboptimalRangeLabel": "MODERATE",
    "outOfRangeLabel": "MANY",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "white-blood-cell-urine",
    "name": "White Blood Cell, Urine",
    "displayName": "Urine White Blood Cell",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Urine White Blood Cell",
      "White Blood Cell, Urine"
    ],
    "description": "Counts white cells in urine, supporting infection or urinary tract inflammation assessment.",
    "whatItMeasures": "Counts white cells in urine, supporting infection or urinary tract inflammation assessment.",
    "whyItMatters": "This can be associated with urinary tract infection; kidney/urinary inflammation. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "WBC/HPF",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "0-5",
    "suboptimalRangeLabel": "6-10",
    "outOfRangeLabel": ">10",
    "lowerOptimal": 0.0,
    "upperOptimal": 5.0,
    "lowerReference": 0.0,
    "upperReference": 10.0,
    "directionality": "range_based",
    "status": "optimal",
    "latestValue": 2.3,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 2.2,
        "testDate": "2025-06-20"
      },
      {
        "value": 2.3,
        "testDate": "2025-12-12"
      },
      {
        "value": 2.3,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "yeast-urine",
    "name": "Yeast, Urine",
    "displayName": "Urine Yeast",
    "category": "Urine",
    "categories": [
      "Urine"
    ],
    "aliases": [
      "Urine Yeast",
      "Yeast, Urine"
    ],
    "description": "Detects yeast in urine microscopy, which may reflect contamination or fungal urinary infection in susceptible people.",
    "whatItMeasures": "Detects yeast in urine microscopy, which may reflect contamination or fungal urinary infection in susceptible people.",
    "whyItMatters": "This can be associated with yeast contamination; fungal uti; diabetes-related infection risk. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "qualitative",
    "ruleType": "QUALITATIVE",
    "optimalRangeLabel": "NONE",
    "suboptimalRangeLabel": "FEW",
    "outOfRangeLabel": "MODERATE_MANY",
    "lowerOptimal": null,
    "upperOptimal": null,
    "lowerReference": null,
    "upperReference": null,
    "directionality": "qualitative",
    "status": "optimal",
    "latestValue": "Negative",
    "latestDate": "2026-06-18",
    "historicalValues": []
  },
  {
    "id": "lead",
    "name": "Lead",
    "displayName": "Lead",
    "category": "Environmental Toxins",
    "categories": [
      "Environmental Toxins"
    ],
    "aliases": [
      "Lead"
    ],
    "description": "Measures lead exposure, a toxic heavy metal affecting neurologic, blood, kidney and cardiovascular systems.",
    "whatItMeasures": "Measures lead exposure, a toxic heavy metal affecting neurologic, blood, kidney and cardiovascular systems.",
    "whyItMatters": "This can be associated with lead toxicity; anemia; neurologic toxicity; kidney dysfunction. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "\u00b5mol/L blood",
    "ruleType": "NUMERIC_FIXED",
    "optimalRangeLabel": "<0.05",
    "suboptimalRangeLabel": "0.05-0.16",
    "outOfRangeLabel": ">=0.17",
    "lowerOptimal": null,
    "upperOptimal": 0.05,
    "lowerReference": null,
    "upperReference": 0.17,
    "directionality": "lower_is_better",
    "status": "needs_attention",
    "latestValue": 0.184,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 0.151,
        "testDate": "2025-06-20"
      },
      {
        "value": 0.171,
        "testDate": "2025-12-12"
      },
      {
        "value": 0.184,
        "testDate": "2026-06-18"
      }
    ]
  },
  {
    "id": "mercury",
    "name": "Mercury",
    "displayName": "Mercury",
    "category": "Environmental Toxins",
    "categories": [
      "Environmental Toxins"
    ],
    "aliases": [
      "Mercury"
    ],
    "description": "Measures mercury exposure, often associated with seafood or environmental exposure.",
    "whatItMeasures": "Measures mercury exposure, often associated with seafood or environmental exposure.",
    "whyItMatters": "This can be associated with mercury toxicity; neurologic symptoms; kidney effects. Your doctor may interpret this alongside other markers, symptoms, medications, and history.",
    "unit": "nmol/L blood",
    "ruleType": "REFERENCE_LAB_FIXED",
    "optimalRangeLabel": "<49.9",
    "suboptimalRangeLabel": "49.9-249.5",
    "outOfRangeLabel": ">=249.5",
    "lowerOptimal": null,
    "upperOptimal": 49.9,
    "lowerReference": null,
    "upperReference": 249.5,
    "directionality": "lower_is_better",
    "status": "at_risk",
    "latestValue": 140.0,
    "latestDate": "2026-06-18",
    "historicalValues": [
      {
        "value": 127.0,
        "testDate": "2025-06-20"
      },
      {
        "value": 136.0,
        "testDate": "2025-12-12"
      },
      {
        "value": 140.0,
        "testDate": "2026-06-18"
      }
    ]
  }
];

export const PATIENT_RESULTS: PatientResult[] = [
  {
    "biomarkerId": "apolipoprotein-b-apob",
    "value": 0.58,
    "unit": "g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "hdl-cholesterol",
    "value": 1.74,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "hdl-large",
    "value": 7536.0,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "high-sensitivity-c-reactive-protein-hs-crp",
    "value": 0.7,
    "unit": "mg/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ldl-cholesterol",
    "value": 1.86,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ldl-medium",
    "value": 155.0,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ldl-particle-number",
    "value": 1270.0,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ldl-pattern",
    "value": "A",
    "unit": "categorical",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ldl-peak-size",
    "value": 25.0,
    "unit": "nm",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ldl-small",
    "value": 102.0,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "lipoprotein-a",
    "value": 54.0,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "non-hdl-cholesterol",
    "value": 2.43,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "total-cholesterol",
    "value": 5.63,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "total-cholesterol-hdl-ratio",
    "value": 4.17,
    "unit": "ratio",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "triglycerides",
    "value": 0.81,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "thyroglobulin-antibodies-tgab",
    "value": 2.88,
    "unit": "IU/mL",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "thyroid-stimulating-hormone-tsh",
    "value": 1.8,
    "unit": "mIU/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "free-triiodothyronine-free-t3",
    "value": 4.65,
    "unit": "pmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "antinuclear-antibodies-ana-pattern",
    "value": "Not Applicable",
    "unit": "categorical",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "antinuclear-antibodies-ana-screen",
    "value": "Negative",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "antinuclear-antibodies-titer",
    "value": "80",
    "unit": "titer",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "rheumatoid-factor-rf",
    "value": "Negative",
    "unit": "IU/mL",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "basophils",
    "value": 0.042,
    "unit": "x10^9/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "eosinophils",
    "value": 0.182,
    "unit": "x10^9/L; %",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "lymphocytes",
    "value": 2.33,
    "unit": "x10^9/L; %",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "monocytes",
    "value": 0.2,
    "unit": "x10^9/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "neutrophils",
    "value": 4.46,
    "unit": "x10^9/L; %",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "white-blood-cell-count",
    "value": 5.97,
    "unit": "x10^9/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "anti-mullerian-hormone-amh",
    "value": "Context Required",
    "unit": "pmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "dhea-sulfate",
    "value": 11.1,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "estradiol",
    "value": 702.0,
    "unit": "pmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "follicle-stimulating-hormone-fsh",
    "value": 1.4,
    "unit": "mIU/mL",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "needs_attention",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "luteinizing-hormone-lh",
    "value": 9.0,
    "unit": "mIU/mL",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "prolactin",
    "value": 9.1,
    "unit": "\u00b5g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "sex-hormone-binding-globulin-shbg",
    "value": 76.0,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "total-testosterone",
    "value": 1.12,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "prostate-specific-antigen-psa-percent-free",
    "value": 28.0,
    "unit": "%",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "prostate-specific-antigen-psa-free",
    "value": "Context Required",
    "unit": "\u00b5g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "prostate-specific-antigen-psa-total",
    "value": 4.0,
    "unit": "\u00b5g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "glucose",
    "value": 4.42,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "hemoglobin-a1c-hba1c",
    "value": 5.9,
    "unit": "%",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "leptin",
    "value": 2.79,
    "unit": "\u00b5g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "uric-acid",
    "value": 266.0,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "arachidonic-acid-epa-ratio",
    "value": "Context Required",
    "unit": "N/A; contextual",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "calcium",
    "value": 2.55,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ferritin",
    "value": 106.0,
    "unit": "\u00b5g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "homocysteine",
    "value": 16.2,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "needs_attention",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "iron",
    "value": 17.7,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "iron-percent-saturation",
    "value": 30.2,
    "unit": "%",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "iron-binding-capacity",
    "value": 54.8,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "magnesium",
    "value": 0.788,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "methylmalonic-acid",
    "value": 0.4,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "omega-3-dha",
    "value": 3.34,
    "unit": "% fatty acids",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "omega-3-dpa",
    "value": 1.36,
    "unit": "% fatty acids",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "omega-3-epa",
    "value": 1.08,
    "unit": "% fatty acids",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "omega-6-omega-3-ratio",
    "value": "Context Required",
    "unit": "N/A; contextual",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "omega-6-total",
    "value": "Reference Only",
    "unit": "% fatty acids",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "omega-6-arachidonic-acid",
    "value": 15.6,
    "unit": "% fatty acids",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "omega-6-linoleic-acid",
    "value": 24.7,
    "unit": "% fatty acids",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "vitamin-d",
    "value": 181.0,
    "unit": "nmol/L 25(OH)D",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "zinc",
    "value": 12.4,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "cortisol",
    "value": 437.0,
    "unit": "nmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "alanine-transaminase-alt",
    "value": 3.7,
    "unit": "U/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "needs_attention",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "albumin",
    "value": 45.2,
    "unit": "g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "albumin-globulin-ratio",
    "value": "Context Required",
    "unit": "N/A; contextual",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "alkaline-phosphatase-alp",
    "value": 70.0,
    "unit": "U/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "aspartate-aminotransferase-ast",
    "value": 20.2,
    "unit": "U/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "gamma-glutamyl-transferase-ggt",
    "value": 16.7,
    "unit": "U/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "globulin",
    "value": 28.4,
    "unit": "g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "total-bilirubin",
    "value": 11.6,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "albumin-microalbumin-urine",
    "value": 1515.0,
    "unit": "g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "blood-urea-nitrogen-bun",
    "value": 5.68,
    "unit": "mmol/L urea",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "bun-creatinine-ratio",
    "value": "Context Required",
    "unit": "N/A; contextual",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "chloride",
    "value": 100.0,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "creatinine",
    "value": 77.0,
    "unit": "\u00b5mol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "estimated-glomerular-filtration-rate-egfr",
    "value": 100.8,
    "unit": "mL/min/1.73m\u00b2",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "potassium",
    "value": 4.26,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "sodium",
    "value": 136.0,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "amylase",
    "value": 146.0,
    "unit": "U/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "needs_attention",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "lipase",
    "value": 34.4,
    "unit": "U/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "abo-group-and-rhesus-rh-factor",
    "value": "Not Applicable",
    "unit": "categorical",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "hematocrit",
    "value": 43.7,
    "unit": "%",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "hemoglobin",
    "value": 151.0,
    "unit": "g/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "mean-corpuscular-volume-mcv",
    "value": 88.0,
    "unit": "fL",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "mean-platelet-volume-mpv",
    "value": 10.1,
    "unit": "fL",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "platelet-count",
    "value": 258.0,
    "unit": "x10^9/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "red-cell-distribution-width-rdw",
    "value": 12.2,
    "unit": "%",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "carbon-dioxide",
    "value": 24.9,
    "unit": "mmol/L",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "amorphous-sediment-urine",
    "value": "Moderate",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "appearance-urine",
    "value": "Negative",
    "unit": "categorical",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "bilirubin-urine",
    "value": "Negative",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "calcium-oxalate-crystals-urine",
    "value": "Many",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "needs_attention",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "color-urine",
    "value": "Pale Yellow-Yellow",
    "unit": "categorical",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "glucose-urine",
    "value": "Negative",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "hyaline-casts-urine",
    "value": 3.35,
    "unit": "casts/LPF",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ketones-urine",
    "value": "Trace",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "leukocyte-esterase-urine",
    "value": "Negative",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "leukocyte-urine",
    "value": 2.6,
    "unit": "WBC/HPF",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "nitrite-urine",
    "value": "Negative",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "occult-blood-urine",
    "value": "Negative",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "ph-urine",
    "value": 6.41,
    "unit": "pH",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "protein-urine",
    "value": "Positive",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "needs_attention",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "red-blood-cell-urine",
    "value": 1.05,
    "unit": "RBC/HPF",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "squamous-epithelial-cells",
    "value": "Negative",
    "unit": "cells/HPF",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "white-blood-cell-urine",
    "value": 2.3,
    "unit": "WBC/HPF",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "yeast-urine",
    "value": "Negative",
    "unit": "qualitative",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "optimal",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "lead",
    "value": 0.184,
    "unit": "\u00b5mol/L blood",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "needs_attention",
    "notes": "Seeded demo result for member portal visual testing."
  },
  {
    "biomarkerId": "mercury",
    "value": 140.0,
    "unit": "nmol/L blood",
    "testDate": "2026-06-18",
    "sourceReportId": "demo-core-panel-2026-06",
    "status": "at_risk",
    "notes": "Seeded demo result for member portal visual testing."
  }
];
