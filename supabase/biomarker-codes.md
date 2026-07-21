# Biomarker codes — Gen-H catalog

`biomarker_results.biomarker_code` must match a code below (the app merges results
into its catalog by this key). An unrecognised code still renders via `biomarker_name`
under "Other results", but loses descriptions, ranges and trend history. A code that is
**retired** is hidden from members entirely.

Source of truth: the `app.biomarkers` table, seeded from
`server/seeds/biomarker-catalog.json`. Regenerate this file from that seed when the
panel changes; an admin can also retire or reinstate a marker from the Biomarkers tab
in the admin console, which this file will not reflect.

## Active (103)

| code | display name | category | unit | scoring |
|---|---|---|---|---|
| `apolipoprotein-a1` | Apolipoprotein A1 | Heart | g/L | TWO_TIER |
| `apolipoprotein-b-apob` | Apolipoprotein B | Heart | g/L | THREE_TIER |
| `apolipoprotein-b-a1-ratio` | Apolipoprotein B-to-A1 Ratio | Heart | index | THREE_TIER |
| `hdl-cholesterol` | HDL Cholesterol | Heart | mmol/L | THREE_TIER |
| `ldl-cholesterol` | LDL Cholesterol | Heart | mmol/L | THREE_TIER |
| `non-hdl-cholesterol` | Non-HDL Cholesterol | Heart | mmol/L | THREE_TIER |
| `total-cholesterol` | Total Cholesterol | Heart | mmol/L | THREE_TIER |
| `total-cholesterol-hdl-ratio` | Total Cholesterol / HDL Ratio | Heart | ratio | THREE_TIER |
| `triglycerides` | Triglycerides | Heart | mmol/L | THREE_TIER |
| `glucose` | Glucose | Metabolic | mmol/L | THREE_TIER |
| `hemoglobin-a1c-hba1c` | Hemoglobin A1c | Metabolic | % | THREE_TIER |
| `insulin` | Insulin | Metabolic | uIU/mL | THREE_TIER |
| `uric-acid` | Uric Acid | Metabolic | µmol/L | THREE_TIER |
| `hematocrit` | Hematocrit | Blood | % | TWO_TIER |
| `hemoglobin` | Hemoglobin | Blood | g/L | TWO_TIER |
| `mean-corpuscular-hemoglobin-mch` | Mean Corpuscular Hemoglobin | Blood | pg | THREE_TIER |
| `mean-corpuscular-hemoglobin-concentration-mchc` | Mean Corpuscular Hemoglobin Concentration | Blood | g/dL | THREE_TIER |
| `mean-corpuscular-volume-mcv` | Mean Corpuscular Volume | Blood | fL | THREE_TIER |
| `peripheral-blood-film` | Peripheral Blood Film | Blood | — | QUALITATIVE |
| `platelet-count` | Platelet Count | Blood | x10^9/L | THREE_TIER |
| `red-blood-cell-count` | Red Blood Cell Count | Blood | x10^12/L | TWO_TIER |
| `red-cell-distribution-width-rdw` | Red Cell Distribution Width | Blood | % | THREE_TIER |
| `basophils` | Basophils | Immune Regulation | x10^9/L | TWO_TIER |
| `eosinophils` | Eosinophils | Immune Regulation | x10^9/L; % | THREE_TIER |
| `erythrocyte-sedimentation-rate` | Erythrocyte Sedimentation Rate | Immune Regulation | mm/Hr | TWO_TIER |
| `high-sensitivity-c-reactive-protein-hs-crp` | High-Sensitivity C-Reactive Protein | Immune Regulation | mg/L | THREE_TIER |
| `lymphocytes` | Lymphocytes | Immune Regulation | x10^9/L; % | THREE_TIER |
| `monocytes` | Monocytes | Immune Regulation | x10^9/L | TWO_TIER |
| `neutrophils` | Neutrophils | Immune Regulation | x10^9/L; % | THREE_TIER |
| `white-blood-cell-count` | White Blood Cell Count | Immune Regulation | x10^9/L | THREE_TIER |
| `calcium` | Calcium | Nutrients | mmol/L | TWO_TIER |
| `corrected-calcium` | Corrected Calcium | Nutrients | mmol/L | TWO_TIER |
| `ferritin` | Ferritin | Nutrients | µg/L | THREE_TIER |
| `homocysteine` | Homocysteine | Nutrients | µmol/L | THREE_TIER |
| `iron` | Iron | Nutrients | µmol/L | TWO_TIER |
| `iron-percent-saturation` | Iron % Saturation | Nutrients | % | THREE_TIER |
| `iron-binding-capacity` | Iron Binding Capacity | Nutrients | µmol/L | THREE_TIER |
| `magnesium` | Magnesium | Nutrients | mmol/L | TWO_TIER |
| `phosphorus` | Phosphorus | Nutrients | mmol/L | TWO_TIER |
| `transferrin` | Transferrin | Nutrients | g/L | TWO_TIER |
| `vitamin-d` | Vitamin D | Nutrients | nmol/L 25(OH)D | THREE_TIER |
| `alanine-transaminase-alt` | Alanine Transaminase | Liver | U/L | TWO_TIER |
| `albumin` | Albumin | Liver | g/L | TWO_TIER |
| `albumin-globulin-ratio` | Albumin / Globulin Ratio | Liver | N/A; contextual | INFORMATIONAL |
| `alkaline-phosphatase-alp` | Alkaline Phosphatase | Liver | U/L | TWO_TIER |
| `aspartate-aminotransferase-ast` | Aspartate Aminotransferase | Liver | U/L | TWO_TIER |
| `fibrosis-4-score` | Fibrosis-4 (FIB-4) Score | Liver | index | THREE_TIER |
| `gamma-glutamyl-transferase-ggt` | Gamma-Glutamyl Transferase | Liver | U/L | TWO_TIER |
| `globulin` | Globulin | Liver | g/L | TWO_TIER |
| `total-bilirubin` | Total Bilirubin | Liver | µmol/L | TWO_TIER |
| `total-protein` | Total Protein | Liver | g/L | THREE_TIER |
| `albumin-microalbumin-urine` | Albumin / Microalbumin | Kidneys | g/L | THREE_TIER |
| `creatinine` | Creatinine | Kidneys | µmol/L | TWO_TIER |
| `estimated-glomerular-filtration-rate-egfr` | Estimated Glomerular Filtration Rate | Kidneys | mL/min/1.73m² | THREE_TIER |
| `urea` | Urea | Kidneys | mmol/L | TWO_TIER |
| `urine-albumin-creatinine-ratio` | Urine Albumin-to-Creatinine Ratio | Kidneys | mg/mmol | THREE_TIER |
| `urine-creatinine` | Urine Creatinine | Kidneys | mmol/L | INFORMATIONAL |
| `chloride` | Chloride | Electrolytes | mmol/L | TWO_TIER |
| `potassium` | Potassium | Electrolytes | mmol/L | THREE_TIER |
| `sodium` | Sodium | Electrolytes | mmol/L | THREE_TIER |
| `free-thyroxine-free-t4` | Free Thyroxine | Thyroid | pmol/L | TWO_TIER |
| `free-triiodothyronine-free-t3` | Free Triiodothyronine | Thyroid | pmol/L | TWO_TIER |
| `thyroid-stimulating-hormone-tsh` | Thyroid-Stimulating Hormone | Thyroid | mIU/L | THREE_TIER |
| `dhea-sulfate` | DHEA-Sulfate | Hormones | µmol/L | TWO_TIER |
| `estradiol` | Estradiol | Hormones | pmol/L | TWO_TIER |
| `follicle-stimulating-hormone-fsh` | Follicle Stimulating Hormone | Hormones | mIU/mL | TWO_TIER |
| `free-androgen-index` | Free Androgen Index | Hormones | % | INFORMATIONAL |
| `free-testosterone` | Free Testosterone | Hormones | pmol/L | TWO_TIER |
| `luteinizing-hormone-lh` | Luteinizing Hormone | Hormones | mIU/mL | TWO_TIER |
| `progesterone` | Progesterone | Hormones | nmol/L | INFORMATIONAL |
| `prolactin` | Prolactin | Hormones | µg/L | TWO_TIER |
| `prostate-specific-antigen-psa-total` | Prostate Specific Antigen (Total) | Hormones | µg/L | TWO_TIER |
| `sex-hormone-binding-globulin-shbg` | Sex Hormone Binding Globulin | Hormones | nmol/L | TWO_TIER |
| `total-testosterone` | Total Testosterone | Hormones | nmol/L | TWO_TIER |
| `cortisol` | Cortisol | Stress & Aging | nmol/L | TWO_TIER |
| `insulin-like-growth-factor-1` | Insulin-Like Growth Factor 1 | Stress & Aging | ng/mL | TWO_TIER |
| `helicobacter-pylori-igg-antibody` | H. pylori IgG Antibody | Infectious Disease | S/CO | QUALITATIVE |
| `hiv-antigen-antibody-screen` | HIV-1/2 Antigen and Antibody Screen | Infectious Disease | — | INFORMATIONAL |
| `hepatitis-a-antibody` | Hepatitis A Antibody | Infectious Disease | — | INFORMATIONAL |
| `hepatitis-b-surface-antibody` | Hepatitis B Surface Antibody | Infectious Disease | mIU/mL | INFORMATIONAL |
| `hepatitis-b-surface-antigen` | Hepatitis B Surface Antigen | Infectious Disease | — | INFORMATIONAL |
| `treponema-pallidum-antibody` | Treponema pallidum Antibody | Infectious Disease | — | INFORMATIONAL |
| `alpha-fetoprotein` | Alpha-Fetoprotein | Cancer Screening | ng/mL | INFORMATIONAL |
| `cancer-antigen-19-9` | Cancer Antigen 19-9 | Cancer Screening | U/mL | INFORMATIONAL |
| `carcinoembryonic-antigen` | Carcinoembryonic Antigen | Cancer Screening | ng/mL | INFORMATIONAL |
| `other-urine-microscopy-findings` | Other Urine Microscopy Findings | Urine | — | INFORMATIONAL |
| `squamous-epithelial-cells` | Squamous Epithelial Cells | Urine | cells/HPF | QUALITATIVE |
| `appearance-urine` | Urine Appearance | Urine | categorical | QUALITATIVE |
| `bilirubin-urine` | Urine Bilirubin | Urine | qualitative | QUALITATIVE |
| `color-urine` | Urine Color | Urine | categorical | QUALITATIVE |
| `crystals-urine` | Urine Crystals | Urine | — | QUALITATIVE |
| `glucose-urine` | Urine Glucose | Urine | qualitative | QUALITATIVE |
| `hyaline-casts-urine` | Urine Hyaline Casts | Urine | casts/LPF | THREE_TIER |
| `ketones-urine` | Urine Ketones | Urine | qualitative | QUALITATIVE |
| `leukocyte-esterase-urine` | Urine Leukocyte Esterase | Urine | qualitative | QUALITATIVE |
| `nitrite-urine` | Urine Nitrite | Urine | qualitative | QUALITATIVE |
| `occult-blood-urine` | Urine Occult Blood | Urine | qualitative | QUALITATIVE |
| `protein-urine` | Urine Protein | Urine | qualitative | QUALITATIVE |
| `red-blood-cell-urine` | Urine Red Blood Cell | Urine | RBC/HPF | THREE_TIER |
| `specific-gravity-urine` | Urine Specific Gravity | Urine | specific_gravity | QUALITATIVE |
| `urobilinogen-urine` | Urine Urobilinogen | Urine | — | QUALITATIVE |
| `white-blood-cell-urine` | Urine White Blood Cell | Urine | WBC/HPF | THREE_TIER |
| `ph-urine` | Urine pH | Urine | pH | QUALITATIVE |

