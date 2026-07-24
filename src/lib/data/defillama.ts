import { cachedFetch } from "@/lib/cache";
import type { DefiSnapshot } from "@/lib/types";

const LLAMA = "https://api.llama.fi";
const STABLES = "https://stablecoins.llama.fi";

async function llama<T>(base: string, path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`DefiLlama ${res.status}: ${path}`);
  return res.json() as Promise<T>;
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
    circulating?: { peggedUSD?: number };
    price?: number | null;
  }[];
};

type FeesOverview = {
  total24h?: number;
  change_1d?: number | null;
  protocols?: { name: string; total24h?: number }[];
};

export async function fetchDefiSnapshot(): Promise<DefiSnapshot> {
  return cachedFetch("defi:snapshot", 180_000, async () => {
    const [protocols, chains, stables, fees] = await Promise.all([
      llama<Protocol[]>(LLAMA, "/protocols"),
      llama<Chain[]>(LLAMA, "/v2/chains"),
      llama<StableResponse>(STABLES, "/stablecoins?includePrices=true").catch(
        () => ({ peggedAssets: [] }),
      ),
      llama<FeesOverview>(
        LLAMA,
        "/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true",
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

    const totalTvl = sorted.slice(0, 200).reduce((sum, p) => sum + p.tvl, 0);
    const top = sorted.slice(0, 15);

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
      .map((s) => {
        const price = s.price ?? null;
        const pegDeviation =
          price != null && Number.isFinite(price) ? (price - 1) * 100 : null;
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
      .sort(
        (a, b) => Math.abs(b.pegDeviation!) - Math.abs(a.pegDeviation!),
      )
      .slice(0, 5);

    return {
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
      updatedAt: new Date().toISOString(),
    };
  });
}
