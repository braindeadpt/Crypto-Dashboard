import { ingestEtfSnapshot } from "@/lib/data/etf";
import { ingestLiquiditySnapshot } from "@/lib/data/liquidity";
import { pegDeviationPct } from "@/lib/data/peg";
import { ingestSectorsSnapshot } from "@/lib/data/sectors";
import { flushHealth, recordError, recordOk } from "@/lib/data/health";
import { ingestMarketSnapshot } from "@/lib/data/coingecko";
import { ingestSentimentSnapshot } from "@/lib/data/sentiment";
import { writeSnapshot } from "@/lib/data/snapshotStore";
import type { YieldPool } from "@/lib/data/yields";
import type { DefiSnapshot } from "@/lib/types";
import { ingestHistorySeries } from "@/lib/history/ingest";
import { http } from "@/lib/data/sources";

const LLAMA = http("defillama");
const STABLES = http("defillama_stables");

/** Canonical TVL: DefiLlama /v2/historicalChainTvl last point (reduces double-count). */
export type TvlSource = "historicalChainTvl" | "chainsSum";

/**
 * Heavy ingest — NEVER call from page render.
 * Downloads large DefiLlama payloads + Farside ETF HTML, writes slim snapshots,
 * then refreshes history, liquidity (stables) and sector rotation.
 */
export async function refreshHeavySnapshots(): Promise<{
  yieldsPools: number;
  defiProtocols: number;
  totalTvl: number;
  tvlSource: TvlSource;
  etfOk: boolean;
  marketOk: boolean;
  sentimentOk: boolean;
  historyPoints: number;
  historyBootstrapped: string[];
  sectorsThematic: number;
  sectorsHistoryDays: number;
  liquiditySeriesDays: number;
}> {
  // Each source is isolated: one failure must not stop the others nor
  // overwrite a good snapshot with nothing (writeSnapshot is per-name).
  const [yields, defi, etf, market, sentiment] = await Promise.all([
    ingestYields()
      .then((r) => (recordOk("defillama_yields", r.count), r))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[yields ingest]", msg);
        recordError("defillama_yields", msg);
        return { count: 0 };
      }),
    ingestDefi()
      .then((r) => (recordOk("defillama", r.protocols), r))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[defi ingest]", msg);
        recordError("defillama", msg);
        return { protocols: 0, totalTvl: 0, tvlSource: "chainsSum" as TvlSource };
      }),
    ingestEtfSnapshot()
      .then(() => (recordOk("farside"), true))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[etf ingest]", msg);
        recordError("farside", msg);
        return false;
      }),
    // "Último bom" do render: market/sentiment deixam de ser fixtures (F0.6).
    ingestMarketSnapshot()
      .then((s) => (recordOk("coingecko", s.top.length), true))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[market ingest]", msg);
        recordError("coingecko", msg);
        return false;
      }),
    ingestSentimentSnapshot()
      .then(() => (recordOk("binance_rest"), recordOk("alternative"), true))
      .catch((e) => {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn("[sentiment ingest]", msg);
        recordError("alternative", msg);
        return false;
      }),
  ]);

  // Liquidity after ETF (spot channel reads ETF snapshot).
  let liquiditySeriesDays = 0;
  try {
    const liq = await ingestLiquiditySnapshot();
    liquiditySeriesDays = liq.seriesDays;
    recordOk("defillama_stables", liq.seriesDays);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[liquidity ingest]", msg);
    recordError("defillama_stables", msg);
  }

  // History after liquidity so stablecoin_supply merge is present / can refresh.
  let historyPoints = 0;
  let historyBootstrapped: string[] = [];
  try {
    const hist = await ingestHistorySeries();
    historyPoints = hist.points;
    historyBootstrapped = hist.bootstrapped;
  } catch (e) {
    console.warn(
      "[history ingest]",
      e instanceof Error ? e.message : e,
    );
  }

  let sectorsThematic = 0;
  let sectorsHistoryDays = 0;
  try {
    const sec = await ingestSectorsSnapshot();
    sectorsThematic = sec.thematic;
    sectorsHistoryDays = sec.historyDays;
    recordOk("coingecko", sec.thematic);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn("[sectors ingest]", msg);
    recordError("coingecko", msg);
  }

  // Persiste o rasto de saúde desta corrida (merge com o ficheiro anterior).
  await flushHealth().catch((e) =>
    console.warn("[health]", e instanceof Error ? e.message : e),
  );

  return {
    yieldsPools: yields.count,
    defiProtocols: defi.protocols,
    totalTvl: defi.totalTvl,
    tvlSource: defi.tvlSource,
    etfOk: etf,
    marketOk: market,
    sentimentOk: sentiment,
    historyPoints,
    historyBootstrapped,
    sectorsThematic,
    sectorsHistoryDays,
    liquiditySeriesDays,
  };
}

