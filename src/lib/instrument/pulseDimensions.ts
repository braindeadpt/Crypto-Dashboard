import type { MetricContextApi } from "@/lib/history/context";
import type { HistoryMetricId } from "@/lib/history/metrics";
import { METRIC_META } from "@/lib/history/metrics";
import type { RegimeResult } from "@/lib/types";

/** Fixed pulse axes — each backed by D2 history + regime contributor family. */
export const PULSE_DIMENSION_IDS = [
  "breadth",
  "funding",
  "sentiment",
  "oi",
  "liquidity",
  "volatility",
] as const;

export type PulseDimensionId = (typeof PULSE_DIMENSION_IDS)[number];

export type PulseDimension = {
  id: PulseDimensionId;
  /** Maps to history metric for percentile */
  historyId: HistoryMetricId;
  /** Regime contributor id(s) that justify this axis */
  contributorIds: string[];
  labelPt: string;
  labelEn: string;
  explainPt: string;
  explainEn: string;
  /** 0–1 radius; null = insufficient sample */
  radius: number | null;
  percentile: number | null;
  value: number | null;
  sampleDays: number;
  classification: string;
  source: string;
  /** Points from regime engine for this family (0 if quiet) */
  stressPoints: number;
};

const AXIS: {
  id: PulseDimensionId;
  historyId: HistoryMetricId;
  contributorIds: string[];
  labelPt: string;
  labelEn: string;
  explainPt: string;
  explainEn: string;
}[] = [
  {
    id: "breadth",
    historyId: "breadth",
    contributorIds: ["breadth", "dispersion"],
    labelPt: "Amplitude",
    labelEn: "Breadth",
    explainPt:
      "Quantos activos do top sobem juntos. Amplitude estreita = tape frágil.",
    explainEn:
      "How many top assets rise together. Narrow breadth = fragile tape.",
  },
  {
    id: "funding",
    historyId: "funding_btc",
    contributorIds: ["funding", "ls"],
    labelPt: "Alavancagem",
    labelEn: "Leverage",
    explainPt:
      "Funding BTC — custo de manter posição alavancada. Extremos = multidão num lado.",
    explainEn:
      "BTC funding — cost of holding leveraged exposure. Extremes = crowded side.",
  },
  {
    id: "sentiment",
    historyId: "fear_greed",
    contributorIds: ["fng"],
    labelPt: "Sentimento",
    labelEn: "Sentiment",
    explainPt:
      "Medo & Ganância. Extremos de medo ou ganância pesam no stress do regime.",
    explainEn:
      "Fear & Greed. Extreme fear or greed adds to regime stress.",
  },
  {
    id: "oi",
    historyId: "oi_btc",
    contributorIds: ["oi"],
    // "OI" e não "Open interest": o rótulo vive na aresta do instrumento, e a
    // sigla é a forma corrente no resto do produto (tape, painel de derivados).
    labelPt: "OI",
    labelEn: "OI",
    explainPt:
      "Contratos em aberto (BTC). OI elevado na distribuição = mais combustível de liquidação.",
    explainEn:
      "BTC open interest. High in the distribution = more liquidation fuel.",
  },
  {
    id: "liquidity",
    historyId: "etf_btc_flow",
    contributorIds: ["etf", "peg"],
    labelPt: "Liquidez",
    labelEn: "Liquidity",
    explainPt:
      "Fluxos ETF spot BTC — procura institucional no spot (quando a série existe).",
    explainEn:
      "BTC spot ETF flows — institutional spot demand (when the series exists).",
  },
  {
    id: "volatility",
    historyId: "vol_realized_btc",
    contributorIds: ["btc24", "mcap"],
    labelPt: "Volatilidade",
    labelEn: "Volatility",
    explainPt:
      "Volatilidade realizada do BTC (anualizada). Alta na distribuição = mercado nervoso.",
    explainEn:
      "BTC realized volatility (annualized). High in the window = jumpy market.",
  },
];

/**
 * Build pulse axes from D2 contexts + regime contributor weights.
 * Never invents percentiles — insufficient samples → radius null.
 */
export function buildPulseDimensions(
  hist: Partial<Record<HistoryMetricId, MetricContextApi>>,
  regime: RegimeResult,
): PulseDimension[] {
  const pointsById = new Map(
    (regime.contributors ?? []).map((c) => [c.id, c.points]),
  );

  return AXIS.map((axis) => {
    const ctx = hist[axis.historyId];
    const stressPoints = axis.contributorIds.reduce(
      (s, id) => s + (pointsById.get(id) ?? 0),
      0,
    );
    const ok =
      ctx &&
      ctx.percentil != null &&
      ctx.classificação !== "insufficient" &&
      ctx.diasDeAmostra >= 7;

    return {
      id: axis.id,
      historyId: axis.historyId,
      contributorIds: axis.contributorIds,
      labelPt: axis.labelPt,
      labelEn: axis.labelEn,
      explainPt: axis.explainPt,
      explainEn: axis.explainEn,
      radius: ok ? ctx!.percentil! / 100 : null,
      percentile: ok ? ctx!.percentil! : null,
      value: ctx?.valor ?? null,
      sampleDays: ctx?.diasDeAmostra ?? 0,
      classification: ctx?.classificação ?? "insufficient",
      source: METRIC_META[axis.historyId].bootstrap,
      stressPoints,
    };
  });
}

/** Silhouette signature for shareable recognition by posture. */
export function pulseShapeHint(
  posture: RegimeResult["posture"],
  locale: "pt" | "en",
): string {
  if (locale === "pt") {
    switch (posture) {
      case "calm":
        return "Silhueta compacta — pouca distância ao centro.";
      case "unsettled":
        return "Silhueta irregular — alguns eixos esticados.";
      case "storm":
        return "Silhueta espicular — vários eixos no extremo da distribuição.";
      case "weird":
        return "Silhueta assimétrica — eixos a apontar em direcções contraditórias.";
    }
  }
  switch (posture) {
    case "calm":
      return "Compact silhouette — little distance from centre.";
    case "unsettled":
      return "Irregular silhouette — some axes stretched.";
    case "storm":
      return "Spiky silhouette — several axes at distribution extremes.";
    case "weird":
      return "Asymmetric silhouette — axes pulling in contradictory directions.";
  }
}
