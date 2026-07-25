import { readSnapshot, writeSnapshot } from "@/lib/data/snapshotStore";
import type { EtfSnapshot } from "@/lib/data/etf";
import {
  DEFAULT_WINDOW_DAYS,
  type SeriesPoint,
} from "@/lib/stats";
import {
  HISTORY_METRIC_IDS,
  METRIC_META,
  type HistoryMetricId,
  type HistorySeriesBlob,
  type HistorySnapshot,
} from "@/lib/history/metrics";
import {
  appendToday,
  dayKey,
  mergeDailyPoints,
  realizedVolSeries,
} from "@/lib/history/series";

const FAPI = "https://fapi.binance.com";
const CG = "https://api.coingecko.com/api/v3";
const LLAMA = "https://api.llama.fi";
const WINDOW = DEFAULT_WINDOW_DAYS;

function cgHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key =
    process.env.COINGECKO_DEMO_API_KEY ||
    process.env.COINGECKO_API_KEY ||
    "";
  if (key) headers["x-cg-demo-api-key"] = key;
  return headers;
}

async function fetchJson<T>(url: string, headers?: HeadersInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: headers ?? { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}

function emptySeries(id: HistoryMetricId): HistorySeriesBlob {
  return { points: [], source: METRIC_META[id].bootstrap };
}

function getSeries(
  snap: HistorySnapshot | null,
  id: HistoryMetricId,
): HistorySeriesBlob {
  return snap?.series?.[id] ?? emptySeries(id);
}

/**
 * Bootstrap + daily append for central metrics.
 * NEVER call from page render — cron / refresh-heavy / scripts only.
 */
export async function ingestHistorySeries(): Promise<{
  metrics: number;
  points: number;
  bootstrapped: string[];
}> {
  const prev = await readSnapshot<HistorySnapshot>("history");
  const series: Partial<Record<HistoryMetricId, HistorySeriesBlob>> = {
    ...(prev?.series ?? {}),
  };
  const bootstrapped: string[] = [];

  const tasks: {
    id: HistoryMetricId;
    run: () => Promise<{ points: SeriesPoint[]; source: string; bootstrap?: boolean }>;
  }[] = [
    {
      id: "funding_btc",
      run: async () => {
        const rows = await fetchJson<
          { fundingRate: string; fundingTime: number }[]
        >(`${FAPI}/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1000`);
        // Last funding of each UTC day
        const byDay = new Map<string, number>();
        for (const r of rows) {
          const t = dayKey(new Date(r.fundingTime).toISOString());
          byDay.set(t, Number(r.fundingRate));
        }
        const points = [...byDay.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([t, v]) => ({ t, v }));
        return {
          points,
          source: METRIC_META.funding_btc.bootstrap,
          bootstrap: true,
        };
      },
    },
    {
      id: "oi_btc",
      run: async () => {
        const rows = await fetchJson<
          { sumOpenInterestValue: string; timestamp: number }[]
        >(
          `${FAPI}/futures/data/openInterestHist?symbol=BTCUSDT&period=1d&limit=90`,
        );
        const points = rows.map((r) => ({
          t: dayKey(new Date(r.timestamp).toISOString()),
          v: Number(r.sumOpenInterestValue),
        }));
        return {
          points,
          source: METRIC_META.oi_btc.bootstrap,
          bootstrap: true,
        };
      },
    },
    {
      id: "fear_greed",
      run: async () => {
        const json = await fetchJson<{
          data: { value: string; timestamp: string }[];
        }>("https://api.alternative.me/fng/?limit=90");
        const points = (json.data ?? [])
          .map((r) => ({
            t: dayKey(new Date(Number(r.timestamp) * 1000).toISOString()),
            v: Number(r.value),
          }))
          .reverse();
        return {
          points,
          source: METRIC_META.fear_greed.bootstrap,
          bootstrap: true,
        };
      },
    },
    {
      id: "tvl",
      run: async () => {
        const rows = await fetchJson<{ date: number; tvl: number }[]>(
          `${LLAMA}/v2/historicalChainTvl`,
        );
        const points = rows
          .map((r) => ({
            t: dayKey(new Date(r.date * 1000).toISOString()),
            v: r.tvl,
          }))
          .slice(-WINDOW);
        return {
          points,
          source: METRIC_META.tvl.bootstrap,
          bootstrap: true,
        };
      },
    },
    {
      id: "volume_btc",
      run: async () => {
        try {
          const data = await fetchJson<{
            prices: [number, number][];
            total_volumes: [number, number][];
          }>(
            `${CG}/coins/bitcoin/market_chart?vs_currency=usd&days=90`,
            cgHeaders(),
          );
          const volumes = (data.total_volumes ?? []).map(([ts, v]) => ({
            t: dayKey(new Date(ts).toISOString()),
            v,
          }));
          const byDay = new Map<string, number>();
          for (const p of volumes) byDay.set(p.t, p.v);
          const points = [...byDay.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([t, v]) => ({ t, v }));

          const priceByDay = new Map<string, number>();
          for (const [ts, p] of data.prices ?? []) {
            priceByDay.set(dayKey(new Date(ts).toISOString()), p);
          }
          const prices = [...priceByDay.entries()]
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([t, v]) => ({ t, v }));
          storeRealizedVol(prev, series, bootstrapped, prices, METRIC_META.vol_realized_btc.bootstrap);

          return {
            points,
            source: METRIC_META.volume_btc.bootstrap,
            bootstrap: true,
          };
        } catch {
          // CoinGecko rate-limits freely — Binance 1d klines as honest fallback
          const raw = await fetchJson<(string | number)[][]>(
            "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=90",
          );
          const prices: SeriesPoint[] = [];
          const points: SeriesPoint[] = [];
          for (const k of raw) {
            const t = dayKey(new Date(Number(k[0])).toISOString());
            prices.push({ t, v: Number(k[4]) });
            points.push({ t, v: Number(k[7]) }); // quote volume USD
          }
          storeRealizedVol(
            prev,
            series,
            bootstrapped,
            prices,
            "Binance BTCUSDT 1d klines (CG unavailable)",
          );
          return {
            points,
            source: "Binance BTCUSDT 1d quote volume (CG unavailable)",
            bootstrap: true,
          };
        }
      },
    },
    {
      id: "etf_btc_flow",
      run: async () => {
        const etf = await readSnapshot<EtfSnapshot>("etf");
        const hist = etf?.btc?.history ?? [];
        const points = hist.map((d) => ({
          t: dayKey(d.date),
          v: d.totalUsdM,
        }));
        return {
          points,
          source: etf?.btc?.source ?? METRIC_META.etf_btc_flow.bootstrap,
          bootstrap: points.length > 0,
        };
      },
    },
  ];

  for (const task of tasks) {
    try {
      const result = await task.run();
      const prevBlob = getSeries(prev, task.id);
      series[task.id] = {
        points: mergeDailyPoints(prevBlob.points, result.points, WINDOW),
        source: result.source,
      };
      if (result.bootstrap) bootstrapped.push(task.id);
    } catch (e) {
      console.warn(
        `[history ingest] ${task.id}`,
        e instanceof Error ? e.message : e,
      );
      if (!series[task.id]) series[task.id] = getSeries(prev, task.id);
    }
  }

  // Daily append-only metrics (no full historical API on free tier)
  try {
    await appendLivePoints(prev, series);
  } catch (e) {
    console.warn(
      "[history ingest] live append",
      e instanceof Error ? e.message : e,
    );
  }

  // Ensure all keys exist
  for (const id of HISTORY_METRIC_IDS) {
    if (!series[id]) series[id] = getSeries(prev, id);
  }

  const payload: HistorySnapshot = {
    windowDays: WINDOW,
    series,
  };

  await writeSnapshot("history", payload, "history ingest (cron/heavy)");

  const points = HISTORY_METRIC_IDS.reduce(
    (n, id) => n + (series[id]?.points.length ?? 0),
    0,
  );

  return {
    metrics: HISTORY_METRIC_IDS.length,
    points,
    bootstrapped: [...new Set(bootstrapped)],
  };
}

