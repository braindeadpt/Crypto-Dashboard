import type {
  Reading,
  ReadingBand,
  ReadingContributor,
  ReadingGap,
  ReadingId,
} from "@/lib/reading/types";

/**
 * SOBRE OS PESOS
 *
 * Os pesos abaixo são **heurísticos e não calibrados contra um modelo formal**.
 * Codificam leitura de operador (amplitude importa mais que o preço de um único
 * activo; alavancagem a subir com preço a cair é o sinal de fragilidade mais
 * fiável que temos de graça). Estão escritos aqui para poderem ser discutidos e
 * corrigidos — não para aparentar rigor que não existe.
 *
 * Regra de honestidade que atravessa o ficheiro: um ingrediente em falta
 * contribui ZERO e é registado em `gaps`. Nunca é substituído por uma
 * estimativa, e nunca é escondido — a confiança da leitura desce em proporção
 * ao peso que ficou por cobrir.
 *
 * READING_SPECS é a fonte única: o runner executa-a e /metodologia publica-a.
 */

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Normaliza um valor para -1..1 a partir de um limiar de saturação. */
function norm(value: number, saturateAt: number): number {
  if (!Number.isFinite(value) || saturateAt <= 0) return 0;
  return clamp(value / saturateAt, -1, 1);
}

type Acc = {
  raw: number;
  weightUsed: number;
  weightTotal: number;
  contributors: ReadingContributor[];
  gaps: ReadingGap[];
};

function newAcc(): Acc {
  return {
    raw: 0,
    weightUsed: 0,
    weightTotal: 0,
    contributors: [],
    gaps: [],
  };
}

/**
 * Adiciona um ingrediente. `signal` é -1..1 (ou 0..1 para leituras sem sinal).
 * `signal == null` significa dado indisponível → conta como lacuna.
 */
function add(
  acc: Acc,
  id: string,
  weight: number,
  signal: number | null,
  labelPt: string,
  labelEn: string,
  detailPt: string,
  detailEn: string,
) {
  acc.weightTotal += weight;
  if (signal == null || !Number.isFinite(signal)) {
    acc.gaps.push({ id, labelPt, labelEn, weight });
    return;
  }
  const points = signal * weight;
  acc.raw += points;
  acc.weightUsed += weight;
  acc.contributors.push({
    id,
    labelPt,
    labelEn,
    points: Math.round(points * 10) / 10,
    weight,
    detailPt,
    detailEn,
  });
}

function bandFor(value: number, signed: boolean): ReadingBand {
  if (signed) {
    if (value <= -50) return "muito-negativo";
    if (value <= -15) return "negativo";
    if (value < 15) return "neutro";
    if (value < 50) return "positivo";
    return "muito-positivo";
  }
  // Sem sinal (risco): 0 = calmo, 100 = frágil
  if (value >= 70) return "muito-negativo";
  if (value >= 45) return "negativo";
  if (value >= 25) return "neutro";
  return "positivo";
}

/**
 * Cortes de banda publicados em /metodologia — a tabela é esta, não uma cópia.
 * `signed` aplica-se a Direcção e Dinheiro (−100..+100); `unsigned` ao Risco
 * (0..100, onde valores altos são piores).
 */
export const READING_BANDS: Record<
  "signed" | "unsigned",
  { band: ReadingBand; condPt: string; condEn: string }[]
> = {
  signed: [
    { band: "muito-negativo", condPt: "≤ −50", condEn: "≤ −50" },
    { band: "negativo", condPt: "≤ −15", condEn: "≤ −15" },
    { band: "neutro", condPt: "−15 a +15", condEn: "−15 to +15" },
    { band: "positivo", condPt: "+15 a +50", condEn: "+15 to +50" },
    { band: "muito-positivo", condPt: "≥ +50", condEn: "≥ +50" },
  ],
  unsigned: [
    { band: "positivo", condPt: "< 25", condEn: "< 25" },
    { band: "neutro", condPt: "25–45", condEn: "25–45" },
    { band: "negativo", condPt: "45–70", condEn: "45–70" },
    { band: "muito-negativo", condPt: "≥ 70", condEn: "≥ 70" },
  ],
};

