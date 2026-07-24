import {
  isSnapshotStale,
  readSnapshot,
} from "@/lib/data/snapshotStore";
import { pegDeviationPct } from "@/lib/data/peg";
import type { DefiSnapshot } from "@/lib/types";

const STALE_MS = 15 * 60_000;
const LLAMA = "https://api.llama.fi";
const STABLES = "https://stablecoins.llama.fi";

/**
 * Prefer slim disk snapshot (from heavy ingest). Fallback: light endpoints only
 * (chains + stables + fees + historical TVL) — never /protocols on the render path.
 */
export async function fetchDefiSnapshot(): Promise<DefiSnapshot | null> {
  const snap = await readSnapshot<DefiSnapshot>("defi");
  if (snap && !isSnapshotStale(snap.updatedAt, STALE_MS * 4)) {
    return snap;
  }

  try {
    return await fetchLightDefi();
  } catch {
    return snap ?? null;
  }
}

async function fetchLightDefi(): Promise<DefiSnapshot> {
  const [chains, stables, fees, hist] = await Promise.all([
    lightJson<{ name: string; tvl: number }[]>(`${LLAMA}/v2/chains`),
    lightJson<{
      peggedAssets: {
        name: string;
        symbol: string;
        pegType?: string;
        circulating?: { peggedUSD?: number };
        price?: number | null;
      }[];
    }>(`${STABLES}/stablecoins?includePrices=true`).catch(() => ({
      peggedAssets: [],
    })),
    lightJson<{ total24h?: number; change_1d?: number | null }>(
      `${LLAMA}/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true`,
    ).catch(() => null),
    lightJson<{ date: number; tvl: number }[]>(
      `${LLAMA}/v2/historicalChainTvl`,
    ).catch(() => null),
  ]);

  const totalTvl =
    hist && hist.length
      ? hist[hist.length - 1].tvl
      : chains.reduce((s, c) => s + (c.tvl || 0), 0);

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

  return {
    totalTvl,
    change1d: null,
    fees24h: fees?.total24h ?? null,
    feesChange1d: fees?.change_1d ?? null,
    protocols: [],
    chains: [...chains]
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 12)
      .map((c) => ({ name: c.name, tvl: c.tvl })),
    stablecoins,
    pegWatch,
    updatedAt: new Date().toISOString(),
  };
}

async function lightJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: 300 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`DefiLlama light ${res.status}: ${url}`);
  return res.json() as Promise<T>;
}
