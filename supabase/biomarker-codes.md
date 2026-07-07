# Biomarker codes — Gen-H catalog

`biomarker_results.biomarker_code` must match a code below (the app merges results
into its catalog by this key). Anything else still renders via `biomarker_name`,
but loses descriptions, ranges and trend history.

Source of truth: `src/member-v2/screens/results/biomarkerData.ts`. Regenerate with
the node snippet in the repo history if the catalog changes.

| code | display name | category | unit |
|---|---|---|---|
| `apolipoprotein-b-apob` | Apolipoprotein B | Heart | g/L |
| `hdl-cholesterol` | HDL Cholesterol | Heart | mmol/L |
| `hdl-large` | HDL Large | Heart | nmol/L |
| `high-sensitivity-c-reactive-protein-hs-crp` | High-Sensitivity C-Reactive Protein | Heart | mg/L |
| `ldl-cholesterol` | LDL Cholesterol | Heart | mmol/L |
| `ldl-medium` | LDL Medium | Heart | nmol/L |
| `ldl-particle-number` | LDL Particle Number | Heart | nmol/L |
| `ldl-pattern` | LDL Pattern | Heart | categorical |
| `ldl-peak-size` | LDL Peak Size | Heart | nm |
| `ldl-small` | LDL Small | Heart | nmol/L |
| `lipoprotein-a` | Lipoprotein(a) | Heart | nmol/L |
| `non-hdl-cholesterol` | Non-HDL Cholesterol | Heart | mmol/L |
| `total-cholesterol` | Total Cholesterol | Heart | mmol/L |
| `total-cholesterol-hdl-ratio` | Total Cholesterol / HDL Ratio | Heart | ratio |
| `triglycerides` | Triglycerides | Heart | mmol/L |
| `thyroglobulin-antibodies-tgab` | Thyroglobulin Antibodies | Thyroid | IU/mL |
| `thyroid-peroxidase-antibodies-tpo` | Thyroid Peroxidase Antibodies | Thyroid | — |
| `thyroid-stimulating-hormone-tsh` | Thyroid-Stimulating Hormone | Thyroid | mIU/L |
| `free-thyroxine-free-t4` | Free Thyroxine | Thyroid | pmol/L |
| `free-triiodothyronine-free-t3` | Free Triiodothyronine | Thyroid | pmol/L |
| `antinuclear-antibodies-ana-pattern` | Antinuclear Antibodies | Autoimmunity | categorical |
| `antinuclear-antibodies-ana-screen` | Antinuclear Antibodies | Autoimmunity | qualitative |
| `antinuclear-antibodies-titer` | Antinuclear Antibodies Titer | Autoimmunity | titer |
| `rheumatoid-factor-rf` | Rheumatoid Factor | Autoimmunity | IU/mL |
| `basophils` | Basophils | Immune Regulation | x10^9/L |
| `eosinophils` | Eosinophils | Immune Regulation | x10^9/L; % |
| `lymphocytes` | Lymphocytes | Immune Regulation | x10^9/L; % |
| `monocytes` | Monocytes | Immune Regulation | x10^9/L |
| `neutrophils` | Neutrophils | Immune Regulation | x10^9/L; % |
| `white-blood-cell-count` | White Blood Cell Count | Immune Regulation | x10^9/L |
| `anti-mullerian-hormone-amh` | Anti-Mullerian Hormone | Female Health | pmol/L |
| `dhea-sulfate` | DHEA-Sulfate | Female Health | \u00b5mol/L |
| `estradiol` | Estradiol | Female Health | pmol/L |
| `follicle-stimulating-hormone-fsh` | Follicle Stimulating Hormone | Female Health | mIU/mL |
| `luteinizing-hormone-lh` | Luteinizing Hormone | Female Health | mIU/mL |
| `prolactin` | Prolactin | Female Health | \u00b5g/L |
| `sex-hormone-binding-globulin-shbg` | Sex Hormone Binding Globulin | Female Health | nmol/L |
| `free-testosterone` | Free Testosterone | Female Health | pmol/L |
| `total-testosterone` | Total Testosterone | Female Health | nmol/L |
| `prostate-specific-antigen-psa-percent-free` | Prostate Specific Antigen | Male Health | % |
| `prostate-specific-antigen-psa-free` | Prostate Specific Antigen | Male Health | \u00b5g/L |
| `prostate-specific-antigen-psa-total` | Prostate Specific Antigen | Male Health | \u00b5g/L |
| `glucose` | Glucose | Metabolic | mmol/L |
| `hemoglobin-a1c-hba1c` | Hemoglobin A1c | Metabolic | % |
| `insulin` | Insulin | Metabolic | — |
| `leptin` | Leptin | Metabolic | \u00b5g/L |
| `uric-acid` | Uric Acid | Metabolic | \u00b5mol/L |
| `arachidonic-acid-epa-ratio` | Arachidonic Acid / EPA Ratio | Nutrients | N/A; contextual |
| `calcium` | Calcium | Nutrients | mmol/L |
| `ferritin` | Ferritin | Nutrients | \u00b5g/L |
| `homocysteine` | Homocysteine | Nutrients | \u00b5mol/L |
| `iron` | Iron | Nutrients | \u00b5mol/L |
| `iron-percent-saturation` | Iron % Saturation | Nutrients | % |
| `iron-binding-capacity` | Iron Binding Capacity | Nutrients | \u00b5mol/L |
| `magnesium` | Magnesium | Nutrients | mmol/L |
| `methylmalonic-acid` | Methylmalonic Acid | Nutrients | \u00b5mol/L |
| `omega-3-total` | Omega-3 Total | Nutrients | % of total fatty acids |
| `omega-3-dha` | Omega-3 DHA | Nutrients | % fatty acids |
| `omega-3-dpa` | Omega-3 DPA | Nutrients | % fatty acids |
| `omega-3-epa` | Omega-3 EPA | Nutrients | % fatty acids |
| `omega-6-omega-3-ratio` | Omega-6 / Omega-3 Ratio | Nutrients | N/A; contextual |
| `omega-6-total` | Omega-6 Total | Nutrients | % fatty acids |
| `omega-6-arachidonic-acid` | Omega-6 Arachidonic Acid | Nutrients | % fatty acids |
| `omega-6-linoleic-acid` | Omega-6 Linoleic Acid | Nutrients | % fatty acids |
| `vitamin-d` | Vitamin D | Nutrients | nmol/L 25(OH)D |
| `zinc` | Zinc | Nutrients | \u00b5mol/L |
| `cortisol` | Cortisol | Stress & Aging | nmol/L |
| `alanine-transaminase-alt` | Alanine Transaminase | Liver | U/L |
| `albumin` | Albumin | Liver | g/L |
| `albumin-globulin-ratio` | Albumin / Globulin Ratio | Liver | N/A; contextual |
| `alkaline-phosphatase-alp` | Alkaline Phosphatase | Liver | U/L |
| `aspartate-aminotransferase-ast` | Aspartate Aminotransferase | Liver | U/L |
| `gamma-glutamyl-transferase-ggt` | Gamma-Glutamyl Transferase | Liver | U/L |
| `globulin` | Globulin | Liver | g/L |
| `total-bilirubin` | Total Bilirubin | Liver | \u00b5mol/L |
| `total-protein` | Total Protein | Liver | — |
| `albumin-microalbumin-urine` | Albumin / Microalbumin | Kidneys | g/L |
| `blood-urea-nitrogen-bun` | Blood Urea Nitrogen | Kidneys | mmol/L urea |
| `bun-creatinine-ratio` | BUN / Creatinine Ratio | Kidneys | N/A; contextual |
| `chloride` | Chloride | Kidneys | mmol/L |
| `creatinine` | Creatinine | Kidneys | \u00b5mol/L |
| `estimated-glomerular-filtration-rate-egfr` | Estimated Glomerular Filtration Rate | Kidneys | mL/min/1.73m\u00b2 |
| `potassium` | Potassium | Kidneys | mmol/L |
| `sodium` | Sodium | Kidneys | mmol/L |
| `amylase` | Amylase | Pancreas | U/L |
| `lipase` | Lipase | Pancreas | U/L |
| `abo-group-and-rhesus-rh-factor` | ABO Group and Rhesus | Blood | categorical |
| `hematocrit` | Hematocrit | Blood | % |
| `hemoglobin` | Hemoglobin | Blood | g/L |
| `mean-corpuscular-hemoglobin-mch` | Mean Corpuscular Hemoglobin | Blood | — |
| `mean-corpuscular-hemoglobin-concentration-mchc` | Mean Corpuscular Hemoglobin Concentration | Blood | — |
| `mean-corpuscular-volume-mcv` | Mean Corpuscular Volume | Blood | fL |
| `mean-platelet-volume-mpv` | Mean Platelet Volume | Blood | fL |
| `platelet-count` | Platelet Count | Blood | x10^9/L |
| `red-blood-cell-count` | Red Blood Cell Count | Blood | x10^12/L |
| `red-cell-distribution-width-rdw` | Red Cell Distribution Width | Blood | % |
| `carbon-dioxide` | Carbon Dioxide | Electrolytes | mmol/L |
| `amorphous-sediment-urine` | Urine Amorphous Sediment | Urine | qualitative |
| `appearance-urine` | Urine Appearance | Urine | categorical |
| `bacteria-urine` | Urine Bacteria | Urine | qualitative |
| `bilirubin-urine` | Urine Bilirubin | Urine | qualitative |
| `calcium-oxalate-crystals-urine` | Urine Calcium Oxalate Crystals | Urine | qualitative |
| `color-urine` | Urine Color | Urine | categorical |
| `glucose-urine` | Urine Glucose | Urine | qualitative |
| `hyaline-casts-urine` | Urine Hyaline Casts | Urine | casts/LPF |
| `ketones-urine` | Urine Ketones | Urine | qualitative |
| `leukocyte-esterase-urine` | Urine Leukocyte Esterase | Urine | qualitative |
| `leukocyte-urine` | Urine Leukocyte | Urine | WBC/HPF |
| `nitrite-urine` | Urine Nitrite | Urine | qualitative |
| `occult-blood-urine` | Urine Occult Blood | Urine | qualitative |
| `ph-urine` | Urine pH | Urine | pH |
| `protein-urine` | Urine Protein | Urine | qualitative |
| `red-blood-cell-urine` | Urine Red Blood Cell | Urine | RBC/HPF |
| `specific-gravity-urine` | Urine Specific Gravity | Urine | specific_gravity |
| `squamous-epithelial-cells` | Squamous Epithelial Cells | Urine | cells/HPF |
| `white-blood-cell-urine` | Urine White Blood Cell | Urine | WBC/HPF |
| `yeast-urine` | Urine Yeast | Urine | qualitative |
| `lead` | Lead | Environmental Toxins | \u00b5mol/L blood |
| `mercury` | Mercury | Environmental Toxins | nmol/L blood |
