import type { EvidenceChip, MarketPosture, RegimeResult } from "@/lib/types";

export interface RegimeInputs {
  fearGreed: number;
  btcChange24h: number;
  btcChange7d?: number | null;
  dominance: number;
  dominanceDeltaApprox?: number | null;
  fundingRate: number;
  oiChange24hPct?: number | null;
  marketCapChange24h: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function computeRegime(input: RegimeInputs): RegimeResult {
  const absBtc = Math.abs(input.btcChange24h);
  const fundingBps = input.fundingRate * 10000;
  const fng = input.fearGreed;

  let stress = 0;
  // Fear extremes
  if (fng <= 25) stress += 28;
  else if (fng <= 40) stress += 14;
  else if (fng >= 75) stress += 22;
  else if (fng >= 60) stress += 10;

  // Price volatility
  if (absBtc >= 8) stress += 30;
  else if (absBtc >= 4) stress += 18;
  else if (absBtc >= 2) stress += 8;

  // Funding extremes (typical funding ~0.01% = 1e-4)
  if (Math.abs(fundingBps) >= 5) stress += 22;
  else if (Math.abs(fundingBps) >= 2) stress += 12;

  // OI expansion with price move = leverage chase
  if (
    input.oiChange24hPct != null &&
    Math.abs(input.oiChange24hPct) >= 5 &&
    absBtc >= 3
  ) {
    stress += 12;
  }

  // Market-wide
  if (Math.abs(input.marketCapChange24h) >= 5) stress += 10;

  stress = clamp(stress, 0, 100);

  const contradictory =
    (fng <= 30 && input.btcChange24h > 3) ||
    (fng >= 70 && input.btcChange24h < -3) ||
    (fundingBps > 3 && input.btcChange24h < -2) ||
    (fundingBps < -3 && input.btcChange24h > 2);

  let posture: MarketPosture;
  if (contradictory && stress >= 35) posture = "weird";
  else if (stress >= 65) posture = "storm";
  else if (stress >= 35) posture = "unsettled";
  else posture = "calm";

  const receipts: EvidenceChip[] = [
    {
      id: "fng",
      label: "Medo & Ganância",
      labelEn: "Fear & Greed",
      value: `${Math.round(fng)}`,
      tone: fng <= 30 ? "warn" : fng >= 70 ? "down" : "neutral",
    },
    {
      id: "btc24",
      label: "BTC 24h",
      labelEn: "BTC 24h",
      value: `${input.btcChange24h >= 0 ? "+" : ""}${input.btcChange24h.toFixed(2)}%`,
      tone: input.btcChange24h >= 0 ? "up" : "down",
    },
    {
      id: "funding",
      label: "Funding",
      labelEn: "Funding",
      value: `${(input.fundingRate * 100).toFixed(4)}%`,
      tone: Math.abs(fundingBps) >= 2 ? "warn" : "neutral",
    },
  ];

  const summaries: Record<MarketPosture, { pt: string; en: string }> = {
    calm: {
      pt: "Ambiente relativamente estável. Prioriza leitura e contexto, não reacção impulsiva.",
      en: "Relatively stable environment. Use the day to study, not to react.",
    },
    unsettled: {
      pt: "Há tensão no mercado. Lê o resumo e os indicadores antes de concluir.",
      en: "Market tension present. Read the lead and receipts before any conclusion.",
    },
    storm: {
      pt: "Stress elevado. Reduz o ruído, evita FOMO e confirma as causas na análise.",
      en: "Elevated stress. Cut noise, avoid FOMO, confirm causes in the Case File.",
    },
    weird: {
      pt: "Sinais contraditórios. O mercado não apresenta uma leitura limpa — exige evidência.",
      en: "Contradictory signals. Demand evidence before trusting any single metric.",
    },
  };

  const headlines: Record<MarketPosture, { pt: string; en: string }> = {
    calm: {
      pt:
        absBtc < 1.5
          ? "Mercado em compasso de espera — volatilidade contida no Bitcoin."
          : `Bitcoin ${input.btcChange24h >= 0 ? "sobe" : "cede"} ${Math.abs(input.btcChange24h).toFixed(1)}% sem extremos de sentimento.`,
      en:
        absBtc < 1.5
          ? "Market on hold — contained Bitcoin volatility."
          : `Bitcoin ${input.btcChange24h >= 0 ? "rises" : "slips"} ${Math.abs(input.btcChange24h).toFixed(1)}% without sentiment extremes.`,
    },
    unsettled: {
      pt: `Tensão no mercado: BTC ${input.btcChange24h >= 0 ? "+" : ""}${input.btcChange24h.toFixed(1)}% com Medo e Ganância em ${Math.round(fng)}.`,
      en: `Tension building: BTC ${input.btcChange24h >= 0 ? "+" : ""}${input.btcChange24h.toFixed(1)}% with Fear & Greed at ${Math.round(fng)}.`,
    },
    storm: {
      pt: `Regime de stress elevado — BTC ${input.btcChange24h >= 0 ? "+" : ""}${input.btcChange24h.toFixed(1)}% e alavancagem sob pressão.`,
      en: `Storm mode: elevated stress — BTC ${input.btcChange24h >= 0 ? "+" : ""}${input.btcChange24h.toFixed(1)}% with leverage under pressure.`,
    },
    weird: {
      pt: "Leitura inconsistente: preço e sentimento apontam em direcções opostas.",
      en: "Inconsistent story: price and sentiment point in opposite directions.",
    },
  };

  const donts: Record<MarketPosture, { pt: string; en: string }> = {
    calm: {
      pt: "Não inventes um catalisador onde não existe. Estabilidade ≠ oportunidade automática.",
      en: "Don't invent a catalyst where none exists. Boredom ≠ opportunity.",
    },
    unsettled: {
      pt: "Não aumentes o risco só porque o gráfico «parece» decisivo. Abre a análise do movimento.",
      en: "Don't size up just because the chart 'looks' decisive. Open the Case File.",
    },
    storm: {
      pt: "Não compres o pânico nem persigas o pico. Liquidez e funding distorcem sob stress.",
      en: "Don't buy the panic or chase the spike. Liquidity and funding lie under stress.",
    },
    weird: {
      pt: "Não confies numa métrica isolada (Medo e Ganância ou funding). Exige confirmação cruzada.",
      en: "Don't trust a single metric (Fear&Greed or funding). Demand receipts.",
    },
  };

  const lessonByPosture: Record<MarketPosture, string> = {
    calm: "volatilidade",
    unsettled: "funding-rate",
    storm: "liquidacao",
    weird: "medo-e-ganancia",
  };

  return {
    posture,
    score: stress,
    receipts,
    summaryPt: summaries[posture].pt,
    summaryEn: summaries[posture].en,
    headlinePt: headlines[posture].pt,
    headlineEn: headlines[posture].en,
    dontPt: donts[posture].pt,
    dontEn: donts[posture].en,
    lessonSlug: lessonByPosture[posture],
    updatedAt: new Date().toISOString(),
  };
}
