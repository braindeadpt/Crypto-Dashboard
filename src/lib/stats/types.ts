/**
 * Historical context for a live metric reading.
 * Never invents values — incomplete windows are reported honestly.
 */
export type MetricBand =
  | "extreme_low"
  | "low"
  | "normal"
  | "high"
  | "extreme_high"
  | "insufficient";

export type MetricContext = {
  /** Latest observed value (same unit as the series) */
  value: number;
  /** 0–100 empirical percentile in the window; null if insufficient */
  percentile: number | null;
  /** (value - mean) / stdev; null if stdev=0 or n<2 */
  zScore: number | null;
  min: number | null;
  max: number | null;
  median: number | null;
  classification: MetricBand;
  /** Distinct calendar days present in the window (honest sample size) */
  sampleDays: number;
  /** Target window length in days (usually 90) */
  windowDays: number;
};

export type SeriesPoint = {
  /** ISO date YYYY-MM-DD (UTC day) or ISO datetime for hourly */
  t: string;
  v: number;
};

export const MIN_SAMPLES_FOR_CONTEXT = 7;
export const DEFAULT_WINDOW_DAYS = 90;
