import type { EtfSnapshot } from "@/lib/data/etf";
import {
  isSnapshotStale,
  readSnapshot,
  writeSnapshot,
} from "@/lib/data/snapshotStore";
import { toApiContext, type MetricContextApi } from "@/lib/history/context";
import {
  HISTORY_METRIC_IDS,
  METRIC_META,
  type HistoryMetricId,
  type HistorySeriesBlob,
  type HistorySnapshot,
} from "@/lib/history/metrics";
import { dayKey, mergeDailyPoints } from "@/lib/history/series";
import { computeMetricContext, type SeriesPoint } from "@/lib/stats";

const STABLES = "https://stablecoins.llama.fi";
const FAPI = "https://fapi.binance.com";
const STALE_MS = 45 * 60_000;
const SERIES_DAYS = 90;

type ChartPoint = {
  date: string;
  totalCirculatingUSD?: Record<string, number>;
};

export type StableTop = {
  name: string;
  symbol: string;
  circulatingUsd: number;
};

export type LiquiditySnapshot = {
  stables: {
    /** Sum of all pegged circulating in USD terms */
    totalUsd: number;
    /** USD-pegged circulating only (classic liquidity fuel) */
    peggedUsd: number;
    change7dPct: number | null;
    change30dPct: number | null;
    change7dUsd: number | null;
    change30dUsd: number | null;
    series: SeriesPoint[];
    context: MetricContextApi | null;
    top: StableTop[];
    source: string;
  };
  spot: {
    available: boolean;
    etfCombined1dUsdM: number | null;
    etfBtc1dUsdM: number | null;
    etfEth1dUsdM: number | null;
    etfSum5dUsdM: number | null;
    tone: "up" | "down" | "neutral" | "warn" | null;
    signalPt: string | null;
    signalEn: string | null;
    source: string;
  };
  leverage: {
    available: boolean;
    fundingBtc: number | null;
    fundingBps: number | null;
    oiUsd: number | null;
    oiChange24hPct: number | null;
    longShortRatio: number | null;
    source: string;
  };
  /**
   * Exchange netflows omitted: no free, high-quality public API without keys
   * (CryptoQuant / Glassnode / CoinGlass are paid; 0xScope requires API key).
   */
  exchangeFlows: null;
  exchangeFlowsNotePt: string;
  exchangeFlowsNoteEn: string;
  readingPt: string;
  readingEn: string;
  stale: boolean;
  ingestedAt: string;
};

function sumCirculatingUsd(point: ChartPoint): number {
  const o = point.totalCirculatingUSD ?? {};
  return Object.values(o).reduce(
    (s, v) => s + (typeof v === "number" && Number.isFinite(v) ? v : 0),
    0,
  );
}

