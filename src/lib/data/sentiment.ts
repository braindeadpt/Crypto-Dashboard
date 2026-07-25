import { fetchFundingRate, fetchOpenInterest } from "@/lib/data/binance";
import { fetchOiChange24hPct } from "@/lib/data/derivatives";
import { fetchFearGreed } from "@/lib/data/feargreed";
import { readSnapshot } from "@/lib/data/snapshotStore";
import type { SentimentSnapshot } from "@/lib/types";

const NEUTRAL_SENTIMENT: SentimentSnapshot = {
  fearGreed: {
    value: 50,
    classification: "Neutral",
    timestamp: new Date(0).toISOString(),
  },
  funding: { rate: 0, annualized: 0, bias: "neutral" },
  openInterest: { value: 0, change24hPct: null },
  updatedAt: new Date(0).toISOString(),
};

async function sentimentFromDisk(): Promise<SentimentSnapshot | null> {
  const snap = await readSnapshot<SentimentSnapshot>("sentiment");
  if (!snap?.fearGreed) return null;
  return {
    fearGreed: snap.fearGreed,
    funding: snap.funding,
    openInterest: snap.openInterest,
    updatedAt: snap.updatedAt,
  };
}

/** Live Binance + Fear&Greed; disk fixture / neutral if upstream fails. */
export async function fetchSentimentSnapshot(): Promise<SentimentSnapshot> {
  try {
    const [fng, funding, oi, oiChg] = await Promise.all([
      fetchFearGreed(),
      fetchFundingRate("BTCUSDT"),
      fetchOpenInterest("BTCUSDT"),
      fetchOiChange24hPct("BTCUSDT").catch(() => null),
    ]);

    const fundingBias =
      funding.rate > 0.0001
        ? "long"
        : funding.rate < -0.0001
          ? "short"
          : "neutral";

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
  } catch {
    return (await sentimentFromDisk()) ?? NEUTRAL_SENTIMENT;
  }
}