function finish(
  acc: Acc,
  id: ReadingId,
  signed: boolean,
  sentence: (v: number, band: ReadingBand, conf: number) => {
    pt: string;
    en: string;
  },
): Reading {
  // Escala pelo peso EFECTIVAMENTE coberto: se metade dos ingredientes faltou,
  // a leitura não finge ter a amplitude completa.
  const value =
    acc.weightUsed > 0
      ? Math.round(clamp((acc.raw / acc.weightUsed) * 100, signed ? -100 : 0, 100))
      : 0;
  const confidence =
    acc.weightTotal > 0
      ? Math.round((acc.weightUsed / acc.weightTotal) * 100) / 100
      : 0;
  const band = bandFor(value, signed);
  const s = sentence(value, band, confidence);
  acc.contributors.sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  return {
    id,
    value,
    band,
    confidence,
    contributors: acc.contributors,
    gaps: acc.gaps,
    sentencePt: s.pt,
    sentenceEn: s.en,
  };
}

// ————————————————————————————————————————————————————————————————
// Entradas
// ————————————————————————————————————————————————————————————————

export type ReadingInputs = {
  btcChange24h?: number | null;
  ethChange24h?: number | null;
  /** % do top N em alta (0–100) */
  breadthPct?: number | null;
  /** Variação da capitalização total 24h */
  marketCapChange24h?: number | null;

  fundingRate?: number | null;
  oiChange24hPct?: number | null;
  longShortRatio?: number | null;
  /** Nocional liquidado na janela recente, USD */
  liquidationsUsd?: number | null;
  /** Volatilidade realizada, % anualizada */
  realizedVolPct?: number | null;

  /** Fluxo ETF combinado BTC+ETH do dia, USD milhões */
  etfCombinedUsdM?: number | null;
  /** Variação da oferta de stablecoins a 7 dias, % */
  stableSupply7dPct?: number | null;
  /** Variação do TVL 1 dia, % */
  tvlChange1dPct?: number | null;
};

// ————————————————————————————————————————————————————————————————
// A especificação pública das leituras
//
// Cada ingrediente declara peso, normalização, fonte e a função que o mede.
// O runner executa esta tabela; /metodologia publica-a tal qual.
// ————————————————————————————————————————————————————————————————

export type ReadingIngredientSpec = {
  id: string;
  labelPt: string;
  labelEn: string;
  /** Peso máximo do ingrediente na leitura. */
  weight: number;
  /** Como o valor bruto é normalizado — publicado em /metodologia. */
  scalePt: string;
  scaleEn: string;
  source: string;
  /** Sinal normalizado (−1..1 ou 0..1); null = ingrediente em falta. */
  signal: (i: ReadingInputs) => number | null;
  /** Evidência factual do ingrediente — vai para o audit trail. */
  detail: (i: ReadingInputs) => { pt: string; en: string };
};

export type ReadingSpec = {
  id: ReadingId;
  /** true = escala −100..+100 com sinal; false = 0..100 só magnitude. */
  signed: boolean;
  ingredients: ReadingIngredientSpec[];
};

