import type {
  EvidenceChip,
  MarketPosture,
  RegimeContributor,
  RegimeResult,
  RegimeSignalReading,
} from "@/lib/types";

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

// ————————————————————————————————————————————————————————————————
// A especificação pública do motor
//
// Cada sinal declara o que mede, a fonte, quando está em falta e a escada de
// regras que lhe dá pontos de stress. O motor EXECUTA esta tabela — e a página
// /metodologia PUBLICA a mesma tabela. Não há segunda fonte de verdade: se a
// regra muda aqui, a documentação muda com ela.
//
// Pesos e limiares são **heurísticos e arbitrários** — não calibrados contra um
// modelo formal. Codificam leitura de operador (extremos de medo, amplitude
// estreita, alavancagem aglomerada). Estão escritos para serem discutidos;
// não tratar os scores como científicos.
// ————————————————————————————————————————————————————————————————

/** Valores derivados dos inputs crus — calculados uma vez, partilhados pelos rungs. */
export type RegimeCtx = {
  fng: number;
  btcChange24h: number;
  absBtc: number;
  breadthPct: number | null;
  maxGap: number;
  fundingRate: number;
  fundingBps: number;
  ls: number | null;
  oiAbs: number | null;
  etfUsdM: number | null;
  pegAbs: number | null;
  mcapChange: number;
};

export type RegimeRungSpec = {
  /** Condição legível — publicada tal qual em /metodologia. */
  condPt: string;
  condEn: string;
  /** Pontos de stress que esta regra adiciona (≥ 0). */
  points: number;
  test: (c: RegimeCtx) => boolean;
  /** Evidência factual do que disparou — vai para o audit trail. */
  detail: (c: RegimeCtx) => { pt: string; en: string };
};

export type RegimeSignalSpec = {
  id: string;
  labelPt: string;
  labelEn: string;
  /** O que o sinal mede — publicado em /metodologia. */
  measuresPt: string;
  measuresEn: string;
  source: string;
  /** false → sinal em falta: 0 pontos, lacuna declarada, nunca estimado. */
  present: (i: RegimeInputs) => boolean;
  /** Leitura factual do valor medido quando nenhuma regra dispara. */
  reading: (c: RegimeCtx) => { pt: string; en: string };
  /** Primeira regra que passa ganha — ordenar da mais grave à mais leve. */
  rungs: RegimeRungSpec[];
};

