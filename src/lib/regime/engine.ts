import type { EvidenceChip, MarketPosture, RegimeResult } from "@/lib/types";

/**
 * Inputs for the posture / stress engine.
 * All fields are optional except fearGreed + btcChange24h so callers can degrade
 * gracefully when a source is missing — missing signals contribute 0, never invented.
 */
export interface RegimeInputs {
  fearGreed: number;
  btcChange24h: number;
  ethChange24h?: number | null;
  solChange24h?: number | null;
  /** Share of top coins green in 24h, 0–100. Server-computed. */
  breadthPct?: number | null;
  dominance: number;
  fundingRate: number;
  oiChange24hPct?: number | null;
  /** Max |OI Δ24h| across BTC/ETH/SOL when multi-asset available */
  oiChangeMaxAbsPct?: number | null;
  marketCapChange24h: number;
  /** BTC global long/short account ratio (Binance). >1 = more long accounts */
  longShortRatio?: number | null;
  /** Combined BTC+ETH ETF daily flow in USD millions (Farside). */
  etfCombinedUsdM?: number | null;
  /** Worst |peg deviation| % among watched USD stables */
  maxPegDeviationPct?: number | null;
}

export type RegimeContributor = {
  id: string;
  labelPt: string;
  labelEn: string;
  /** Points added to stress (always ≥ 0) */
  points: number;
  detail: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Share of top assets with change24h ≥ 0. Returns null if empty. */
export function computeBreadthPct(
  assets: { change24h: number }[],
): number | null {
  if (!assets.length) return null;
  const green = assets.filter((a) => a.change24h >= 0).length;
  return Math.round((green / assets.length) * 100);
}

type Acc = { stress: number; contributors: RegimeContributor[] };

function add(
  acc: Acc,
  id: string,
  points: number,
  labelPt: string,
  labelEn: string,
  detail: string,
) {
  if (points <= 0) return;
  acc.stress += points;
  acc.contributors.push({ id, labelPt, labelEn, points, detail });
}

/**
 * Stress / posture engine.
 *
 * Weights below are **heuristic and arbitrary** — not backtested to a formal model.
 * They encode operator heuristics (fear extremes, narrow breadth, leverage crowding).
 * Documented so they can be challenged; do not treat scores as scientific.
 */
export function computeRegime(input: RegimeInputs): RegimeResult {
  const absBtc = Math.abs(input.btcChange24h);
  const fundingBps = input.fundingRate * 10000;
  const fng = input.fearGreed;
  const acc: Acc = { stress: 0, contributors: [] };

  // --- Fear & Greed ----------------------------------------------------------
  // Extreme fear often co-moves with forced selling; extreme greed with late-cycle risk.
  // Ladder magnitudes are ARBITRARY (chosen so F&G alone cannot dominate past ~22 pts).
  if (fng <= 25) {
    add(acc, "fng", 22, "Medo & Ganância", "Fear & Greed", `${Math.round(fng)} · medo extremo`);
  } else if (fng <= 40) {
    add(acc, "fng", 12, "Medo & Ganância", "Fear & Greed", `${Math.round(fng)} · medo elevado`);
  } else if (fng >= 75) {
    add(acc, "fng", 18, "Medo & Ganância", "Fear & Greed", `${Math.round(fng)} · ganância`);
  } else if (fng >= 60) {
    add(acc, "fng", 8, "Medo & Ganância", "Fear & Greed", `${Math.round(fng)} · ganância moderada`);
  }

  // --- Breadth ---------------------------------------------------------------
  // Narrow participation = fragile tape. ARBITRARY cutoffs at 40/50/55.
  if (input.breadthPct != null) {
    const b = input.breadthPct;
    if (b <= 40) {
      add(acc, "breadth", 20, "Amplitude", "Breadth", `${b}% dos top em alta`);
    } else if (b <= 50) {
      add(acc, "breadth", 12, "Amplitude", "Breadth", `${b}% dos top em alta`);
    } else if (b <= 55 && input.btcChange24h < 0) {
      add(acc, "breadth", 6, "Amplitude", "Breadth", `${b}% com BTC negativo`);
    }
  }

  // --- BTC volatility --------------------------------------------------------
  // Absolute move size. ARBITRARY tiers at 2/4/8%.
  if (absBtc >= 8) {
    add(acc, "btc24", 24, "BTC 24h", "BTC 24h", `${fmtPct(input.btcChange24h)}`);
  } else if (absBtc >= 4) {
    add(acc, "btc24", 14, "BTC 24h", "BTC 24h", `${fmtPct(input.btcChange24h)}`);
  } else if (absBtc >= 2) {
    add(acc, "btc24", 6, "BTC 24h", "BTC 24h", `${fmtPct(input.btcChange24h)}`);
  }

  // --- ETH / SOL vs BTC dispersion -------------------------------------------
  // Large idiosyncratic moves vs BTC = rotation / alt stress. ARBITRARY ≥4pp gap.
  const eth = input.ethChange24h;
  const sol = input.solChange24h;
  const gaps: number[] = [];
  if (eth != null) gaps.push(Math.abs(eth - input.btcChange24h));
  if (sol != null) gaps.push(Math.abs(sol - input.btcChange24h));
  const maxGap = gaps.length ? Math.max(...gaps) : 0;
  if (maxGap >= 6) {
    add(acc, "dispersion", 10, "Dispersão alts", "Alt dispersion", `gap máx ${maxGap.toFixed(1)}pp vs BTC`);
  } else if (maxGap >= 4) {
    add(acc, "dispersion", 6, "Dispersão alts", "Alt dispersion", `gap máx ${maxGap.toFixed(1)}pp vs BTC`);
  }

  // --- Funding ---------------------------------------------------------------
  // Typical funding ~0.01% (=1 bps display as rate*10000). Extremes = crowded levered side.
  // ARBITRARY thresholds at 2 / 5 bps.
  if (Math.abs(fundingBps) >= 5) {
    add(acc, "funding", 16, "Funding", "Funding", `${(input.fundingRate * 100).toFixed(4)}%`);
  } else if (Math.abs(fundingBps) >= 2) {
    add(acc, "funding", 8, "Funding", "Funding", `${(input.fundingRate * 100).toFixed(4)}%`);
  }

  // --- Long/Short ratio ------------------------------------------------------
  // Crowded long (>1.6) or short (<0.7) accounts raise squeeze/cascade risk. ARBITRARY.
  if (input.longShortRatio != null) {
    const ls = input.longShortRatio;
    if (ls >= 2.0 || ls <= 0.55) {
      add(acc, "ls", 12, "Rácio L/S", "L/S ratio", ls.toFixed(2));
    } else if (ls >= 1.6 || ls <= 0.7) {
      add(acc, "ls", 6, "Rácio L/S", "L/S ratio", ls.toFixed(2));
    }
  }

  // --- Open interest ---------------------------------------------------------
  // OI expansion with a price move = leverage chase. Prefer multi-asset max when present.
  const oiAbs =
    input.oiChangeMaxAbsPct != null
      ? Math.abs(input.oiChangeMaxAbsPct)
      : input.oiChange24hPct != null
        ? Math.abs(input.oiChange24hPct)
        : null;
  if (oiAbs != null) {
    if (oiAbs >= 8 && absBtc >= 2) {
      add(acc, "oi", 12, "Open interest", "Open interest", `Δ ${oiAbs.toFixed(1)}% com preço a mexer`);
    } else if (oiAbs >= 5) {
      add(acc, "oi", 8, "Open interest", "Open interest", `Δ ${oiAbs.toFixed(1)}%`);
    }
  }

  // --- ETF spot flows --------------------------------------------------------
  // Large same-day institutional spot flow is regime-relevant. ARBITRARY $200M / $500M.
  if (input.etfCombinedUsdM != null) {
    const flow = Math.abs(input.etfCombinedUsdM);
    if (flow >= 500) {
      add(
        acc,
        "etf",
        10,
        "Fluxos ETF",
        "ETF flows",
        `${input.etfCombinedUsdM >= 0 ? "+" : ""}${input.etfCombinedUsdM.toFixed(0)}M USD`,
      );
    } else if (flow >= 200) {
      add(
        acc,
        "etf",
        5,
        "Fluxos ETF",
        "ETF flows",
        `${input.etfCombinedUsdM >= 0 ? "+" : ""}${input.etfCombinedUsdM.toFixed(0)}M USD`,
      );
    }
  }

  // --- Stablecoin peg --------------------------------------------------------
  // Depeg is systemic liquidity stress. Thresholds mirror peg-watch UI (±0.15 warn, here higher).
  if (input.maxPegDeviationPct != null) {
    const peg = Math.abs(input.maxPegDeviationPct);
    if (peg >= 1) {
      add(acc, "peg", 15, "Peg stables", "Stable peg", `desvio ${peg.toFixed(2)}%`);
    } else if (peg >= 0.5) {
      add(acc, "peg", 8, "Peg stables", "Stable peg", `desvio ${peg.toFixed(2)}%`);
    }
  }

  // --- Market-wide cap move --------------------------------------------------
  // ARBITRARY ≥5% total mcap move.
  if (Math.abs(input.marketCapChange24h) >= 5) {
    add(
      acc,
      "mcap",
      8,
      "Cap. mercado",
      "Market cap",
      fmtPct(input.marketCapChange24h),
    );
  }

  const stress = clamp(acc.stress, 0, 100);
  acc.contributors.sort((a, b) => b.points - a.points);

  const contradictory =
    (fng <= 30 && input.btcChange24h > 3) ||
    (fng >= 70 && input.btcChange24h < -3) ||
    (fundingBps > 3 && input.btcChange24h < -2) ||
    (fundingBps < -3 && input.btcChange24h > 2) ||
    (input.etfCombinedUsdM != null &&
      input.etfCombinedUsdM > 200 &&
      input.btcChange24h < -2) ||
    (input.etfCombinedUsdM != null &&
      input.etfCombinedUsdM < -200 &&
      input.btcChange24h > 2);

  // Thresholds ARBITRARY: calm <32, unsettled <60, else storm; weird overlays contradictions.
  let posture: MarketPosture;
  if (contradictory && stress >= 30) posture = "weird";
  else if (stress >= 60) posture = "storm";
  else if (stress >= 32) posture = "unsettled";
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
      value: fmtPct(input.btcChange24h),
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
  if (input.breadthPct != null) {
    receipts.push({
      id: "breadth",
      label: "Amplitude",
      labelEn: "Breadth",
      value: `${input.breadthPct}%`,
      tone: input.breadthPct <= 40 ? "warn" : input.breadthPct >= 65 ? "up" : "neutral",
    });
  }

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
      pt: `Tensão no mercado: BTC ${fmtPct(input.btcChange24h)} com Medo e Ganância em ${Math.round(fng)}.`,
      en: `Tension building: BTC ${fmtPct(input.btcChange24h)} with Fear & Greed at ${Math.round(fng)}.`,
    },
    storm: {
      pt: `Regime de stress elevado — BTC ${fmtPct(input.btcChange24h)} e alavancagem sob pressão.`,
      en: `Storm mode: elevated stress — BTC ${fmtPct(input.btcChange24h)} with leverage under pressure.`,
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
    contributors: acc.contributors,
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

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

/** Baseline inputs for informal scenario checks / unit tests. */
export function baselineRegimeInputs(
  overrides: Partial<RegimeInputs> = {},
): RegimeInputs {
  return {
    fearGreed: 50,
    btcChange24h: 0.5,
    ethChange24h: 0.6,
    solChange24h: 0.8,
    breadthPct: 60,
    dominance: 55,
    fundingRate: 0.00005,
    oiChange24hPct: 1,
    oiChangeMaxAbsPct: 1,
    marketCapChange24h: 0.5,
    longShortRatio: 1.05,
    etfCombinedUsdM: 20,
    maxPegDeviationPct: 0.05,
    ...overrides,
  };
}