export const READING_SPECS: Record<ReadingId, ReadingSpec> = {
  direction: {
    id: "direction",
    signed: true,
    ingredients: [
      // Amplitude pesa mais que qualquer preço isolado: uma subida do BTC com
      // 30% de amplitude é uma subida do BTC, não do mercado.
      {
        id: "breadth",
        labelPt: "Amplitude",
        labelEn: "Breadth",
        weight: 40,
        scalePt: "centrada em 50%, satura a ±35pp",
        scaleEn: "centred at 50%, saturates at ±35pp",
        source: "CoinGecko",
        signal: (i) =>
          i.breadthPct == null ? null : norm(i.breadthPct - 50, 35),
        detail: (i) => ({
          pt:
            i.breadthPct == null ? "" : `${i.breadthPct}% das maiores em alta`,
          en: i.breadthPct == null ? "" : `${i.breadthPct}% of majors up`,
        }),
      },
      {
        id: "btc",
        labelPt: "Bitcoin 24h",
        labelEn: "Bitcoin 24h",
        weight: 30,
        scalePt: "satura a ±5%",
        scaleEn: "saturates at ±5%",
        source: "CoinGecko",
        signal: (i) =>
          i.btcChange24h == null ? null : norm(i.btcChange24h, 5),
        detail: (i) => ({
          pt: i.btcChange24h == null ? "" : `${i.btcChange24h.toFixed(2)}%`,
          en: i.btcChange24h == null ? "" : `${i.btcChange24h.toFixed(2)}%`,
        }),
      },
      {
        id: "eth",
        labelPt: "Ethereum 24h",
        labelEn: "Ethereum 24h",
        weight: 15,
        scalePt: "satura a ±5%",
        scaleEn: "saturates at ±5%",
        source: "CoinGecko",
        signal: (i) =>
          i.ethChange24h == null ? null : norm(i.ethChange24h, 5),
        detail: (i) => ({
          pt: i.ethChange24h == null ? "" : `${i.ethChange24h.toFixed(2)}%`,
          en: i.ethChange24h == null ? "" : `${i.ethChange24h.toFixed(2)}%`,
        }),
      },
      {
        id: "mcap",
        labelPt: "Capitalização total",
        labelEn: "Total market cap",
        weight: 15,
        scalePt: "satura a ±4%",
        scaleEn: "saturates at ±4%",
        source: "CoinGecko",
        signal: (i) =>
          i.marketCapChange24h == null ? null : norm(i.marketCapChange24h, 4),
        detail: (i) => ({
          pt:
            i.marketCapChange24h == null
              ? ""
              : `${i.marketCapChange24h.toFixed(2)}%`,
          en:
            i.marketCapChange24h == null
              ? ""
              : `${i.marketCapChange24h.toFixed(2)}%`,
        }),
      },
    ],
  },

  risk: {
    id: "risk",
    signed: false,
    ingredients: [
      // Só magnitude: todos os sinais entram em 0..1, nunca negativos.
      // Alavancagem a crescer é o melhor preditor gratuito de cascata.
      {
        id: "oi",
        labelPt: "Alavancagem",
        labelEn: "Leverage",
        weight: 30,
        scalePt: "|Δ OI 24h| satura a 8%",
        scaleEn: "|24h OI change| saturates at 8%",
        source: "Binance Futures",
        signal: (i) =>
          i.oiChange24hPct == null
            ? null
            : clamp(Math.abs(i.oiChange24hPct) / 8, 0, 1),
        detail: (i) => ({
          pt:
            i.oiChange24hPct == null
              ? ""
              : `posições abertas ${i.oiChange24hPct >= 0 ? "+" : ""}${i.oiChange24hPct.toFixed(1)}% em 24h`,
          en:
            i.oiChange24hPct == null
              ? ""
              : `open interest ${i.oiChange24hPct >= 0 ? "+" : ""}${i.oiChange24hPct.toFixed(1)}% in 24h`,
        }),
      },
      // Funding extremo = quem está posicionado paga caro para lá continuar.
      {
        id: "funding",
        labelPt: "Custo da alavancagem",
        labelEn: "Funding",
        weight: 25,
        scalePt: "|funding| satura a 5 bps",
        scaleEn: "|funding| saturates at 5 bps",
        source: "Binance Futures",
        signal: (i) =>
          i.fundingRate == null
            ? null
            : clamp(Math.abs(i.fundingRate * 10000) / 5, 0, 1),
        detail: (i) => ({
          pt:
            i.fundingRate == null
              ? ""
              : `${(i.fundingRate * 100).toFixed(4)}% por período`,
          en:
            i.fundingRate == null
              ? ""
              : `${(i.fundingRate * 100).toFixed(4)}% per period`,
        }),
      },
      {
        id: "vol",
        labelPt: "Volatilidade",
        labelEn: "Volatility",
        weight: 20,
        scalePt: "vol. realizada anualizada satura a 90%",
        scaleEn: "annualised realized vol saturates at 90%",
        source: "CoinGecko",
        signal: (i) =>
          i.realizedVolPct == null ? null : clamp(i.realizedVolPct / 90, 0, 1),
        detail: (i) => ({
          pt:
            i.realizedVolPct == null
              ? ""
              : `${i.realizedVolPct.toFixed(0)}% anualizada`,
          en:
            i.realizedVolPct == null
              ? ""
              : `${i.realizedVolPct.toFixed(0)}% annualised`,
        }),
      },
      // Desequilíbrio de posicionamento: 1.0 é equilíbrio, longe disso é aglomeração.
      {
        id: "ls",
        labelPt: "Aglomeração",
        labelEn: "Crowding",
        weight: 15,
        scalePt: "distância do rácio a 1.0 satura a ±1.2",
        scaleEn: "ratio distance from 1.0 saturates at ±1.2",
        source: "Binance Futures",
        signal: (i) =>
          i.longShortRatio == null
            ? null
            : clamp(Math.abs(i.longShortRatio - 1) / 1.2, 0, 1),
        detail: (i) => ({
          pt:
            i.longShortRatio == null
              ? ""
              : `rácio long/short ${i.longShortRatio.toFixed(2)}`,
          en:
            i.longShortRatio == null
              ? ""
              : `long/short ratio ${i.longShortRatio.toFixed(2)}`,
        }),
      },
      {
        id: "liq",
        labelPt: "Liquidações",
        labelEn: "Liquidations",
        weight: 10,
        scalePt: "nocional liquidado satura a $50M",
        scaleEn: "liquidated notional saturates at $50M",
        source: "Binance Futures",
        signal: (i) =>
          i.liquidationsUsd == null
            ? null
            : clamp(i.liquidationsUsd / 50_000_000, 0, 1),
        detail: (i) => ({
          pt:
            i.liquidationsUsd == null
              ? ""
              : `${(i.liquidationsUsd / 1_000_000).toFixed(1)} M USD na janela`,
          en:
            i.liquidationsUsd == null
              ? ""
              : `${(i.liquidationsUsd / 1_000_000).toFixed(1)}M USD in window`,
        }),
      },
    ],
  },

  money: {
    id: "money",
    signed: true,
    ingredients: [
      // Oferta de stablecoins é o melhor indicador de dinheiro NOVO a entrar:
      // emitir stables é o passo anterior a comprar.
      {
        id: "stables",
        labelPt: "Oferta de stablecoins",
        labelEn: "Stablecoin supply",
        weight: 45,
        scalePt: "Δ 7d satura a ±1.5%",
        scaleEn: "7d change saturates at ±1.5%",
        source: "DefiLlama",
        signal: (i) =>
          i.stableSupply7dPct == null ? null : norm(i.stableSupply7dPct, 1.5),
        detail: (i) => ({
          pt:
            i.stableSupply7dPct == null
              ? ""
              : `${i.stableSupply7dPct >= 0 ? "+" : ""}${i.stableSupply7dPct.toFixed(2)}% em 7 dias`,
          en:
            i.stableSupply7dPct == null
              ? ""
              : `${i.stableSupply7dPct >= 0 ? "+" : ""}${i.stableSupply7dPct.toFixed(2)}% in 7 days`,
        }),
      },
      {
        id: "etf",
        labelPt: "Fluxos ETF",
        labelEn: "ETF flows",
        weight: 40,
        scalePt: "fluxo diário satura a ±$400M",
        scaleEn: "daily flow saturates at ±$400M",
        source: "Farside",
        signal: (i) =>
          i.etfCombinedUsdM == null ? null : norm(i.etfCombinedUsdM, 400),
        detail: (i) => ({
          pt:
            i.etfCombinedUsdM == null
              ? ""
              : `${i.etfCombinedUsdM >= 0 ? "+" : ""}${i.etfCombinedUsdM.toFixed(0)} M USD no dia`,
          en:
            i.etfCombinedUsdM == null
              ? ""
              : `${i.etfCombinedUsdM >= 0 ? "+" : ""}${i.etfCombinedUsdM.toFixed(0)}M USD on the day`,
        }),
      },
      {
        id: "tvl",
        labelPt: "Depósitos on-chain",
        labelEn: "On-chain deposits",
        weight: 15,
        scalePt: "Δ 1d satura a ±3%",
        scaleEn: "1d change saturates at ±3%",
        source: "DefiLlama",
        signal: (i) =>
          i.tvlChange1dPct == null ? null : norm(i.tvlChange1dPct, 3),
        detail: (i) => ({
          pt:
            i.tvlChange1dPct == null
              ? ""
              : `${i.tvlChange1dPct >= 0 ? "+" : ""}${i.tvlChange1dPct.toFixed(2)}% em 1 dia`,
          en:
            i.tvlChange1dPct == null
              ? ""
              : `${i.tvlChange1dPct >= 0 ? "+" : ""}${i.tvlChange1dPct.toFixed(2)}% in 1 day`,
        }),
      },
    ],
  },
};

