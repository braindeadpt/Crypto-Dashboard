import {
  isSnapshotStale,
  readSnapshot,
} from "@/lib/data/snapshotStore";

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

const STALE_MS = 15 * 60_000;

type YieldsSnap = {
  pools: YieldPool[];
  updatedAt: string;
  source: string;
};

/**
 * Reads slim yields snapshot only — never downloads yields.llama.fi/pools.
 * Refresh via /api/cron/refresh-heavy (or npm run snapshots:refresh).
 */
export async function fetchTopYieldPools(limit = 40): Promise<{
  pools: YieldPool[];
  updatedAt: string;
  stale: boolean;
  source: string;
}> {
  const snap = await readSnapshot<YieldsSnap>("yields");
  if (!snap?.pools?.length) {
    return {
      pools: [],
      updatedAt: "",
      stale: true,
      source: "snapshot-missing",
    };
  }
  return {
    pools: snap.pools.slice(0, limit),
    updatedAt: snap.updatedAt,
    stale: isSnapshotStale(snap.updatedAt, STALE_MS),
    source: snap.source,
  };
}
