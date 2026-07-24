import { cachedFetch } from "@/lib/cache";

export type DexHotToken = {
  id: string;
  symbol: string;
  name: string;
  chainId: string;
  url: string;
  priceUsd: number | null;
  change24h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
  source: "dexscreener" | "geckoterminal";
};

export type DexFrenzySnapshot = {
  items: DexHotToken[];
  emphasis: {
    chainId: string;
    labelPt: string;
    labelEn: string;
  };
  notePt: string;
  noteEn: string;
  updatedAt: string;
};

const PRIORITY_CHAINS = ["solana", "robinhood", "base", "ethereum", "bsc"] as const;

function chainLabel(chainId: string, locale: "pt" | "en"): string {
  const map: Record<string, { pt: string; en: string }> = {
    solana: { pt: "Solana", en: "Solana" },
    robinhood: { pt: "Robinhood", en: "Robinhood" },
    base: { pt: "Base", en: "Base" },
    ethereum: { pt: "Ethereum", en: "Ethereum" },
    bsc: { pt: "BSC", en: "BSC" },
  };
  return map[chainId]?.[locale] ?? chainId;
}

async function fetchDexBoosts(): Promise<DexHotToken[]> {
  const res = await fetch("https://api.dexscreener.com/token-boosts/top/v1", {
    next: { revalidate: 120 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as {
    url?: string;
    chainId?: string;
    tokenAddress?: string;
    description?: string;
  }[];

  // Enrich a subset with pair stats
  const top = rows.slice(0, 12);
  const enriched: DexHotToken[] = [];

  await Promise.all(
    top.map(async (row, i) => {
      if (!row.chainId || !row.tokenAddress) return;
      try {
        const pr = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${row.tokenAddress}`,
          { next: { revalidate: 120 }, headers: { Accept: "application/json" } },
        );
        if (!pr.ok) return;
        const json = (await pr.json()) as {
          pairs?: {
            chainId: string;
            url: string;
            baseToken: { symbol: string; name: string; address: string };
            priceUsd?: string;
            priceChange?: { h24?: number };
            volume?: { h24?: number };
            liquidity?: { usd?: number };
          }[];
        };
        const pair =
          json.pairs?.find((p) => p.chainId === row.chainId) ?? json.pairs?.[0];
        if (!pair) return;
        enriched[i] = {
          id: `${pair.chainId}:${pair.baseToken.address}`,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name,
          chainId: pair.chainId,
          url: pair.url || row.url || "",
          priceUsd: pair.priceUsd ? Number(pair.priceUsd) : null,
          change24h: pair.priceChange?.h24 ?? null,
          volume24h: pair.volume?.h24 ?? null,
          liquidityUsd: pair.liquidity?.usd ?? null,
          source: "dexscreener",
        };
      } catch {
        /* skip */
      }
    }),
  );

  return enriched.filter(Boolean);
}

async function fetchGeckoTrending(network: string): Promise<DexHotToken[]> {
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${network}/trending_pools?page=1`,
      { next: { revalidate: 180 }, headers: { Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: {
        id: string;
        attributes?: {
          name?: string;
          base_token_price_usd?: string;
          price_change_percentage?: { h24?: string };
          volume_usd?: { h24?: string };
          reserve_in_usd?: string;
        };
        relationships?: {
          base_token?: { data?: { id?: string } };
        };
      }[];
    };

    return (json.data ?? []).slice(0, 6).map((p) => {
      const name = p.attributes?.name ?? p.id;
      const symbol = name.split(/[\/\s]/)[0] ?? name;
      return {
        id: p.id,
        symbol,
        name,
        chainId: network,
        url: `https://www.geckoterminal.com/${network}/pools/${p.id.split("_").pop()}`,
        priceUsd: p.attributes?.base_token_price_usd
          ? Number(p.attributes.base_token_price_usd)
          : null,
        change24h: p.attributes?.price_change_percentage?.h24
          ? Number(p.attributes.price_change_percentage.h24)
          : null,
        volume24h: p.attributes?.volume_usd?.h24
          ? Number(p.attributes.volume_usd.h24)
          : null,
        liquidityUsd: p.attributes?.reserve_in_usd
          ? Number(p.attributes.reserve_in_usd)
          : null,
        source: "geckoterminal" as const,
      };
    });
  } catch {
    return [];
  }
}

function pickEmphasis(items: DexHotToken[]): DexFrenzySnapshot["emphasis"] {
  const counts = new Map<string, number>();
  for (const it of items) {
    const score =
      (it.volume24h ?? 0) + (it.liquidityUsd ?? 0) * 0.2 + Math.abs(it.change24h ?? 0) * 1e5;
    counts.set(it.chainId, (counts.get(it.chainId) ?? 0) + score);
  }
  let best = "solana";
  let bestScore = -1;
  for (const chain of PRIORITY_CHAINS) {
    const s = counts.get(chain) ?? 0;
    if (s > bestScore) {
      bestScore = s;
      best = chain;
    }
  }
  // If robinhood or solana dominate, say so
  for (const [chain, score] of counts) {
    if (score > bestScore) {
      bestScore = score;
      best = chain;
    }
  }
  return {
    chainId: best,
    labelPt: chainLabel(best, "pt"),
    labelEn: chainLabel(best, "en"),
  };
}

export async function fetchDexFrenzy(): Promise<DexFrenzySnapshot> {
  return cachedFetch("dex:frenzy", 150_000, async () => {
    const [boosts, sol, base, eth] = await Promise.all([
      fetchDexBoosts().catch(() => []),
      fetchGeckoTrending("solana").catch(() => []),
      fetchGeckoTrending("base").catch(() => []),
      fetchGeckoTrending("eth").catch(() => []),
    ]);

    const merged = [...boosts, ...sol, ...base, ...eth];
    const seen = new Set<string>();
    const items: DexHotToken[] = [];
    for (const it of merged.sort(
      (a, b) => (b.volume24h ?? 0) - (a.volume24h ?? 0),
    )) {
      const key = `${it.chainId}:${it.symbol}`.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      items.push(it);
      if (items.length >= 10) break;
    }

    const emphasis = pickEmphasis(items);
    const hot = items.filter(
      (i) => Math.abs(i.change24h ?? 0) > 20 || (i.volume24h ?? 0) > 500_000,
    );

    return {
      items,
      emphasis,
      notePt:
        hot.length >= 3
          ? `Actividade DEX elevada · ênfase em ${emphasis.labelPt} (boosts + trending). Não é a lista CoinGecko — liquidez on-chain.`
          : `Vista multichain sem pico extremo · volume DEX com ênfase em ${emphasis.labelPt}.`,
      noteEn:
        hot.length >= 3
          ? `Active DEX frenzy · ${emphasis.labelEn} emphasis (boosts + trending). Not CoinGecko list — on-chain liquidity.`
          : `Multichain without extreme frenzy · showing DEX volume (${emphasis.labelEn} emphasis).`,
      updatedAt: new Date().toISOString(),
    };
  });
}
