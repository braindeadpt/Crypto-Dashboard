import {
  downsampleSeries,
  fetchBtcHistoryDays,
  fetchMarketSnapshot,
} from "@/lib/data/coingecko";
import type { CyclePricePoint, CycleSnapshot } from "@/lib/types";

/** Approx next halving ~ April 2028 (block 1,050,000) */
const LAST_HALVING = "2024-04-20";
const NEXT_HALVING_ESTIMATE = "2028-04-15";

export async function fetchCycleSnapshot(): Promise<CycleSnapshot> {
  const [market, history1y, historyMax] = await Promise.all([
    fetchMarketSnapshot(),
    fetchBtcHistoryDays(365).catch(() => [] as CyclePricePoint[]),
    fetchBtcHistoryDays("max").catch(() => [] as CyclePricePoint[]),
  ]);

  const price = market.btc.price;
  const prices = history1y.map((h) => h.price);
  const ath = prices.length ? Math.max(...prices, price) : price;
  const athDistancePct = ath > 0 ? ((price - ath) / ath) * 100 : null;
  const priceHistory = downsampleSeries(
    historyMax.length ? historyMax : history1y,
    200,
  );

  const next = new Date(NEXT_HALVING_ESTIMATE);
  const daysLeft = Math.max(
    0,
    Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  // Rough cycle progress since last halving (~1460 days)
  const last = new Date(LAST_HALVING);
  const since = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  const cycleProgressPct = Math.min(100, Math.max(0, (since / 1460) * 100));

  let phase: CycleSnapshot["phase"] = "early";
  if (cycleProgressPct < 25) phase = "early";
  else if (cycleProgressPct < 45) phase = "accumulation";
  else if (cycleProgressPct < 70) phase = "bull";
  else if (cycleProgressPct < 85) phase = "distribution";
  else phase = "bear";

  // Adjust by drawdown from local ATH
  if (athDistancePct != null && athDistancePct < -45) phase = "bear";
  else if (athDistancePct != null && athDistancePct < -20 && phase === "bull")
    phase = "distribution";

  const narratives: Record<
    CycleSnapshot["phase"],
    { pt: string; en: string; labelPt: string; labelEn: string }
  > = {
    early: {
      labelPt: "Início de ciclo",
      labelEn: "Early cycle",
      pt: "Pós-halving recente: oferta nova diminui. O mercado ainda testa narrativas — paciência > previsão.",
      en: "Post-halving early phase: new supply slows. Narratives are still forming — patience over prediction.",
    },
    accumulation: {
      labelPt: "Acumulação",
      labelEn: "Accumulation",
      pt: "Preço lateral com interesse institucional crescente. É fase de estudo, não de heroísmo.",
      en: "Sideways price with growing institutional interest. A study phase, not a hero phase.",
    },
    bull: {
      labelPt: "Mercado em alta",
      labelEn: "Bull market",
      pt: "Expansão de risco e atenção mediática. Historicamente: a euforia chega tarde — a disciplina chega cedo.",
      en: "Risk expansion and media attention. History: euphoria arrives late — discipline arrives early.",
    },
    distribution: {
      labelPt: "Distribuição",
      labelEn: "Distribution",
      pt: "Sinais de cansaço após fortes valorizações. Quem entra tarde paga a educação de quem saiu cedo.",
      en: "Fatigue after strong rallies. Late entrants often pay for early leavers' education.",
    },
    bear: {
      labelPt: "Mercado em baixa",
      labelEn: "Bear market",
      pt: "Desalavancagem e narrativas quebradas. Historicamente, é quando a literacia mais vale a pena.",
      en: "Deleveraging and broken narratives. Historically when literacy pays the most.",
    },
  };

  const n = narratives[phase];

  return {
    phase,
    phaseLabelPt: n.labelPt,
    phaseLabelEn: n.labelEn,
    narrativePt: n.pt,
    narrativeEn: n.en,
    halving: {
      nextEstimate: NEXT_HALVING_ESTIMATE,
      daysLeft,
      blocksLeft: null,
      lastHalving: LAST_HALVING,
    },
    cycleProgressPct,
    athDistancePct,
    priceHistory,
    updatedAt: new Date().toISOString(),
  };
}
