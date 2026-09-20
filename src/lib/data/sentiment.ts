import { fetchFundingRate, fetchOpenInterest } from "@/lib/data/binance";
import { fetchOiChange24hPct } from "@/lib/data/derivatives";
import { fetchFearGreed, fetchFearGreedHistory } from "@/lib/data/feargreed";
import {
  isSnapshotStale,
  readSnapshot,
  writeSnapshot,
} from "@/lib/data/snapshotStore";
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

const SENTIMENT_SNAPSHOT_STALE_MS = 6 * 60 * 60_000;

async function sentimentFromDisk(): Promise<SentimentSnapshot | null> {
  const snap = await readSnapshot<SentimentSnapshot>("sentiment");
  if (!snap?.fearGreed) return null;
  return {
    fearGreed: snap.fearGreed,
    funding: snap.funding,
    openInterest: snap.openInterest,
    fngHistory: snap.fngHistory,
    stale: isSnapshotStale(snap.updatedAt, SENTIMENT_SNAPSHOT_STALE_MS),
    updatedAt: snap.updatedAt,
  };
}

/** Live Binance + Fear&Greed — lança em falha (sem fallback). */
async function fetchSentimentLive(): Promise<SentimentSnapshot> {
  const [fng, funding, oi, oiChg, fngHistory] = await Promise.all([
    fetchFearGreed(),
    fetchFundingRate("BTCUSDT"),
    fetchOpenInterest("BTCUSDT"),
    fetchOiChange24hPct("BTCUSDT").catch(() => null),
    fetchFearGreedHistory(30).catch(() => undefined),
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
    fngHistory,
    updatedAt: new Date().toISOString(),
  };
}

/** Live Binance + Fear&Greed; disk fixture / neutral if upstream fails. */
export async function fetchSentimentSnapshot(): Promise<SentimentSnapshot> {
  try {
    return await fetchSentimentLive();
  } catch {
    return (await sentimentFromDisk()) ?? NEUTRAL_SENTIMENT;
  }
}

/**
 * Ingest: grava o "último bom" em disco (F0.6). Lança em falha.
 */
export async function ingestSentimentSnapshot(): Promise<SentimentSnapshot> {
  const snap = await fetchSentimentLive();
  await writeSnapshot("sentiment", snap, "ingest");
  return snap;
}
