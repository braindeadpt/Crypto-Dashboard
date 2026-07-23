import type { BriefItem, MarketSnapshot, RegimeResult, SentimentSnapshot } from "@/lib/types";

/**
 * Deterministic editorial brief builder.
 * When OPENAI_API_KEY is set, /api/brief/generate can enrich this via LLM.
 * MVP always has a high-quality structured brief without requiring a key.
 */
export function buildDeterministicBrief(args: {
  market: MarketSnapshot;
  regime: RegimeResult;
  sentiment: SentimentSnapshot;
}): BriefItem {
  const { market, regime, sentiment } = args;
  const topMover =
    [...market.movers.gainers, ...market.movers.losers].sort(
      (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
    )[0] ?? market.btc;

  return {
    id: `brief-${new Date().toISOString().slice(0, 10)}`,
    fact: `BTC ${market.btc.change24h >= 0 ? "+" : ""}${market.btc.change24h.toFixed(2)}% · Medo & Ganância ${sentiment.fearGreed.value} (${sentiment.fearGreed.classification}) · Dominância ${market.global.btcDominance.toFixed(1)}%. Maior movimento absoluto: ${topMover.symbol} ${topMover.change24h >= 0 ? "+" : ""}${topMover.change24h.toFixed(2)}%.`,
    whyItMattersPt: `${regime.headlinePt} A postura actual (${regime.posture}) resume stress ${regime.score}/100. Para um detentor de longo prazo, o valor está em separar ruído de catalisador — não em reagir a cada candle.`,
    whyItMattersEn: `${regime.headlineEn} Current posture (${regime.posture}) summarises stress ${regime.score}/100. For a long-term holder, the job is separating noise from catalyst — not reacting to every candle.`,
    uncertainty:
      "Funding e liquidações são proxies; notícias de última hora e fluxos ETF podem invalidar a leitura intraday.",
    watchNext:
      "Funding BTC, variação de dominância em 24h, e se o maior mover confirma volume ou é thin-liquidity noise.",
    sources: [
      { title: "CoinGecko Global", url: "https://www.coingecko.com/" },
      { title: "Alternative.me Fear & Greed", url: "https://alternative.me/crypto/fear-and-greed-index/" },
      { title: "Binance Futures", url: "https://www.binance.com/en/futures/BTCUSDT" },
    ],
    credibilityTier: "B",
    relatedMetrics: ["fear-greed", "btc-dominance", "funding-rate"],
    generatedAt: new Date().toISOString(),
  };
}

export const CURATED_RSS = [
  {
    name: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    lang: "en",
    tier: "B" as const,
  },
  {
    name: "Cointelegraph Brasil",
    url: "https://cointelegraph.com/rss/tag/brazil",
    lang: "pt",
    tier: "B" as const,
  },
];

export const CURATED_X_ACCOUNTS = [
  { handle: "BitcoinMagazine", tier: "B" as const, focus: "BTC" },
  { handle: "ECB", tier: "A" as const, focus: "EU macro" },
  { handle: "CMVM_Informacao", tier: "A" as const, focus: "Portugal regulator" },
  { handle: "whale_alert", tier: "C" as const, focus: "flows" },
];