// ————————————————————————————————————————————————————————————————
// Runner genérico — executa o spec, nunca inventa o que falta
// ————————————————————————————————————————————————————————————————

function runReading(
  spec: ReadingSpec,
  inputs: ReadingInputs,
  sentence: (v: number, band: ReadingBand, conf: number) => {
    pt: string;
    en: string;
  },
): Reading {
  const acc = newAcc();
  for (const ing of spec.ingredients) {
    const d = ing.detail(inputs);
    add(
      acc,
      ing.id,
      ing.weight,
      ing.signal(inputs),
      ing.labelPt,
      ing.labelEn,
      d.pt,
      d.en,
    );
  }
  return finish(acc, spec.id, spec.signed, sentence);
}

// ————————————————————————————————————————————————————————————————
// 1. DIRECÇÃO — para onde vai o mercado
// ————————————————————————————————————————————————————————————————

export function computeDirection(i: ReadingInputs): Reading {
  return runReading(READING_SPECS.direction, i, (v, band) => {
    const map: Record<ReadingBand, { pt: string; en: string }> = {
      "muito-positivo": {
        pt: "O mercado sobe de forma ampla — a maioria das moedas grandes acompanha.",
        en: "Broad advance — most large coins are participating.",
      },
      positivo: {
        pt: "O mercado inclina para cima, mas sem euforia.",
        en: "Market tilts up, without euphoria.",
      },
      neutro: {
        pt: "Sem direcção clara — o mercado anda de lado.",
        en: "No clear direction — the market is sideways.",
      },
      negativo: {
        pt: "O mercado inclina para baixo.",
        en: "Market tilts down.",
      },
      "muito-negativo": {
        pt: "Queda ampla — a maioria das moedas grandes está a cair.",
        en: "Broad decline — most large coins are falling.",
      },
    };
    void v;
    return map[band];
  });
}