function storeRealizedVol(
  prev: (HistorySnapshot & { updatedAt?: string }) | null,
  series: Partial<Record<HistoryMetricId, HistorySeriesBlob>>,
  bootstrapped: string[],
  prices: SeriesPoint[],
  source: string,
) {
  const volPoints = realizedVolSeries(prices, 30);
  series.vol_realized_btc = {
    points: mergeDailyPoints(
      getSeries(prev, "vol_realized_btc").points,
      volPoints,
      WINDOW,
    ),
    source,
  };
  bootstrapped.push("vol_realized_btc");
}

async function appendLivePoints(
  prev: (HistorySnapshot & { updatedAt?: string }) | null,
  series: Partial<Record<HistoryMetricId, HistorySeriesBlob>>,
) {
  const [markets, global, fees] = await Promise.all([
    fetchJson<
      { price_change_percentage_24h: number | null }[]
    >(
      `${CG}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=1&sparkline=false`,
      cgHeaders(),
    ).catch(() => null),
    fetchJson<{
      data: { market_cap_percentage: { btc: number } };
    }>(`${CG}/global`, cgHeaders()).catch(() => null),
    fetchJson<{ fastestFee: number }>(
      "https://mempool.space/api/v1/fees/recommended",
    ).catch(() => null),
  ]);

  if (markets?.length) {
    const green = markets.filter(
      (m) => (m.price_change_percentage_24h ?? 0) >= 0,
    ).length;
    const breadth = Math.round((green / markets.length) * 100);
    series.breadth = {
      points: appendToday(getSeries(prev, "breadth").points, breadth, WINDOW),
      source: METRIC_META.breadth.bootstrap,
    };
  }

  if (global?.data?.market_cap_percentage?.btc != null) {
    series.btc_dominance = {
      points: appendToday(
        getSeries(prev, "btc_dominance").points,
        global.data.market_cap_percentage.btc,
        WINDOW,
      ),
      source: METRIC_META.btc_dominance.bootstrap,
    };
  }

  if (fees?.fastestFee != null) {
    series.fee_btc = {
      points: appendToday(
        getSeries(prev, "fee_btc").points,
        fees.fastestFee,
        WINDOW,
      ),
      source: METRIC_META.fee_btc.bootstrap,
    };
  }
}
