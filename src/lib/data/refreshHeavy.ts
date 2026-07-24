import { writeSnapshot } from "@/lib/data/snapshotStore";
import type { YieldPool } from "@/lib/data/yields";
import type { DefiSnapshot } from "@/lib/types";

const LLAMA = "https://api.llama.fi";
const STABLES = "https://stablecoins.llama.fi";

/**
 * Heavy ingest — NEVER call from page render.
 * Downloads large DefiLlama payloads, reduces them, writes slim snapshots.
 */
export async function refreshHeavySnapshots(): Promise<{
  yieldsPools: number;
  defiProtocols: number;
}> {
  const [yields, defi] = await Promise.all([
    ingestYields(),
    ingestDefi(),
  ]);
  return { yieldsPools: yields, defiProtocols: defi };
}

async function ingestYields(): Promise<number> {
  const res = await fetch("https://yields.llama.fi/pools", {
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
    { pools },
    "yields.llama.fi/pools (reduced)",
  );
  return pools.length;
}

async function ingestDefi(): Promise<number> {
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
  const totalTvl =
    hist && hist.length
      ? hist[hist.length - 1].tvl
      : chains.reduce((s, c) => s + (c.tvl || 0), 0);

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

  const YIELD_BEARING = new Set([
    "usyc",
    "sdai",
    "susde",
    "susds",
    "ousg",
    "usd0++",
    "wstusr",
  ]);

  const stablecoins = (stables.peggedAssets || [])
    .map((s) => {
      const pegType = s.pegType ?? "";
      const price = s.price ?? null;
      const symbol = (s.symbol || "").toLowerCase();
      const isUsd = pegType === "peggedUSD" || (!pegType && true);
      const yieldBearing = YIELD_BEARING.has(symbol);
      let pegDeviation: number | null = null;
      if (
        isUsd &&
        !yieldBearing &&
        price != null &&
        Number.isFinite(price)
      ) {
        pegDeviation = (price - 1) * 100;
      }
      return {
        name: s.name,
        symbol: s.symbol,
        circulating: s.circulating?.peggedUSD ?? 0,
        pegDeviation,
      };
    })
    .filter((s) => s.circulating > 0)
    .sort((a, b) => b.circulating - a.circulating)
    .slice(0, 10);

  const pegWatch = [...stablecoins]
    .filter((s) => s.pegDeviation != null && Math.abs(s.pegDeviation) >= 0.15)
    .sort((a, b) => Math.abs(b.pegDeviation!) - Math.abs(a.pegDeviation!))
    .slice(0, 5);

  const snapshot: Omit<DefiSnapshot, "updatedAt"> = {
    totalTvl,
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

  await writeSnapshot("defi", snapshot, "api.llama.fi (reduced)");
  return top.length;
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
