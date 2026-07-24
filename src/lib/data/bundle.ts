import { buildDailyCases } from "@/lib/cases/build";
import { fetchCycleSnapshot } from "@/lib/data/cycle";
import { fetchDefiSnapshot } from "@/lib/data/defillama";
import { fetchDerivativesSnapshot } from "@/lib/data/derivatives";
import { fetchEtfSnapshot } from "@/lib/data/etf";
import { fetchMarketSnapshot } from "@/lib/data/coingecko";
import { fetchSentimentSnapshot } from "@/lib/data/sentiment";
import { buildDeterministicBrief } from "@/lib/editorial/brief";
import { computeBreadthPct, computeRegime } from "@/lib/regime/engine";
import type { DefiSnapshot, RegimeResult } from "@/lib/types";

export async function getMarketBundle() {
  return fetchMarketSnapshot();
}

export async function getSentimentBundle() {
  return fetchSentimentSnapshot();
}

export async function getRegimeBundle(): Promise<{
  regime: RegimeResult;
  market: Awaited<ReturnType<typeof fetchMarketSnapshot>>;
  sentiment: Awaited<ReturnType<typeof fetchSentimentSnapshot>>;
  defi: DefiSnapshot | null;
}> {
  const [market, sentiment, etf, derivs, defi] = await Promise.all([
    fetchMarketSnapshot(),
    fetchSentimentSnapshot(),
    fetchEtfSnapshot().catch(() => null),
    fetchDerivativesSnapshot().catch(() => null),
    fetchDefiSnapshot().catch(() => null),
  ]);

  const sol = market.top.find((a) => a.id === "solana");
  const breadthPct = computeBreadthPct(market.top);

  const oiChanges = [derivs?.btc, derivs?.eth, derivs?.sol]
    .map((p) => p?.oiChange24hPct)
    .filter((v): v is number => v != null);
  const oiChangeMaxAbsPct = oiChanges.length
    ? Math.max(...oiChanges.map((v) => Math.abs(v)))
    : sentiment.openInterest.change24hPct;

  const btcFlow = etf?.btc?.latest?.totalUsdM ?? null;
  const ethFlow = etf?.eth?.latest?.totalUsdM ?? null;
  const etfCombinedUsdM =
    btcFlow != null && ethFlow != null ? btcFlow + ethFlow : (btcFlow ?? ethFlow);

  const pegs = (defi?.pegWatch ?? [])
    .map((s) => s.pegDeviation)
    .filter((v): v is number => v != null);
  const maxPegDeviationPct = pegs.length
    ? Math.max(...pegs.map((v) => Math.abs(v)))
    : null;

  const regime = computeRegime({
    fearGreed: sentiment.fearGreed.value,
    btcChange24h: market.btc.change24h,
    ethChange24h: market.eth.change24h,
    solChange24h: sol?.change24h ?? null,
    breadthPct,
    dominance: market.global.btcDominance,
    fundingRate: sentiment.funding.rate,
    marketCapChange24h: market.global.marketCapChange24h,
    oiChange24hPct: sentiment.openInterest.change24hPct,
    oiChangeMaxAbsPct,
    longShortRatio: derivs?.btc?.longShortRatio ?? null,
    etfCombinedUsdM,
    maxPegDeviationPct,
  });

  return { regime, market, sentiment, defi };
}

export async function getFrontPageData() {
  const { regime, market, sentiment, defi } = await getRegimeBundle();
  const cases = buildDailyCases(
    [...market.movers.gainers, ...market.movers.losers],
    sentiment,
  );
  const brief = buildDeterministicBrief({ market, regime, sentiment });
  const cycle = await fetchCycleSnapshot().catch(() => null);

  return { regime, market, sentiment, cases, brief, cycle, defi };
}
