import { buildDailyCases } from "@/lib/cases/build";
import { fetchMarketSnapshot } from "@/lib/data/coingecko";
import { fetchCycleSnapshot } from "@/lib/data/cycle";
import { fetchDefiSnapshot } from "@/lib/data/defillama";
import { fetchSentimentSnapshot } from "@/lib/data/sentiment";
import { buildDeterministicBrief } from "@/lib/editorial/brief";
import { computeRegime } from "@/lib/regime/engine";
import type { RegimeResult } from "@/lib/types";

export async function getMarketBundle() {
  const market = await fetchMarketSnapshot();
  return market;
}

export async function getSentimentBundle() {
  return fetchSentimentSnapshot();
}

export async function getRegimeBundle(): Promise<{
  regime: RegimeResult;
  market: Awaited<ReturnType<typeof fetchMarketSnapshot>>;
  sentiment: Awaited<ReturnType<typeof fetchSentimentSnapshot>>;
}> {
  const [market, sentiment] = await Promise.all([
    fetchMarketSnapshot(),
    fetchSentimentSnapshot(),
  ]);

  const regime = computeRegime({
    fearGreed: sentiment.fearGreed.value,
    btcChange24h: market.btc.change24h,
    dominance: market.global.btcDominance,
    fundingRate: sentiment.funding.rate,
    marketCapChange24h: market.global.marketCapChange24h,
    oiChange24hPct: sentiment.openInterest.change24hPct,
  });

  return { regime, market, sentiment };
}

export async function getFrontPageData() {
  const { regime, market, sentiment } = await getRegimeBundle();
  const cases = buildDailyCases(
    [...market.movers.gainers, ...market.movers.losers],
    sentiment,
  );
  const brief = buildDeterministicBrief({ market, regime, sentiment });
  const cycle = await fetchCycleSnapshot().catch(() => null);
  const defi = await fetchDefiSnapshot().catch(() => null);

  return { regime, market, sentiment, cases, brief, cycle, defi };
}

export async function getFullDesk() {
  const front = await getFrontPageData();
  return front;
}
