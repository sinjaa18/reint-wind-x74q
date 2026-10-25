export interface Observation {
  startTime: string;
  forecastPublishTime: string | null;
  forecastGeneration: number | null;
  actualGeneration: number | null;
  error: number | null;
}

export interface Metrics {
  sampleSize: number;
  mae: number | null;
  rmse: number | null;
  bias: number | null;
  wape: number | null;
  expectedIntervals: number;
  actualIntervals: number;
  forecastIntervals: number;
  matchedIntervals: number;
  coveragePercent: number;
}

export interface Manifest {
  generatedAtUtc?: string;
  deliveryWindow?: { from: string; toExclusive: string };
  forecastPublishWindow?: { from: string; toExclusive: string };
  decisionCutoffDefault?: string;
  resolutionNote?: string;
  expectedHalfHourlyIntervals?: number;
  expectedHourlyIntervals?: number;
  actuals?: {
    rowsFetched: number;
    invalidOrMissingValues: number;
    nonWindRowsExcluded: number;
    uniqueIntervals: number;
    missingIntervals: number;
    coveragePercent: number;
  };
  forecasts?: {
    rowsFetched: number;
    invalidRows: number;
    outsideJanuaryDeliveryWindow: number;
    uniqueStartPublishPairs: number;
    deliveryIntervalsCovered: number;
    deliveryIntervalsWithoutAnyForecast: number;
    hourlyCoveragePercent: number;
    halfHourlyCoveragePercent: number;
  };
  sourceEndpoints?: {
    actuals: string;
    forecasts: string;
  };
  attribution?: string;
}

export interface AnalysisResponse {
  month: string;
  cutoff: string;
  metrics: Metrics;
  observations: Observation[];
  dataManifest?: Manifest | null;
}

export interface MetaResponse {
  month: string;
  expectedIntervals: number;
  dataLoaded: boolean;
  actualRows: number;
  forecastRows: number;
  manifest?: Manifest | null;
  sources: string[];
  defaultCutoff: string;
}