export const REGIME_SIGNALS: RegimeSignalSpec[] = [
  {
    id: "fng",
    labelPt: "Medo & Ganância",
    labelEn: "Fear & Greed",
    measuresPt: "Índice Medo & Ganância (0–100), leitura diária",
    measuresEn: "Fear & Greed index (0–100), daily reading",
    source: "Alternative.me",
    present: () => true,
    reading: (c) => ({ pt: `${Math.round(c.fng)}`, en: `${Math.round(c.fng)}` }),
    rungs: [
      // Extremos de medo acompanham venda forçada; de ganância, risco de fim
      // de ciclo. Escada ARBITRÁRIA — F&G sozinho não passa de ~22 pts.
      {
        condPt: "≤ 25",
        condEn: "≤ 25",
        points: 22,
        test: (c) => c.fng <= 25,
        detail: (c) => ({
          pt: `${Math.round(c.fng)} · medo extremo`,
          en: `${Math.round(c.fng)} · extreme fear`,
        }),
      },
      {
        condPt: "≤ 40",
        condEn: "≤ 40",
        points: 12,
        test: (c) => c.fng <= 40,
        detail: (c) => ({
          pt: `${Math.round(c.fng)} · medo elevado`,
          en: `${Math.round(c.fng)} · elevated fear`,
        }),
      },
      {
        condPt: "≥ 75",
        condEn: "≥ 75",
        points: 18,
        test: (c) => c.fng >= 75,
        detail: (c) => ({
          pt: `${Math.round(c.fng)} · ganância`,
          en: `${Math.round(c.fng)} · greed`,
        }),
      },
      {
        condPt: "≥ 60",
        condEn: "≥ 60",
        points: 8,
        test: (c) => c.fng >= 60,
        detail: (c) => ({
          pt: `${Math.round(c.fng)} · ganância moderada`,
          en: `${Math.round(c.fng)} · moderate greed`,
        }),
      },
    ],
  },
  {
    id: "breadth",
    labelPt: "Amplitude",
    labelEn: "Breadth",
    measuresPt: "Percentagem das maiores moedas em alta a 24h",
    measuresEn: "Share of top coins up over 24h",
    source: "CoinGecko",
    present: (i) => i.breadthPct != null,
    reading: (c) => ({
      pt: `${c.breadthPct}% em alta`,
      en: `${c.breadthPct}% up`,
    }),
    rungs: [
      // Participação estreita = tape frágil. Cortes ARBITRÁRIOS em 40/50/55.
      {
        condPt: "≤ 40%",
        condEn: "≤ 40%",
        points: 20,
        test: (c) => c.breadthPct != null && c.breadthPct <= 40,
        detail: (c) => ({
          pt: `${c.breadthPct}% dos top em alta`,
          en: `${c.breadthPct}% of top coins up`,
        }),
      },
      {
        condPt: "≤ 50%",
        condEn: "≤ 50%",
        points: 12,
        test: (c) => c.breadthPct != null && c.breadthPct <= 50,
        detail: (c) => ({
          pt: `${c.breadthPct}% dos top em alta`,
          en: `${c.breadthPct}% of top coins up`,
        }),
      },
      {
        condPt: "≤ 55% com BTC < 0",
        condEn: "≤ 55% with BTC < 0",
        points: 6,
        test: (c) =>
          c.breadthPct != null && c.breadthPct <= 55 && c.btcChange24h < 0,
        detail: (c) => ({
          pt: `${c.breadthPct}% com BTC negativo`,
          en: `${c.breadthPct}% with BTC down`,
        }),
      },
    ],
  },
  {
    id: "btc24",
    labelPt: "BTC 24h",
    labelEn: "BTC 24h",
    measuresPt: "Variação do preço do BTC a 24h",
    measuresEn: "BTC 24h price change",
    source: "CoinGecko",
    present: () => true,
    reading: (c) => ({ pt: fmtPct(c.btcChange24h), en: fmtPct(c.btcChange24h) }),
    rungs: [
      // Dimensão do movimento absoluto. Escalões ARBITRÁRIOS em 2/4/8%.
      {
        condPt: "|Δ| ≥ 8%",
        condEn: "|Δ| ≥ 8%",
        points: 24,
        test: (c) => c.absBtc >= 8,
        detail: (c) => ({ pt: fmtPct(c.btcChange24h), en: fmtPct(c.btcChange24h) }),
      },
      {
        condPt: "|Δ| ≥ 4%",
        condEn: "|Δ| ≥ 4%",
        points: 14,
        test: (c) => c.absBtc >= 4,
        detail: (c) => ({ pt: fmtPct(c.btcChange24h), en: fmtPct(c.btcChange24h) }),
      },
      {
        condPt: "|Δ| ≥ 2%",
        condEn: "|Δ| ≥ 2%",
        points: 6,
        test: (c) => c.absBtc >= 2,
        detail: (c) => ({ pt: fmtPct(c.btcChange24h), en: fmtPct(c.btcChange24h) }),
      },
    ],
  },
  {
    id: "dispersion",
    labelPt: "Dispersão alts",
    labelEn: "Alt dispersion",
    measuresPt: "Maior desvio de ETH/SOL face ao BTC a 24h",
    measuresEn: "Largest ETH/SOL deviation vs BTC over 24h",
    source: "CoinGecko",
    present: (i) => i.ethChange24h != null || i.solChange24h != null,
    reading: (c) => ({
      pt: `gap ${c.maxGap.toFixed(1)}pp`,
      en: `gap ${c.maxGap.toFixed(1)}pp`,
    }),
    rungs: [
      // Movimento idiossincrático grande vs BTC = rotação / stress em alts.
      {
        condPt: "gap ≥ 6pp",
        condEn: "gap ≥ 6pp",
        points: 10,
        test: (c) => c.maxGap >= 6,
        detail: (c) => ({
          pt: `gap máx ${c.maxGap.toFixed(1)}pp vs BTC`,
          en: `max gap ${c.maxGap.toFixed(1)}pp vs BTC`,
        }),
      },
      {
        condPt: "gap ≥ 4pp",
        condEn: "gap ≥ 4pp",
        points: 6,
        test: (c) => c.maxGap >= 4,
        detail: (c) => ({
          pt: `gap máx ${c.maxGap.toFixed(1)}pp vs BTC`,
          en: `max gap ${c.maxGap.toFixed(1)}pp vs BTC`,
        }),
      },
    ],
  },
  {
    id: "funding",
    labelPt: "Funding",
    labelEn: "Funding",
    measuresPt: "Taxa de funding do BTC por período",
    measuresEn: "BTC funding rate per period",
    source: "Binance Futures",
    present: () => true,
    reading: (c) => ({
      pt: `${(c.fundingRate * 100).toFixed(4)}%`,
      en: `${(c.fundingRate * 100).toFixed(4)}%`,
    }),
    rungs: [
      // Funding típico ~0,01% (≈1 bps). Extremos = lado alavancado aglomerado.
      {
        condPt: "|funding| ≥ 5 bps",
        condEn: "|funding| ≥ 5 bps",
        points: 16,
        test: (c) => Math.abs(c.fundingBps) >= 5,
        detail: (c) => ({
          pt: `${(c.fundingRate * 100).toFixed(4)}%`,
          en: `${(c.fundingRate * 100).toFixed(4)}%`,
        }),
      },
      {
        condPt: "|funding| ≥ 2 bps",
        condEn: "|funding| ≥ 2 bps",
        points: 8,
        test: (c) => Math.abs(c.fundingBps) >= 2,
        detail: (c) => ({
          pt: `${(c.fundingRate * 100).toFixed(4)}%`,
          en: `${(c.fundingRate * 100).toFixed(4)}%`,
        }),
      },
    ],
  },
  {
    id: "ls",
    labelPt: "Rácio L/S",
    labelEn: "L/S ratio",
    measuresPt: "Rácio de contas long/short em BTC",
    measuresEn: "BTC long/short account ratio",
    source: "Binance Futures",
    present: (i) => i.longShortRatio != null,
    reading: (c) => ({
      pt: c.ls != null ? c.ls.toFixed(2) : "—",
      en: c.ls != null ? c.ls.toFixed(2) : "—",
    }),
    rungs: [
      // Longs aglomerados (>1,6) ou shorts (<0,7) = risco de squeeze/cascata.
      {
        condPt: "≥ 2,0 ou ≤ 0,55",
        condEn: "≥ 2.0 or ≤ 0.55",
        points: 12,
        test: (c) => c.ls != null && (c.ls >= 2.0 || c.ls <= 0.55),
        detail: (c) => ({
          pt: c.ls != null ? c.ls.toFixed(2) : "—",
          en: c.ls != null ? c.ls.toFixed(2) : "—",
        }),
      },
      {
        condPt: "≥ 1,6 ou ≤ 0,7",
        condEn: "≥ 1.6 or ≤ 0.7",
        points: 6,
        test: (c) => c.ls != null && (c.ls >= 1.6 || c.ls <= 0.7),
        detail: (c) => ({
          pt: c.ls != null ? c.ls.toFixed(2) : "—",
          en: c.ls != null ? c.ls.toFixed(2) : "—",
        }),
      },
    ],
  },
  {
    id: "oi",
    labelPt: "Open interest",
    labelEn: "Open interest",
    measuresPt: "Variação do open interest a 24h (máx. BTC/ETH/SOL)",
    measuresEn: "24h open-interest change (max across BTC/ETH/SOL)",
    source: "Binance Futures",
    present: (i) => i.oiChangeMaxAbsPct != null || i.oiChange24hPct != null,
    reading: (c) => ({
      pt: c.oiAbs != null ? `Δ ${c.oiAbs.toFixed(1)}%` : "—",
      en: c.oiAbs != null ? `Δ ${c.oiAbs.toFixed(1)}%` : "—",
    }),
    rungs: [
      // OI a expandir com preço a mexer = corrida alavancada.
      {
        condPt: "|Δ| ≥ 8% com |BTC| ≥ 2%",
        condEn: "|Δ| ≥ 8% with |BTC| ≥ 2%",
        points: 12,
        test: (c) => c.oiAbs != null && c.oiAbs >= 8 && c.absBtc >= 2,
        detail: (c) => ({
          pt: `Δ ${c.oiAbs?.toFixed(1)}% com preço a mexer`,
          en: `Δ ${c.oiAbs?.toFixed(1)}% with price moving`,
        }),
      },
      {
        condPt: "|Δ| ≥ 5%",
        condEn: "|Δ| ≥ 5%",
        points: 8,
        test: (c) => c.oiAbs != null && c.oiAbs >= 5,
        detail: (c) => ({
          pt: `Δ ${c.oiAbs?.toFixed(1)}%`,
          en: `Δ ${c.oiAbs?.toFixed(1)}%`,
        }),
      },
    ],
  },
  {
    id: "etf",
    labelPt: "Fluxos ETF",
    labelEn: "ETF flows",
    measuresPt: "Fluxo diário combinado de ETF spot BTC+ETH, USD M",
    measuresEn: "Combined daily BTC+ETH spot-ETF flow, USD M",
    source: "Farside",
    present: (i) => i.etfCombinedUsdM != null,
    reading: (c) => ({
      pt:
        c.etfUsdM != null
          ? `${c.etfUsdM >= 0 ? "+" : ""}${c.etfUsdM.toFixed(0)}M USD`
          : "—",
      en:
        c.etfUsdM != null
          ? `${c.etfUsdM >= 0 ? "+" : ""}${c.etfUsdM.toFixed(0)}M USD`
          : "—",
    }),
    rungs: [
      // Fluxo institucional spot grande no dia é relevante para o regime.
      {
        condPt: "|fluxo| ≥ $500M",
        condEn: "|flow| ≥ $500M",
        points: 10,
        test: (c) => c.etfUsdM != null && Math.abs(c.etfUsdM) >= 500,
        detail: (c) => ({
          pt: `${c.etfUsdM != null && c.etfUsdM >= 0 ? "+" : ""}${c.etfUsdM?.toFixed(0)}M USD`,
          en: `${c.etfUsdM != null && c.etfUsdM >= 0 ? "+" : ""}${c.etfUsdM?.toFixed(0)}M USD`,
        }),
      },
      {
        condPt: "|fluxo| ≥ $200M",
        condEn: "|flow| ≥ $200M",
        points: 5,
        test: (c) => c.etfUsdM != null && Math.abs(c.etfUsdM) >= 200,
        detail: (c) => ({
          pt: `${c.etfUsdM != null && c.etfUsdM >= 0 ? "+" : ""}${c.etfUsdM?.toFixed(0)}M USD`,
          en: `${c.etfUsdM != null && c.etfUsdM >= 0 ? "+" : ""}${c.etfUsdM?.toFixed(0)}M USD`,
        }),
      },
    ],
  },
  {
    id: "peg",
    labelPt: "Peg stables",
    labelEn: "Stable peg",
    measuresPt: "Maior desvio de paridade entre stablecoins USD vigiadas",
    measuresEn: "Largest peg deviation among watched USD stablecoins",
    source: "DefiLlama",
    present: (i) => i.maxPegDeviationPct != null,
    reading: (c) => ({
      pt: c.pegAbs != null ? `desvio ${c.pegAbs.toFixed(2)}%` : "—",
      en: c.pegAbs != null ? `${c.pegAbs.toFixed(2)}% deviation` : "—",
    }),
    rungs: [
      // Depeg é stress sistémico de liquidez.
      {
        condPt: "desvio ≥ 1%",
        condEn: "deviation ≥ 1%",
        points: 15,
        test: (c) => c.pegAbs != null && c.pegAbs >= 1,
        detail: (c) => ({
          pt: `desvio ${c.pegAbs?.toFixed(2)}%`,
          en: `${c.pegAbs?.toFixed(2)}% deviation`,
        }),
      },
      {
        condPt: "desvio ≥ 0,5%",
        condEn: "deviation ≥ 0.5%",
        points: 8,
        test: (c) => c.pegAbs != null && c.pegAbs >= 0.5,
        detail: (c) => ({
          pt: `desvio ${c.pegAbs?.toFixed(2)}%`,
          en: `${c.pegAbs?.toFixed(2)}% deviation`,
        }),
      },
    ],
  },
  {
    id: "mcap",
    labelPt: "Cap. mercado",
    labelEn: "Market cap",
    measuresPt: "Variação da capitalização total do mercado a 24h",
    measuresEn: "Total market-cap 24h change",
    source: "CoinGecko",
    present: () => true,
    reading: (c) => ({ pt: fmtPct(c.mcapChange), en: fmtPct(c.mcapChange) }),
    rungs: [
      {
        condPt: "|Δ| ≥ 5%",
        condEn: "|Δ| ≥ 5%",
        points: 8,
        test: (c) => Math.abs(c.mcapChange) >= 5,
        detail: (c) => ({ pt: fmtPct(c.mcapChange), en: fmtPct(c.mcapChange) }),
      },
    ],
  },
];