## Retired (42)

Kept in the catalog so they can be reinstated without a deploy.

| code | display name |
|---|---|
| `abo-group-and-rhesus-rh-factor` | ABO Group and Rhesus |
| `amylase` | Amylase |
| `anti-mullerian-hormone-amh` | Anti-Mullerian Hormone |
| `antinuclear-antibodies-ana-pattern` | Antinuclear Antibodies |
| `antinuclear-antibodies-ana-screen` | Antinuclear Antibodies |
| `antinuclear-antibodies-titer` | Antinuclear Antibodies Titer |
| `arachidonic-acid-epa-ratio` | Arachidonic Acid / EPA Ratio |
| `bun-creatinine-ratio` | BUN / Creatinine Ratio |
| `blood-urea-nitrogen-bun` | Blood Urea Nitrogen |
| `carbon-dioxide` | Carbon Dioxide |
| `hdl-large` | HDL Large |
| `ldl-medium` | LDL Medium |
| `ldl-particle-number` | LDL Particle Number |
| `ldl-pattern` | LDL Pattern |
| `ldl-peak-size` | LDL Peak Size |
| `ldl-small` | LDL Small |
| `lead` | Lead |
| `leptin` | Leptin |
| `lipase` | Lipase |
| `lipoprotein-a` | Lipoprotein(a) |
| `mean-platelet-volume-mpv` | Mean Platelet Volume |
| `mercury` | Mercury |
| `methylmalonic-acid` | Methylmalonic Acid |
| `omega-3-dha` | Omega-3 DHA |
| `omega-3-dpa` | Omega-3 DPA |
| `omega-3-epa` | Omega-3 EPA |
| `omega-3-total` | Omega-3 Total |
| `omega-6-omega-3-ratio` | Omega-6 / Omega-3 Ratio |
| `omega-6-arachidonic-acid` | Omega-6 Arachidonic Acid |
| `omega-6-linoleic-acid` | Omega-6 Linoleic Acid |
| `omega-6-total` | Omega-6 Total |
| `prostate-specific-antigen-psa-percent-free` | Prostate Specific Antigen |
| `prostate-specific-antigen-psa-free` | Prostate Specific Antigen |
| `rheumatoid-factor-rf` | Rheumatoid Factor |
| `thyroglobulin-antibodies-tgab` | Thyroglobulin Antibodies |
| `thyroid-peroxidase-antibodies-tpo` | Thyroid Peroxidase Antibodies |
| `amorphous-sediment-urine` | Urine Amorphous Sediment |
| `bacteria-urine` | Urine Bacteria |
| `calcium-oxalate-crystals-urine` | Urine Calcium Oxalate Crystals |
| `leukocyte-urine` | Urine Leukocyte |
| `yeast-urine` | Urine Yeast |
| `zinc` | Zinc |
