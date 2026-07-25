import { readSnapshot } from "@/lib/data/snapshotStore";
import {
  computeMetricContext,
  type MetricBand,
  type MetricContext,
  type SeriesPoint,
} from "@/lib/stats";
import {
  HISTORY_METRIC_IDS,
  type HistoryMetricId,
  type HistorySnapshot,
} from "@/lib/history/metrics";

/**
 * API / wire shape (PT field names per product contract).
 * Incomplete windows: diasDeAmostra is honest — never faked to 90.
 */
export type MetricContextApi = {
  valor: number;
  percentil: number | null;
  zScore: number | null;
  min: number | null;
  max: number | null;
  mediana: number | null;
  classificação: MetricBand;
  diasDeAmostra: number;
  janelaDias: number;
};

export function toApiContext(ctx: MetricContext): MetricContextApi {
  return {
    valor: ctx.value,
    percentil: ctx.percentile,
    zScore: ctx.zScore,
    min: ctx.min,
    max: ctx.max,
    mediana: ctx.median,
    classificação: ctx.classification,
    diasDeAmostra: ctx.sampleDays,
    janelaDias: ctx.windowDays,
  };
}

/**
 * Read persisted history snapshot and compute contexts.
 * Disk only — no network. Safe for API / optional server props.
 */
export async function getHistoryContexts(
  overrides?: Partial<Record<HistoryMetricId, number>>,
): Promise<{
  updatedAt: string | null;
  windowDays: number;
  metrics: Partial<Record<HistoryMetricId, MetricContextApi>>;
}> {
  const snap = await readSnapshot<HistorySnapshot>("history");
  const windowDays = snap?.windowDays ?? 90;
  const metrics: Partial<Record<HistoryMetricId, MetricContextApi>> = {};

  if (!snap?.series) {
    return { updatedAt: null, windowDays, metrics };
  }

  for (const id of HISTORY_METRIC_IDS) {
    const blob = snap.series[id];
    if (!blob?.points?.length && overrides?.[id] == null) continue;
    const points: SeriesPoint[] = blob?.points ?? [];
    const ctx = computeMetricContext(points, {
      windowDays,
      value: overrides?.[id],
    });
    if (ctx) metrics[id] = toApiContext(ctx);
  }

  return {
    updatedAt: snap.updatedAt ?? null,
    windowDays,
    metrics,
  };
}

export async function getMetricContext(
  id: HistoryMetricId,
  value?: number,
): Promise<MetricContextApi | null> {
  const all = await getHistoryContexts(
    value != null ? { [id]: value } : undefined,
  );
  return all.metrics[id] ?? null;
}