/** Limiares da postura — ARBITRÁRIOS, publicados em /metodologia. */
export const REGIME_POSTURE = {
  /** stress ≥ → instável */
  unsettledMin: 32,
  /** stress ≥ → tempestade */
  stormMin: 60,
  /** stress mínimo para uma contradição poder marcar "misto" */
  weirdMinStress: 30,
} as const;

/**
 * Regras da postura "misto" — sinais que se contradizem.
 * Publicadas tal qual em /metodologia#regime.
 */
export const REGIME_WEIRD_RULES: {
  condPt: string;
  condEn: string;
  test: (c: RegimeCtx) => boolean;
}[] = [
  {
    condPt: "F&G ≤ 30 com BTC > +3%",
    condEn: "F&G ≤ 30 with BTC > +3%",
    test: (c) => c.fng <= 30 && c.btcChange24h > 3,
  },
  {
    condPt: "F&G ≥ 70 com BTC < −3%",
    condEn: "F&G ≥ 70 with BTC < −3%",
    test: (c) => c.fng >= 70 && c.btcChange24h < -3,
  },
  {
    condPt: "funding > +3 bps com BTC < −2%",
    condEn: "funding > +3 bps with BTC < −2%",
    test: (c) => c.fundingBps > 3 && c.btcChange24h < -2,
  },
  {
    condPt: "funding < −3 bps com BTC > +2%",
    condEn: "funding < −3 bps with BTC > +2%",
    test: (c) => c.fundingBps < -3 && c.btcChange24h > 2,
  },
  {
    condPt: "ETF > +$200M com BTC < −2%",
    condEn: "ETF > +$200M with BTC < −2%",
    test: (c) =>
      c.etfUsdM != null && c.etfUsdM > 200 && c.btcChange24h < -2,
  },
  {
    condPt: "ETF < −$200M com BTC > +2%",
    condEn: "ETF < −$200M with BTC > +2%",
    test: (c) =>
      c.etfUsdM != null && c.etfUsdM < -200 && c.btcChange24h > 2,
  },
];

