import { fetchFundingRate, fetchOpenInterest } from "@/lib/data/binance";
import { fetchOiChange24hPct } from "@/lib/data/derivatives";
import { fetchFearGreed } from "@/lib/data/feargreed";
import type { SentimentSnapshot } from "@/lib/types";

export async function fetchSentimentSnapshot(): Promise<SentimentSnapshot> {
  const [fng, funding, oi, oiChg] = await Promise.all([
    fetchFearGreed(),
    fetchFundingRate("BTCUSDT"),
    fetchOpenInterest("BTCUSDT"),
    fetchOiChange24hPct("BTCUSDT").catch(() => null),
  ]);

  const fundingBias =
    funding.rate > 0.0001 ? "long" : funding.rate < -0.0001 ? "short" : "neutral";

  return {
    fearGreed: fng,
    funding: {
      rate: funding.rate,
      annualized: funding.annualized,
      bias: fundingBias,
    },
    openInterest: {
      value: oi.value * funding.markPrice,
      change24hPct: oiChg,
    },
    updatedAt: new Date().toISOString(),
  };
}
