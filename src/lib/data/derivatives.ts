import { cachedFetch } from "@/lib/cache";
import {
  fetchFundingRate,
  fetchForceOrders,
  fetchOpenInterest,
} from "@/lib/data/binance";

const FAPI = "https://fapi.binance.com";

export type PerpSymbol = "BTCUSDT" | "ETHUSDT" | "SOLUSDT";

export type PerpMetrics = {
  symbol: PerpSymbol;
  fundingRate: number;
  fundingAnnualized: number;
  fundingBias: "long" | "short" | "neutral";
  markPrice: number;
  openInterestUsd: number;
  oiChange24hPct: number | null;
  longShortRatio: number | null;
  longAccount: number | null;
  shortAccount: number | null;
};

export type DerivativesSnapshot = {
  perps: PerpMetrics[];
  btc: PerpMetrics;
  eth: PerpMetrics | null;
  sol: PerpMetrics | null;
  forceNotionalBtc: number;
  updatedAt: string;
};

async function fapi<T>(path: string): Promise<T> {
  const res = await fetch(`${FAPI}${path}`, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Binance ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchLongShortRatio(symbol: PerpSymbol) {
  return cachedFetch(`binance:ls:${symbol}`, 90_000, async () => {
    const rows = await fapi<
      {
        symbol: string;
        longAccount: string;
        shortAccount: string;
        longShortRatio: string;
        timestamp: number;
      }[]
    >(
      `/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`,
    );
    const row = rows[0];
    if (!row) return null;
    return {
      ratio: Number(row.longShortRatio),
      longAccount: Number(row.longAccount),
      shortAccount: Number(row.shortAccount),
    };
  });
}

/** OI change over ~24h using 1h history buckets. */
export async function fetchOiChange24hPct(symbol: PerpSymbol) {
  return cachedFetch(`binance:oi-chg:${symbol}`, 90_000, async () => {
    try {
      const rows = await fapi<{ sumOpenInterestValue: string; timestamp: number }[]>(
        `/futures/data/openInterestHist?symbol=${symbol}&period=1h&limit=25`,
      );
      if (!rows || rows.length < 2) return null;
      const latest = Number(rows[rows.length - 1].sumOpenInterestValue);
      const dayAgo = Number(rows[0].sumOpenInterestValue);
      if (!Number.isFinite(latest) || !Number.isFinite(dayAgo) || dayAgo <= 0) {
        return null;
      }
      return ((latest - dayAgo) / dayAgo) * 100;
    } catch {
      return null;
    }
  });
}

async function fetchPerpMetrics(symbol: PerpSymbol): Promise<PerpMetrics> {
  const [funding, oi, ls, oiChg] = await Promise.all([
    fetchFundingRate(symbol),
    fetchOpenInterest(symbol),
    fetchLongShortRatio(symbol).catch(() => null),
    fetchOiChange24hPct(symbol).catch(() => null),
  ]);

  const bias: PerpMetrics["fundingBias"] =
    funding.rate > 0.0001 ? "long" : funding.rate < -0.0001 ? "short" : "neutral";

  return {
    symbol,
    fundingRate: funding.rate,
    fundingAnnualized: funding.annualized,
    fundingBias: bias,
    markPrice: funding.markPrice,
    openInterestUsd: oi.value * funding.markPrice,
    oiChange24hPct: oiChg,
    longShortRatio: ls?.ratio ?? null,
    longAccount: ls?.longAccount ?? null,
    shortAccount: ls?.shortAccount ?? null,
  };
}

export async function fetchDerivativesSnapshot(): Promise<DerivativesSnapshot> {
  return cachedFetch("derivs:multi", 90_000, async () => {
    const [btc, eth, sol, force] = await Promise.all([
      fetchPerpMetrics("BTCUSDT"),
      fetchPerpMetrics("ETHUSDT").catch(() => null),
      fetchPerpMetrics("SOLUSDT").catch(() => null),
      fetchForceOrders("BTCUSDT", 80).catch(() => []),
    ]);

    const forceNotionalBtc = force.reduce((s, f) => s + f.notional, 0);
    const perps = [btc, eth, sol].filter(Boolean) as PerpMetrics[];

    return {
      perps,
      btc,
      eth,
      sol,
      forceNotionalBtc,
      updatedAt: new Date().toISOString(),
    };
  });
}