function buildCtx(input: RegimeInputs): RegimeCtx {
  const gaps: number[] = [];
  if (input.ethChange24h != null)
    gaps.push(Math.abs(input.ethChange24h - input.btcChange24h));
  if (input.solChange24h != null)
    gaps.push(Math.abs(input.solChange24h - input.btcChange24h));
  const oiAbs =
    input.oiChangeMaxAbsPct != null
      ? Math.abs(input.oiChangeMaxAbsPct)
      : input.oiChange24hPct != null
        ? Math.abs(input.oiChange24hPct)
        : null;
  return {
    fng: input.fearGreed,
    btcChange24h: input.btcChange24h,
    absBtc: Math.abs(input.btcChange24h),
    breadthPct: input.breadthPct ?? null,
    maxGap: gaps.length ? Math.max(...gaps) : 0,
    fundingRate: input.fundingRate,
    fundingBps: input.fundingRate * 10000,
    ls: input.longShortRatio ?? null,
    oiAbs,
    etfUsdM: input.etfCombinedUsdM ?? null,
    pegAbs:
      input.maxPegDeviationPct != null
        ? Math.abs(input.maxPegDeviationPct)
        : null,
    mcapChange: input.marketCapChange24h,
  };
}

/**
 * Stress / posture engine.
 *
 * Executa REGIME_SIGNALS: cada sinal em falta entra como "missing" (0 pontos,
 * lacuna declarada); cada sinal medido regista a regra que disparou ou a
 * leitura neutra. O resultado é auditável ponto a ponto — `signals` é o
 * rasto completo, `contributors` o subconjunto que somou stress.
 */
