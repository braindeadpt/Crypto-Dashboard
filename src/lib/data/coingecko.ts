import { cachedFetch } from "@/lib/cache";
import type { AssetQuote, MarketSnapshot, Mover } from "@/lib/types";

const CG = "https://api.coingecko.com/api/v3";

async function cg<T>(path: string): Promise<T> {
  const res = await fetch(`${CG}${path}`, {
    next: { revalidate: 60 },
    headers: { Accept: "application/json" },
  });
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
    change24h: c.price_change_percentage_24h ?? 0,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    image: c.image,
    rank: c.market_cap_rank,
  };
}

function inferCause(m: AssetQuote): { pt: string; en: string } {
  const abs = Math.abs(m.change24h);
  if (abs < 2) {
    return {
      pt: "Movimento contido — sem catalisador óbvio no preço.",
      en: "Contained move — no obvious price catalyst.",
    };
  }
  if (m.change24h > 8) {
    return {
      pt: "Rally forte: verificar volume, notícias e funding antes de FOMO.",
      en: "Sharp rally: check volume, news and funding before FOMO.",
    };
  }
  if (m.change24h < -8) {
    return {
      pt: "Queda acentuada: possível liquidação, desbloqueio ou risco de mercado.",
      en: "Sharp drop: possible liquidation, unlock or market-wide risk.",
    };
  }
  if (m.volume24h > m.marketCap * 0.25) {
    return {
      pt: "Volume elevado vs market cap — atenção a fluxo especulativo.",
      en: "High volume vs market cap — watch speculative flow.",
    };
  }
  return {
    pt: "Variação relevante nas últimas 24h — abrir case file para hipóteses.",
    en: "Meaningful 24h move — open a case file for hypotheses.",
  };
}

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  return cachedFetch("market:snapshot", 90_000, async () => {
    const [markets, global] = await Promise.all([
      cg<CgMarket[]>(
        "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false&price_change_percentage=24h",
      ),
      cg<CgGlobal>("/global"),
    ]);

    const quotes = markets.map(toQuote);
    const btc = quotes.find((q) => q.id === "bitcoin") ?? quotes[0];
    const eth = quotes.find((q) => q.id === "ethereum") ?? quotes[1];

    const sorted = [...quotes].sort(
      (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
    );
    const gainers = quotes
      .filter((q) => q.change24h > 0)
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 5)
      .map((q): Mover => {
        const cause = inferCause(q);
        return {
          ...q,
          causePt: cause.pt,
          causeEn: cause.en,
          caseId: `case-${q.id}`,
        };
      });
    const losers = quotes
      .filter((q) => q.change24h < 0)
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 5)
      .map((q): Mover => {
        const cause = inferCause(q);
        return {
          ...q,
          causePt: cause.pt,
          causeEn: cause.en,
          caseId: `case-${q.id}`,
        };
      });

    // Prefer absolute movers for case generation
    void sorted;

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
