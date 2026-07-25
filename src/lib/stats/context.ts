import {
  DEFAULT_WINDOW_DAYS,
  MIN_SAMPLES_FOR_CONTEXT,
  type MetricBand,
  type MetricContext,
  type SeriesPoint,
} from "@/lib/stats/types";

function sortedValues(points: SeriesPoint[]): number[] {
  return points.map((p) => p.v).sort((a, b) => a - b);
}

function mean(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

function sampleStdev(xs: number[], avg: number): number {
  if (xs.length < 2) return 0;
  const ss = xs.reduce((s, x) => s + (x - avg) ** 2, 0);
  return Math.sqrt(ss / (xs.length - 1));
}

function medianOfSorted(sorted: number[]): number {
  const n = sorted.length;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Empirical percentile rank of `value` in `sorted` (ascending).
 * Uses mid-rank for ties: (below + 0.5 * equal) / n * 100.
 */
export function percentileRank(sorted: number[], value: number): number {
  let below = 0;
  let equal = 0;
  for (const x of sorted) {
    if (x < value) below++;
    else if (x === value) equal++;
  }
  return ((below + 0.5 * equal) / sorted.length) * 100;
}

export function classifyByPercentile(p: number | null, sampleDays: number): MetricBand {
  if (p == null || sampleDays < MIN_SAMPLES_FOR_CONTEXT) return "insufficient";
  if (p < 5) return "extreme_low";
  if (p < 20) return "low";
  if (p < 80) return "normal";
  if (p < 95) return "high";
  return "extreme_high";
}

/**
 * Build context for the latest point against a historical window.
 * Does not extrapolate missing days — sampleDays is the real count.
 */
export function computeMetricContext(
  points: SeriesPoint[],
  opts?: { windowDays?: number; value?: number },
): MetricContext | null {
  const windowDays = opts?.windowDays ?? DEFAULT_WINDOW_DAYS;
  if (!points.length && opts?.value == null) return null;

  const cutoff = Date.now() - windowDays * 24 * 60 * 60_000;
  const window = points.filter((p) => {
    const ts = Date.parse(p.t.length === 10 ? `${p.t}T00:00:00Z` : p.t);
    return Number.isFinite(ts) && ts >= cutoff;
  });

  const value =
    opts?.value ??
    (window.length ? window[window.length - 1].v : points[points.length - 1]?.v);

  if (value == null || !Number.isFinite(value)) return null;

  const sampleDays = new Set(
    window.map((p) => (p.t.length >= 10 ? p.t.slice(0, 10) : p.t)),
  ).size;

  if (window.length === 0) {
    return {
      value,
      percentile: null,
      zScore: null,
      min: null,
      max: null,
      median: null,
      classification: "insufficient",
      sampleDays: 0,
      windowDays,
    };
  }

  const sorted = sortedValues(window);
  const avg = mean(sorted);
  const sd = sampleStdev(sorted, avg);
  const percentile = percentileRank(sorted, value);
  const zScore = sd > 0 ? (value - avg) / sd : null;

  return {
    value,
    percentile,
    zScore,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: medianOfSorted(sorted),
    classification: classifyByPercentile(percentile, sampleDays),
    sampleDays,
    windowDays,
  };
}

/** Distinct calendar days in a series (UTC date prefix). */
export function countSampleDays(points: SeriesPoint[]): number {
  return new Set(points.map((p) => p.t.slice(0, 10))).size;
}