// ————————————————————————————————————————————————————————————————
// 2. RISCO — quão frágil está o mercado
// ————————————————————————————————————————————————————————————————

export function computeRisk(i: ReadingInputs): Reading {
  return runReading(READING_SPECS.risk, i, (v, band) => {
    const map: Record<ReadingBand, { pt: string; en: string }> = {
      positivo: {
        pt: "Pouca alavancagem em jogo — um movimento brusco teria pouco por onde alastrar.",
        en: "Little leverage in play — a sharp move would have little to cascade through.",
      },
      neutro: {
        pt: "Alavancagem dentro do normal.",
        en: "Leverage within normal range.",
      },
      negativo: {
        pt: "Alavancagem elevada — um movimento brusco pode forçar vendas em cadeia.",
        en: "Elevated leverage — a sharp move could force chain selling.",
      },
      "muito-negativo": {
        pt: "Mercado frágil: muita alavancagem e posicionamento aglomerado.",
        en: "Fragile market: heavy leverage and crowded positioning.",
      },
      "muito-positivo": {
        pt: "Pouca alavancagem em jogo.",
        en: "Little leverage in play.",
      },
    };
    void v;
    return map[band];
  });
}

// ————————————————————————————————————————————————————————————————
// 3. DINHEIRO — entra ou sai do sistema
// ————————————————————————————————————————————————————————————————

export function computeMoney(i: ReadingInputs): Reading {
  return runReading(READING_SPECS.money, i, (v, band) => {
    const map: Record<ReadingBand, { pt: string; en: string }> = {
      "muito-positivo": {
        pt: "Está a entrar dinheiro novo no sistema.",
        en: "Fresh money is entering the system.",
      },
      positivo: {
        pt: "Entrada ligeira de dinheiro.",
        en: "Mild money inflow.",
      },
      neutro: {
        pt: "O dinheiro não está claramente a entrar nem a sair.",
        en: "Money is neither clearly entering nor leaving.",
      },
      negativo: {
        pt: "Saída ligeira de dinheiro.",
        en: "Mild money outflow.",
      },
      "muito-negativo": {
        pt: "Está a sair dinheiro do sistema.",
        en: "Money is leaving the system.",
      },
    };
    void v;
    return map[band];
  });
}