async function ingestYields(): Promise<{ count: number }> {
  const res = await fetch(`${http("defillama_yields")}/pools`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Yields ingest ${res.status}`);
  const json = (await res.json()) as {
    data: {
      pool: string;
      chain: string;
      project: string;
      symbol: string;
      tvlUsd: number;
      apy: number;
      apyBase?: number;
      apyReward?: number;
      stablecoin?: boolean;
    }[];
  };

  const pools: YieldPool[] = (json.data ?? [])
    .filter(
      (p) =>
        p.tvlUsd >= 1_000_000 &&
        Number.isFinite(p.apy) &&
        p.apy > 0 &&
        p.apy < 500,
    )
    .sort((a, b) => b.apy - a.apy)
    .slice(0, 80)
    .map((p) => ({
      pool: p.pool,
      chain: p.chain,
      project: p.project,
      symbol: p.symbol,
      tvlUsd: p.tvlUsd,
      apy: p.apy,
      apyBase: p.apyBase ?? null,
      apyReward: p.apyReward ?? null,
      stablecoin: Boolean(p.stablecoin),
    }));

  await writeSnapshot(
    "yields",
    {
      pools,
      filters: {
        sort: "apy_desc",
        minTvlUsd: 1_000_000,
        maxApy: 500,
        minApy: 0,
      },
    },
    "yields.llama.fi/pools (reduced, sorted by APY)",
  );
  return { count: pools.length };
}

async function ingestDefi(): Promise<{
  protocols: number;
  totalTvl: number;
  tvlSource: TvlSource;
}> {
  const [protocols, chains, stables, fees, hist] = await Promise.all([
    fetchJson<Protocol[]>(`${LLAMA}/protocols`),
    fetchJson<Chain[]>(`${LLAMA}/v2/chains`),
    fetchJson<StableResponse>(
      `${STABLES}/stablecoins?includePrices=true`,
    ).catch(() => ({ peggedAssets: [] })),
    fetchJson<FeesOverview>(
      `${LLAMA}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
    ).catch(() => null),
    fetchJson<{ date: number; tvl: number }[]>(
      `${LLAMA}/v2/historicalChainTvl`,
    ).catch(() => null),
  ]);

  const sorted = protocols
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      tvl: p.tvl || 0,
      change_1d: p.change_1d ?? null,
      change_7d: p.change_7d ?? null,
      category: p.category ?? "—",
      chains: (p.chains ?? []).slice(0, 6),
    }))
    .filter((p) => p.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl);

  const top = sorted.slice(0, 15);

  let totalTvl: number;
  let tvlSource: TvlSource;
  if (hist && hist.length) {
    totalTvl = hist[hist.length - 1].tvl;
    tvlSource = "historicalChainTvl";
  } else {
    totalTvl = chains.reduce((s, c) => s + (c.tvl || 0), 0);
    tvlSource = "chainsSum";
  }

  const weightedChange = top.reduce(
    (acc, p) => {
      if (p.change_1d == null) return acc;
      return {
        sum: acc.sum + p.change_1d * p.tvl,
        weight: acc.weight + p.tvl,
      };
    },
    { sum: 0, weight: 0 },
  );

  const stablecoins = (stables.peggedAssets || [])
    .map((s) => ({
      name: s.name,
      symbol: s.symbol,
      circulating: s.circulating?.peggedUSD ?? 0,
      pegDeviation: pegDeviationPct(s.price, s.pegType, s.symbol || ""),
    }))
    .filter((s) => s.circulating > 0)
    .sort((a, b) => b.circulating - a.circulating)
    .slice(0, 10);

  const pegWatch = [...stablecoins]
    .filter((s) => s.pegDeviation != null && Math.abs(s.pegDeviation) >= 0.15)
    .sort((a, b) => Math.abs(b.pegDeviation!) - Math.abs(a.pegDeviation!))
    .slice(0, 5);

  const snapshot: Omit<DefiSnapshot, "updatedAt"> & { tvlSource: TvlSource } = {
    totalTvl,
    tvlSource,
    change1d:
      weightedChange.weight > 0
        ? weightedChange.sum / weightedChange.weight
        : null,
    fees24h: fees?.total24h ?? null,
    feesChange1d: fees?.change_1d ?? null,
    protocols: top.map((p) => ({
      name: p.name,
      slug: p.slug,
      tvl: p.tvl,
      change1d: p.change_1d,
      change7d: p.change_7d,
      category: p.category,
      chains: p.chains,
    })),
    chains: [...chains]
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 12)
      .map((c) => ({ name: c.name, tvl: c.tvl })),
    stablecoins,
    pegWatch,
  };

  await writeSnapshot("defi", snapshot, `api.llama.fi TVL=${tvlSource}`);
  return { protocols: top.length, totalTvl, tvlSource };
}

type Protocol = {
  name: string;
  slug: string;
  tvl: number;
  change_1d?: number | null;
  change_7d?: number | null;
  category?: string;
  chains?: string[];
};

type Chain = { name: string; tvl: number };

type StableResponse = {
  peggedAssets: {
    name: string;
    symbol: string;
    pegType?: string;
    circulating?: { peggedUSD?: number };
    price?: number | null;
  }[];
};

type FeesOverview = {
  total24h?: number;
  change_1d?: number | null;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Ingest ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}