function peggedUsdOnly(point: ChartPoint): number {
  const v = point.totalCirculatingUSD?.peggedUSD;
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

function pctChange(now: number, then: number | null): number | null {
  if (then == null || then <= 0 || !Number.isFinite(now)) return null;
  return ((now - then) / then) * 100;
}

function valueDaysAgo(series: SeriesPoint[], days: number): number | null {
  if (series.length < 2) return null;
  const target = Date.now() - days * 86_400_000;
  let best: SeriesPoint | null = null;
  for (const p of series) {
    const ts = Date.parse(p.t.length === 10 ? `${p.t}T00:00:00Z` : p.t);
    if (Number.isFinite(ts) && ts <= target) best = p;
  }
  // Require reasonable span
  const first = Date.parse(series[0].t + (series[0].t.length === 10 ? "T00:00:00Z" : ""));
  const last = Date.parse(
    series[series.length - 1].t +
      (series[series.length - 1].t.length === 10 ? "T00:00:00Z" : ""),
  );
  if (!Number.isFinite(first) || !Number.isFinite(last)) return null;
  if ((last - first) / 86_400_000 < days * 0.55) return null;
  return best?.v ?? null;
}

/**
 * Heavy ingest — NEVER call from page render.
 * Stablecoin supply series + consolidated liquidity snapshot (spot / leverage / stables).
 */
export async function ingestLiquiditySnapshot(): Promise<{
  totalUsd: number;
  seriesDays: number;
}> {
  const [chartRes, listRes, premRes, oiHistRes, oiRes, lsRes] = await Promise.all([
    fetch(`${STABLES}/stablecoincharts/all`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }),
    fetch(`${STABLES}/stablecoins?includePrices=true`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).catch(() => null),
    fetch(`${FAPI}/fapi/v1/premiumIndex?symbol=BTCUSDT`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).catch(() => null),
    fetch(
      `${FAPI}/futures/data/openInterestHist?symbol=BTCUSDT&period=1h&limit=25`,
      { cache: "no-store", headers: { Accept: "application/json" } },
    ).catch(() => null),
    fetch(`${FAPI}/fapi/v1/openInterest?symbol=BTCUSDT`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    }).catch(() => null),
    fetch(
      `${FAPI}/futures/data/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=1`,
      { cache: "no-store", headers: { Accept: "application/json" } },
    ).catch(() => null),
  ]);

  if (!chartRes.ok) throw new Error(`stablecoincharts ${chartRes.status}`);
  const chart = (await chartRes.json()) as ChartPoint[];

  const seriesAll: SeriesPoint[] = chart
    .map((p) => ({
      t: dayKey(new Date(Number(p.date) * 1000).toISOString()),
      v: sumCirculatingUsd(p),
    }))
    .filter((p) => p.v > 0);

  // Dedupe by day (keep last)
  const byDay = new Map<string, number>();
  for (const p of seriesAll) byDay.set(p.t, p.v);
  const series = [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-SERIES_DAYS)
    .map(([t, v]) => ({ t, v }));

  const latestChart = chart[chart.length - 1];
  const totalUsd = series[series.length - 1]?.v ?? 0;
  const peggedUsd = latestChart ? peggedUsdOnly(latestChart) : 0;

  const v7 = valueDaysAgo(series, 7);
  const v30 = valueDaysAgo(series, 30);
  const change7dUsd = v7 != null ? totalUsd - v7 : null;
  const change30dUsd = v30 != null ? totalUsd - v30 : null;
  const change7dPct = pctChange(totalUsd, v7);
  const change30dPct = pctChange(totalUsd, v30);

  const ctx = computeMetricContext(series, {
    windowDays: SERIES_DAYS,
    value: totalUsd,
  });

  let top: StableTop[] = [];
  if (listRes?.ok) {
    const list = (await listRes.json()) as {
      peggedAssets?: {
        name: string;
        symbol: string;
        circulating?: { peggedUSD?: number };
      }[];
    };
    top = (list.peggedAssets ?? [])
      .map((a) => ({
        name: a.name,
        symbol: a.symbol,
        circulatingUsd: a.circulating?.peggedUSD ?? 0,
      }))
      .filter((a) => a.circulatingUsd > 0)
      .sort((a, b) => b.circulatingUsd - a.circulatingUsd)
      .slice(0, 8);
  }

  const etf = await readSnapshot<EtfSnapshot>("etf");
  const btcFlow = etf?.btc?.latest?.totalUsdM ?? null;
  const ethFlow = etf?.eth?.latest?.totalUsdM ?? null;
  const combined =
    btcFlow != null || ethFlow != null
      ? (btcFlow ?? 0) + (ethFlow ?? 0)
      : null;
  const sum5 =
    etf?.btc?.sum5dUsdM != null || etf?.eth?.sum5dUsdM != null
      ? (etf?.btc?.sum5dUsdM ?? 0) + (etf?.eth?.sum5dUsdM ?? 0)
      : null;

  let fundingBtc: number | null = null;
  let mark = 0;
  if (premRes?.ok) {
    const raw = (await premRes.json()) as
      | { lastFundingRate: string; markPrice: string }
      | { lastFundingRate: string; markPrice: string }[];
    const row = Array.isArray(raw) ? raw[0] : raw;
    if (row) {
      fundingBtc = Number(row.lastFundingRate);
      mark = Number(row.markPrice);
    }
  }

  let oiChange24hPct: number | null = null;
  let oiUsd: number | null = null;
  if (oiRes?.ok) {
    const oi = (await oiRes.json()) as { openInterest: string };
    const contracts = Number(oi.openInterest);
    if (Number.isFinite(contracts) && mark > 0) oiUsd = contracts * mark;
  }

  if (oiHistRes?.ok) {
    const rows = (await oiHistRes.json()) as {
      sumOpenInterestValue: string;
    }[];
    if (rows?.length >= 2) {
      const latest = Number(rows[rows.length - 1].sumOpenInterestValue);
      const dayAgo = Number(rows[0].sumOpenInterestValue);
      if (dayAgo > 0) oiChange24hPct = ((latest - dayAgo) / dayAgo) * 100;
    }
  }

  let longShortRatio: number | null = null;
  if (lsRes?.ok) {
    const rows = (await lsRes.json()) as { longShortRatio: string }[];
    if (rows[0]) longShortRatio = Number(rows[0].longShortRatio);
  }

  const leverageAvailable =
    fundingBtc != null || oiChange24hPct != null || oiUsd != null;

  const { readingPt, readingEn } = buildLiquidityReading({
    totalUsd,
    change7dPct,
    change7dUsd,
    change30dPct,
    combined,
    sum5,
    fundingBtc,
    oiChange24hPct,
    etfAvailable: Boolean(etf?.btc),
  });

  const snap: Omit<LiquiditySnapshot, never> = {
    stables: {
      totalUsd,
      peggedUsd,
      change7dPct,
      change30dPct,
      change7dUsd,
      change30dUsd,
      series,
      context: ctx ? toApiContext(ctx) : null,
      top,
      source: "stablecoins.llama.fi/stablecoincharts/all",
    },
    spot: {
      available: Boolean(etf?.btc),
      etfCombined1dUsdM: combined,
      etfBtc1dUsdM: btcFlow,
      etfEth1dUsdM: ethFlow,
      etfSum5dUsdM: sum5,
      tone: etf?.signal?.tone ?? null,
      signalPt: etf?.signal?.spotBidPt ?? null,
      signalEn: etf?.signal?.spotBidEn ?? null,
      source: "Farside ETF snapshot",
    },
    leverage: {
      available: leverageAvailable,
      fundingBtc,
      fundingBps: fundingBtc != null ? fundingBtc * 10_000 : null,
      oiUsd,
      oiChange24hPct,
      longShortRatio,
      source: "Binance Futures (premiumIndex / openInterest)",
    },
    exchangeFlows: null,
    exchangeFlowsNotePt:
      "Fluxos de exchange (entradas/saídas) omitidos: não há API pública gratuita e fiável sem chave — CryptoQuant, Glassnode e CoinGlass são pagos; proxies de volume spot não substituem netflow.",
    exchangeFlowsNoteEn:
      "Exchange in/out flows omitted: no free, reliable public API without a key — CryptoQuant, Glassnode and CoinGlass are paid; spot volume proxies are not netflow.",
    readingPt,
    readingEn,
    stale: false,
    ingestedAt: new Date().toISOString(),
  };

  await writeSnapshot(
    "liquidity",
    snap,
    "liquidity: stables (DefiLlama) + ETF + Binance leverage",
  );

  await mergeStablecoinIntoHistory(series);

  return { totalUsd, seriesDays: series.length };
}

