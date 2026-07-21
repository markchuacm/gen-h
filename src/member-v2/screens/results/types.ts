export type BiomarkerStatus = "optimal" | "at_risk" | "needs_attention" | "not_available";

export type Directionality = "higher_is_better" | "lower_is_better" | "range_based" | "qualitative";

/** How far the dashboard is allowed to go in interpreting a result.
    INFORMATIONAL exists for screening assays and tumour markers, where a
    traffic light would imply a diagnosis the test cannot support. */
export type ScoringMode = "THREE_TIER" | "TWO_TIER" | "QUALITATIVE" | "INFORMATIONAL";

/** Patient context a marker's ranges depend on, used to pick a range branch
    and to caption it ("for a 42-year-old female"). */
export type ContextRequirement = "sex" | "age" | "cycle_phase" | "sample_timing";

export type BiomarkerValue = number | string | null;

export type HistoricalValue = {
  value: number;
  testDate: string;
};

export type Biomarker = {
  id: string;
  name: string;
  displayName: string;
  category: string;
  categories: string[];
  aliases: string[];
  description: string;
  whatItMeasures: string;
  whyItMatters: string;
  unit: string;
  scoringMode: ScoringMode;
  contextRequirements: ContextRequirement[];
  optimalRangeLabel: string;
  suboptimalRangeLabel: string;
  outOfRangeLabel: string;
  lowerOptimal: number | null;
  upperOptimal: number | null;
  lowerReference: number | null;
  upperReference: number | null;
  directionality: Directionality;
  status: BiomarkerStatus;
  latestValue: BiomarkerValue;
  latestDate: string | null;
  historicalValues: HistoricalValue[];
};

export type BiomarkerCategory = {
  name: string;
  description: string;
  biomarkerIds: string[];
};

export type PatientResult = {
  biomarkerId: string;
  value: BiomarkerValue;
  unit: string;
  testDate: string | null;
  sourceReportId: string;
  status: BiomarkerStatus;
  notes: string;
};
