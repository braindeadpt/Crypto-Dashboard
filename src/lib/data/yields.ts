import { cachedFetch } from "@/lib/cache";

export type YieldPool = {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  stablecoin: boolean;
};

export async function fetchTopYieldPools(limit = 40): Promise<{
  pools: YieldPool[];
  updatedAt: string;
}> {
  return cachedFetch("defi:yields:top", 180_000, async () => {
    const res = await fetch("https://yields.llama.fi/pools", {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Yields ${res.status}`);
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

    const pools = (json.data ?? [])
      .filter((p) => p.tvlUsd >= 1_000_000 && Number.isFinite(p.apy) && p.apy > 0 && p.apy < 500)
      .sort((a, b) => b.tvlUsd - a.tvlUsd)
      .slice(0, limit)
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

    return { pools, updatedAt: new Date().toISOString() };
  });
}