async function mergeStablecoinIntoHistory(series: SeriesPoint[]) {
  try {
    const prev = await readSnapshot<HistorySnapshot>("history");
    const seriesMap: Partial<Record<HistoryMetricId, HistorySeriesBlob>> = {
      ...(prev?.series ?? {}),
    };
    for (const id of HISTORY_METRIC_IDS) {
      if (!seriesMap[id]) {
        seriesMap[id] = {
          points: [],
          source: METRIC_META[id].bootstrap,
        };
      }
    }
    seriesMap.stablecoin_supply = {
      points: mergeDailyPoints(
        seriesMap.stablecoin_supply?.points ?? [],
        series,
        90,
      ),
      source: METRIC_META.stablecoin_supply.bootstrap,
    };
    await writeSnapshot(
      "history",
      { windowDays: prev?.windowDays ?? 90, series: seriesMap },
      prev?.source ?? "history + stablecoin_supply merge",
    );
  } catch (e) {
    console.warn(
      "[liquidity→history]",
      e instanceof Error ? e.message : e,
    );
  }
}

function buildLiquidityReading(input: {
  totalUsd: number;
  change7dPct: number | null;
  change7dUsd: number | null;
  change30dPct: number | null;
  combined: number | null;
  sum5: number | null;
  fundingBtc: number | null;
  oiChange24hPct: number | null;
  etfAvailable: boolean;
}): { readingPt: string; readingEn: string } {
  const fmtB = (n: number) =>
    n >= 1e12
      ? `${(n / 1e12).toFixed(2)}T`
      : n >= 1e9
        ? `${(n / 1e9).toFixed(1)}B`
        : `${(n / 1e6).toFixed(0)}M`;

  const stablesPt =
    input.change7dPct != null && input.change7dUsd != null
      ? `Oferta agregada de stablecoins em $${fmtB(input.totalUsd)} (${input.change7dPct >= 0 ? "+" : ""}${input.change7dPct.toFixed(2)}% / ${input.change7dUsd >= 0 ? "+" : ""}$${fmtB(Math.abs(input.change7dUsd))} em 7 dias).`
      : `Oferta agregada de stablecoins em $${fmtB(input.totalUsd)}.`;
  const stablesEn =
    input.change7dPct != null && input.change7dUsd != null
      ? `Aggregate stablecoin supply at $${fmtB(input.totalUsd)} (${input.change7dPct >= 0 ? "+" : ""}${input.change7dPct.toFixed(2)}% / ${input.change7dUsd >= 0 ? "+" : ""}$${fmtB(Math.abs(input.change7dUsd))} over 7 days).`
      : `Aggregate stablecoin supply at $${fmtB(input.totalUsd)}.`;

  let spotPt = "";
  let spotEn = "";
  if (input.etfAvailable && input.combined != null) {
    spotPt = ` Spot institucional (ETF BTC+ETH): ${input.combined >= 0 ? "+" : ""}${input.combined.toFixed(0)}M USD no dia`;
    spotEn = ` Institutional spot (BTC+ETH ETF): ${input.combined >= 0 ? "+" : ""}${input.combined.toFixed(0)}M USD on the day`;
    if (input.sum5 != null) {
      spotPt += ` · 5d ${input.sum5 >= 0 ? "+" : ""}${input.sum5.toFixed(0)}M.`;
      spotEn += ` · 5d ${input.sum5 >= 0 ? "+" : ""}${input.sum5.toFixed(0)}M.`;
    } else {
      spotPt += ".";
      spotEn += ".";
    }
  } else {
    spotPt = " Fluxos ETF indisponíveis neste snapshot.";
    spotEn = " ETF flows unavailable in this snapshot.";
  }

  let levPt = "";
  let levEn = "";
  if (input.fundingBtc != null) {
    levPt = ` Alavancagem: funding BTC ${(input.fundingBtc * 100).toFixed(4)}%`;
    levEn = ` Leverage: BTC funding ${(input.fundingBtc * 100).toFixed(4)}%`;
    if (input.oiChange24hPct != null) {
      levPt += ` · OI Δ24h ${input.oiChange24hPct >= 0 ? "+" : ""}${input.oiChange24hPct.toFixed(1)}%.`;
      levEn += ` · OI Δ24h ${input.oiChange24hPct >= 0 ? "+" : ""}${input.oiChange24hPct.toFixed(1)}%.`;
    } else {
      levPt += ".";
      levEn += ".";
    }
  }

  const fuelPt =
    input.change7dPct != null && input.change7dPct > 0.15
      ? " Emissão a subir — mais combustível on-chain no sistema."
      : input.change7dPct != null && input.change7dPct < -0.15
        ? " Oferta a contrair — menos stablecoins em circulação face a 7 dias."
        : "";
  const fuelEn =
    input.change7dPct != null && input.change7dPct > 0.15
      ? " Supply rising — more on-chain fuel in the system."
      : input.change7dPct != null && input.change7dPct < -0.15
        ? " Supply contracting — fewer stables in circulation vs 7 days."
        : "";

  return {
    readingPt: `${stablesPt}${spotPt}${levPt}${fuelPt}`,
    readingEn: `${stablesEn}${spotEn}${levEn}${fuelEn}`,
  };
}

/** Disk-only reader — no upstream. */
export async function fetchLiquiditySnapshot(): Promise<LiquiditySnapshot | null> {
  const snap = await readSnapshot<LiquiditySnapshot>("liquidity");
  if (!snap?.stables?.series?.length) return null;
  return {
    ...snap,
    stale: isSnapshotStale(snap.updatedAt, STALE_MS),
  };
}