export function computeRegime(input: RegimeInputs): RegimeResult {
  const ctx = buildCtx(input);
  const signals: RegimeSignalReading[] = [];
  let stress = 0;

  for (const sig of REGIME_SIGNALS) {
    if (!sig.present(input)) {
      signals.push({
        id: sig.id,
        labelPt: sig.labelPt,
        labelEn: sig.labelEn,
        status: "missing",
        points: 0,
        detailPt: null,
        detailEn: null,
      });
      continue;
    }
    const rung = sig.rungs.find((r) => r.test(ctx));
    if (rung) {
      stress += rung.points;
      const d = rung.detail(ctx);
      signals.push({
        id: sig.id,
        labelPt: sig.labelPt,
        labelEn: sig.labelEn,
        status: "measured",
        points: rung.points,
        detailPt: d.pt,
        detailEn: d.en,
      });
    } else {
      const v = sig.reading(ctx);
      signals.push({
        id: sig.id,
        labelPt: sig.labelPt,
        labelEn: sig.labelEn,
        status: "measured",
        points: 0,
        detailPt: v.pt,
        detailEn: v.en,
      });
    }
  }

  const score = clamp(stress, 0, 100);
  const contributors: RegimeContributor[] = signals
    .filter((s) => s.points > 0)
    .map((s) => ({
      id: s.id,
      labelPt: s.labelPt,
      labelEn: s.labelEn,
      points: s.points,
      detailPt: s.detailPt ?? "",
      detailEn: s.detailEn ?? "",
    }))
    .sort((a, b) => b.points - a.points);

  const contradictory = REGIME_WEIRD_RULES.some((r) => r.test(ctx));

  let posture: MarketPosture;
  if (contradictory && score >= REGIME_POSTURE.weirdMinStress) posture = "weird";
  else if (score >= REGIME_POSTURE.stormMin) posture = "storm";
  else if (score >= REGIME_POSTURE.unsettledMin) posture = "unsettled";
  else posture = "calm";

  const receipts: EvidenceChip[] = [
    {
      id: "fng",
      label: "Medo & Ganância",
      labelEn: "Fear & Greed",
      value: `${Math.round(ctx.fng)}`,
      tone: ctx.fng <= 30 ? "warn" : ctx.fng >= 70 ? "down" : "neutral",
    },
    {
      id: "btc24",
      label: "BTC 24h",
      labelEn: "BTC 24h",
      value: fmtPct(ctx.btcChange24h),
      tone: ctx.btcChange24h >= 0 ? "up" : "down",
    },
    {
      id: "funding",
      label: "Funding",
      labelEn: "Funding",
      value: `${(ctx.fundingRate * 100).toFixed(4)}%`,
      tone: Math.abs(ctx.fundingBps) >= 2 ? "warn" : "neutral",
    },
  ];
  if (ctx.breadthPct != null) {
    receipts.push({
      id: "breadth",
      label: "Amplitude",
      labelEn: "Breadth",
      value: `${ctx.breadthPct}%`,
      tone: ctx.breadthPct <= 40 ? "warn" : ctx.breadthPct >= 65 ? "up" : "neutral",
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
        ctx.absBtc < 1.5
          ? "Mercado em compasso de espera — volatilidade contida no Bitcoin."
          : `Bitcoin ${ctx.btcChange24h >= 0 ? "sobe" : "cede"} ${Math.abs(ctx.btcChange24h).toFixed(1)}% sem extremos de sentimento.`,
      en:
        ctx.absBtc < 1.5
          ? "Market on hold — contained Bitcoin volatility."
          : `Bitcoin ${ctx.btcChange24h >= 0 ? "rises" : "slips"} ${Math.abs(ctx.btcChange24h).toFixed(1)}% without sentiment extremes.`,
    },
    unsettled: {
      pt: `Tensão no mercado: BTC ${fmtPct(ctx.btcChange24h)} com Medo e Ganância em ${Math.round(ctx.fng)}.`,
      en: `Tension building: BTC ${fmtPct(ctx.btcChange24h)} with Fear & Greed at ${Math.round(ctx.fng)}.`,
    },
    storm: {
      pt: `Regime de stress elevado — BTC ${fmtPct(ctx.btcChange24h)} e alavancagem sob pressão.`,
      en: `Storm mode: elevated stress — BTC ${fmtPct(ctx.btcChange24h)} with leverage under pressure.`,
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
    score,
    receipts,
    contributors,
    signals,
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
