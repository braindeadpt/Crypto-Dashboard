import { annotateMoverCauses, buildDailyCases } from "@/lib/cases/build";
import type { CaseContext } from "@/lib/cases/correlate";
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

function buildCaseContext(input: {
  market: Awaited<ReturnType<typeof fetchMarketSnapshot>>;
  sentiment: Awaited<ReturnType<typeof fetchSentimentSnapshot>>;
  etf: Awaited<ReturnType<typeof fetchEtfSnapshot>> | null;
  derivs: Awaited<ReturnType<typeof fetchDerivativesSnapshot>> | null;
  defi: DefiSnapshot | null;
}): CaseContext {
  const { market, sentiment, etf, derivs, defi } = input;
  const btcFlow = etf?.btc?.latest?.totalUsdM ?? null;
  const ethFlow = etf?.eth?.latest?.totalUsdM ?? null;
  const etfCombinedUsdM =
    btcFlow != null && ethFlow != null ? btcFlow + ethFlow : (btcFlow ?? ethFlow);

  const oiChanges = [derivs?.btc, derivs?.eth, derivs?.sol]
    .map((p) => p?.oiChange24hPct)
    .filter((v): v is number => v != null);

  return {
    sentiment,
    btcChange24h: market.btc.change24h,
    ethChange24h: market.eth.change24h,
    marketCapChange24h: market.global.marketCapChange24h,
    breadthPct: computeBreadthPct(market.top),
    etfCombinedUsdM,
    longShortRatio: derivs?.btc?.longShortRatio ?? null,
    oiChange24hPct: oiChanges.length
      ? oiChanges.reduce((a, b) => (Math.abs(a) > Math.abs(b) ? a : b))
      : sentiment.openInterest.change24hPct,
    defiTvlChange1d: defi?.change1d ?? null,
  };
}

export async function getRegimeBundle(): Promise<{
  regime: RegimeResult;
  market: Awaited<ReturnType<typeof fetchMarketSnapshot>>;
  sentiment: Awaited<ReturnType<typeof fetchSentimentSnapshot>>;
  defi: DefiSnapshot | null;
  caseContext: CaseContext;
}> {
  const [marketRaw, sentiment, etf, derivs, defi] = await Promise.all([
    fetchMarketSnapshot(),
    fetchSentimentSnapshot(),
    fetchEtfSnapshot().catch(() => null),
    fetchDerivativesSnapshot().catch(() => null),
    fetchDefiSnapshot().catch(() => null),
  ]);

  const caseContext = buildCaseContext({
    market: marketRaw,
    sentiment,
    etf,
    derivs,
    defi,
  });

  const market = {
    ...marketRaw,
    movers: {
      gainers: annotateMoverCauses(marketRaw.movers.gainers, caseContext),
      losers: annotateMoverCauses(marketRaw.movers.losers, caseContext),
    },
  };

  const sol = market.top.find((a) => a.id === "solana");
  const oiChanges = [derivs?.btc, derivs?.eth, derivs?.sol]
    .map((p) => p?.oiChange24hPct)
    .filter((v): v is number => v != null);
  const oiChangeMaxAbsPct = oiChanges.length
    ? Math.max(...oiChanges.map((v) => Math.abs(v)))
    : sentiment.openInterest.change24hPct;

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
    breadthPct: caseContext.breadthPct,
    dominance: market.global.btcDominance,
    fundingRate: sentiment.funding.rate,
    marketCapChange24h: market.global.marketCapChange24h,
    oiChange24hPct: sentiment.openInterest.change24hPct,
    oiChangeMaxAbsPct,
    longShortRatio: derivs?.btc?.longShortRatio ?? null,
    etfCombinedUsdM: caseContext.etfCombinedUsdM,
    maxPegDeviationPct,
  });

  return { regime, market, sentiment, defi, caseContext };
}

export async function getFrontPageData() {
  const { regime, market, sentiment, defi, caseContext } =
    await getRegimeBundle();
  const cases = buildDailyCases(
    [...market.movers.gainers, ...market.movers.losers],
    caseContext,
  );
  const brief = buildDeterministicBrief({ market, regime, sentiment });
  const cycle = await fetchCycleSnapshot().catch(() => null);

  return { regime, market, sentiment, cases, brief, cycle, defi, caseContext };
}
