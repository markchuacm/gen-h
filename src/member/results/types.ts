export type BiomarkerStatus = "optimal" | "at_risk" | "needs_attention" | "not_available";

export type Directionality = "higher_is_better" | "lower_is_better" | "range_based" | "qualitative";

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
