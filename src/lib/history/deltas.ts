import { readSnapshot } from "@/lib/data/snapshotStore";
import {
  HISTORY_METRIC_IDS,
  type HistoryMetricId,
  type HistorySnapshot,
} from "@/lib/history/metrics";
import type { SeriesPoint } from "@/lib/stats";

export type DayDelta = {
  metricId: HistoryMetricId;
  labelPt: string;
  labelEn: string;
  unit: "rate" | "usd" | "usd_m" | "pct" | "index" | "other";
  prev: number;
  curr: number;
  absChange: number;
  pctChange: number | null;
  /** Crossed a materiality threshold — show in ritual */
  notable: boolean;
  prevDay: string;
  currDay: string;
};

const LABELS: Record<
  HistoryMetricId,
  { pt: string; en: string; unit: DayDelta["unit"] }
> = {
  funding_btc: { pt: "Funding BTC", en: "BTC funding", unit: "rate" },
  oi_btc: { pt: "Open interest BTC", en: "BTC open interest", unit: "usd" },
  breadth: { pt: "Amplitude (top)", en: "Breadth (top)", unit: "pct" },
  fear_greed: { pt: "Medo & Ganância", en: "Fear & Greed", unit: "index" },
  btc_dominance: { pt: "Dominância BTC", en: "BTC dominance", unit: "pct" },
  tvl: { pt: "TVL DeFi", en: "DeFi TVL", unit: "usd" },
  etf_btc_flow: { pt: "Fluxo ETF BTC", en: "BTC ETF flow", unit: "usd_m" },
  volume_btc: { pt: "Volume BTC", en: "BTC volume", unit: "usd" },
  vol_realized_btc: {
    pt: "Vol. realizada BTC",
    en: "BTC realized vol",
    unit: "pct",
  },
  fee_btc: { pt: "Taxa BTC", en: "BTC fee", unit: "other" },
  stablecoin_supply: {
    pt: "Oferta stablecoins",
    en: "Stablecoin supply",
    unit: "usd",
  },
};

/**
 * Materiality thresholds — honest "is this worth mentioning?"
 * Tuned to avoid padding quiet days.
 */
function isNotable(id: HistoryMetricId, abs: number, pct: number | null): boolean {
  switch (id) {
    case "fear_greed":
      return abs >= 5;
    case "funding_btc":
      return abs >= 0.00004;
    case "oi_btc":
      return pct != null && Math.abs(pct) >= 3;
    case "breadth":
      return abs >= 8;
    case "btc_dominance":
      return abs >= 0.4;
    case "tvl":
      return pct != null && Math.abs(pct) >= 2;
    case "etf_btc_flow":
      return abs >= 80;
    case "volume_btc":
      return pct != null && Math.abs(pct) >= 25;
    case "vol_realized_btc":
      return abs >= 2;
    case "fee_btc":
      return abs >= 5;
    case "stablecoin_supply":
      return pct != null && Math.abs(pct) >= 0.25;
    default:
      return false;
  }
}

function lastTwo(points: SeriesPoint[]): {
  prev: SeriesPoint;
  curr: SeriesPoint;
} | null {
  if (points.length < 2) return null;
  const curr = points[points.length - 1];
  const prev = points[points.length - 2];
  if (!Number.isFinite(curr.v) || !Number.isFinite(prev.v)) return null;
  return { prev, curr };
}

export function computeDayDeltas(
  series: HistorySnapshot["series"] | undefined,
): DayDelta[] {
  if (!series) return [];
  const out: DayDelta[] = [];

  for (const id of HISTORY_METRIC_IDS) {
    const blob = series[id];
    const pair = lastTwo(blob?.points ?? []);
    if (!pair) continue;
    const { prev, curr } = pair;
    const absChange = curr.v - prev.v;
    const pctChange =
      prev.v !== 0 ? ((curr.v - prev.v) / Math.abs(prev.v)) * 100 : null;
    const meta = LABELS[id];
    out.push({
      metricId: id,
      labelPt: meta.pt,
      labelEn: meta.en,
      unit: meta.unit,
      prev: prev.v,
      curr: curr.v,
      absChange,
      pctChange,
      notable: isNotable(id, Math.abs(absChange), pctChange),
      prevDay: prev.t,
      currDay: curr.t,
    });
  }

  return out.sort(
    (a, b) => Number(b.notable) - Number(a.notable) || Math.abs(b.absChange) - Math.abs(a.absChange),
  );
}

/** Disk-only — no network. */
export async function getHistoryDayDeltas(): Promise<{
  updatedAt: string | null;
  deltas: DayDelta[];
}> {
  const snap = await readSnapshot<HistorySnapshot>("history");
  return {
    updatedAt: snap?.updatedAt ?? null,
    deltas: computeDayDeltas(snap?.series),
  };
}
