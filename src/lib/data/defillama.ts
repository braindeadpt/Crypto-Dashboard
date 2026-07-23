import { cachedFetch } from "@/lib/cache";
import type { DefiSnapshot } from "@/lib/types";

const LLAMA = "https://api.llama.fi";

async function llama<T>(path: string): Promise<T> {
  const res = await fetch(`${LLAMA}${path}`, {
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
  }[];
};

export async function fetchDefiSnapshot(): Promise<DefiSnapshot> {
  return cachedFetch("defi:snapshot", 180_000, async () => {
    const [protocols, chains, stables] = await Promise.all([
      llama<Protocol[]>("/protocols"),
      llama<Chain[]>("/v2/chains"),
      llama<StableResponse>("/stablecoins?includePrices=true").catch(() => ({
        peggedAssets: [],
      })),
    ]);

    // Slim immediately — full /protocols payload is ~11MB
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

    return {
      totalTvl,
      change1d:
        weightedChange.weight > 0
          ? weightedChange.sum / weightedChange.weight
          : null,
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
      stablecoins: (stables.peggedAssets || [])
        .map((s) => ({
          name: s.name,
          symbol: s.symbol,
          circulating: s.circulating?.peggedUSD ?? 0,
        }))
        .filter((s) => s.circulating > 0)
        .sort((a, b) => b.circulating - a.circulating)
        .slice(0, 10),
      updatedAt: new Date().toISOString(),
    };
  });
}
