import { cachedFetch } from "@/lib/cache";
import { readSnapshot } from "@/lib/data/snapshotStore";
import type { AssetQuote, MarketSnapshot, Mover, TrendingCoin } from "@/lib/types";

const CG = "https://api.coingecko.com/api/v3";

function cgHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key =
    process.env.COINGECKO_DEMO_API_KEY ||
    process.env.COINGECKO_API_KEY ||
    "";
  if (key) headers["x-cg-demo-api-key"] = key;
  return headers;
}

async function cg<T>(path: string, attempt = 0): Promise<T> {
  const res = await fetch(`${CG}${path}`, {
    next: { revalidate: 60 },
    headers: cgHeaders(),
  });
  if (res.status === 429 && attempt < 3) {
    await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
    return cg(path, attempt + 1);
  }
  if (!res.ok) {
    throw new Error(`CoinGecko ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

type CgMarket = {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  price_change_percentage_1h_in_currency?: number | null;
  price_change_percentage_24h_in_currency?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
};

type CgGlobal = {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_percentage: { btc: number; eth: number };
    market_cap_change_percentage_24h_usd: number;
  };
};

function toQuote(c: CgMarket): AssetQuote {
  return {
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.current_price,
    change1h: c.price_change_percentage_1h_in_currency ?? null,
    change24h:
      c.price_change_percentage_24h_in_currency ??
      c.price_change_percentage_24h ??
      0,
    change7d: c.price_change_percentage_7d_in_currency ?? null,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    image: c.image,
    rank: c.market_cap_rank,
  };
}

/** Causes are annotated later via case correlation in the bundle — no template catalysts. */
function toMover(q: AssetQuote): Mover {
  return {
    ...q,
    causePt: "A cruzar com funding, OI, amplitude e ETF…",
    causeEn: "Cross-checking funding, OI, breadth and ETF…",
    caseId: `case-${q.id}`,
  };
}

function fromMarketSnapshotFile(
  snap: MarketSnapshot & { source?: string },
): MarketSnapshot {
  return {
    btc: snap.btc,
    eth: snap.eth,
    global: snap.global,
    movers: snap.movers,
    top: snap.top,
    updatedAt: snap.updatedAt,
  };
}

/**
 * Live CoinGecko first; disk fixture on rate-limit / outage so Agora still
 * renders ritual + Pulso (CI GitHub runners often get 429).
 */
export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  return cachedFetch("market:snapshot", 90_000, async () => {
    try {
      const [markets, global] = await Promise.all([
        cg<CgMarket[]>(
          "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d",
        ),
        cg<CgGlobal>("/global"),
      ]);

      const quotes = markets.map(toQuote);
      const btc = quotes.find((q) => q.id === "bitcoin") ?? quotes[0];
      const eth = quotes.find((q) => q.id === "ethereum") ?? quotes[1];

      const gainers = quotes
        .filter((q) => q.change24h > 0)
        .sort((a, b) => b.change24h - a.change24h)
        .slice(0, 5)
        .map(toMover);
      const losers = quotes
        .filter((q) => q.change24h < 0)
        .sort((a, b) => a.change24h - b.change24h)
        .slice(0, 5)
        .map(toMover);

      return {
        btc,
        eth,
        global: {
          totalMarketCap: global.data.total_market_cap.usd,
          totalVolume: global.data.total_volume.usd,
          btcDominance: global.data.market_cap_percentage.btc,
          ethDominance: global.data.market_cap_percentage.eth,
          marketCapChange24h: global.data.market_cap_change_percentage_24h_usd,
        },
        movers: { gainers, losers },
        top: quotes.slice(0, 25),
        updatedAt: new Date().toISOString(),
      };
    } catch (err) {
      const snap = await readSnapshot<MarketSnapshot>("market");
      if (snap?.btc && snap?.eth) return fromMarketSnapshotFile(snap);
      throw err;
    }
  });
}

export async function fetchTrendingCoins(): Promise<TrendingCoin[]> {
  return cachedFetch("market:trending", 180_000, async () => {
    try {
      const data = await cg<{
        coins: {
          item: {
            id: string;
            name: string;
            symbol: string;
            market_cap_rank: number | null;
            score: number;
            data?: {
              price_change_percentage_24h?: { usd?: number };
            };
          };
        }[];
      }>("/search/trending");

      return (data.coins ?? []).slice(0, 8).map((c) => ({
        id: c.item.id,
        name: c.item.name,
        symbol: c.item.symbol.toUpperCase(),
        rank: c.item.market_cap_rank,
        score: c.item.score,
        change24h: c.item.data?.price_change_percentage_24h?.usd ?? null,
      }));
    } catch {
      return [];
    }
  });
}

export async function fetchBtcHistoryDays(days = 365) {
  return cachedFetch(`market:btc-history:${days}`, 600_000, async () => {
    const data = await cg<{ prices: [number, number][] }>(
      `/coins/bitcoin/market_chart?vs_currency=usd&days=${days}`,
    );
    return data.prices.map(([t, p]) => ({ time: t, price: p }));
  });
}

/** Quotes for arbitrary CoinGecko ids (watchlist). Max ~50 ids. */
export async function fetchMarketsByIds(ids: string[]): Promise<AssetQuote[]> {
  const clean = [...new Set(ids.map((id) => id.trim().toLowerCase()).filter(Boolean))];
  if (!clean.length) return [];
  const key = `market:ids:${clean.slice().sort().join(",")}`;
  return cachedFetch(key, 90_000, async () => {
    try {
      const markets = await cg<CgMarket[]>(
        `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(clean.join(","))}&order=market_cap_desc&sparkline=false&price_change_percentage=1h%2C24h%2C7d`,
      );
      return markets.map(toQuote);
    } catch {
      return [];
    }
  });
}

export type CoinSearchHit = {
  id: string;
  symbol: string;
  name: string;
  marketCapRank: number | null;
};

export async function searchCoins(query: string, limit = 8): Promise<CoinSearchHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  return cachedFetch(`market:search:${q.toLowerCase()}`, 120_000, async () => {
    try {
      const data = await cg<{
        coins: {
          id: string;
          name: string;
          symbol: string;
          market_cap_rank: number | null;
        }[];
      }>(`/search?query=${encodeURIComponent(q)}`);
      return (data.coins ?? []).slice(0, limit).map((c) => ({
        id: c.id,
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        marketCapRank: c.market_cap_rank,
      }));
    } catch {
      return [];
    }
  });
}

/** Memecoins by volume — CoinGecko category (≠ DEX liquidity). */
export async function fetchMemeMarkets(perPage = 30): Promise<AssetQuote[]> {
  return cachedFetch("market:memes", 150_000, async () => {
    try {
      const markets = await cg<CgMarket[]>(
        `/coins/markets?vs_currency=usd&category=meme-token&order=volume_desc&per_page=${perPage}&page=1&sparkline=false&price_change_percentage=1h%2C24h%2C7d`,
      );
      return markets.map(toQuote);
    } catch {
      return [];
    }
  });
}
