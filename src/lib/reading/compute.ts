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
// 1. DIRECÇÃO — para onde vai o mercado
// ————————————————————————————————————————————————————————————————

export function computeDirection(i: ReadingInputs): Reading {
  const acc = newAcc();

  // Amplitude pesa mais que qualquer preço isolado: uma subida do BTC com 30%
  // de amplitude é uma subida do BTC, não do mercado.
  add(
    acc,
    "breadth",
    40,
    i.breadthPct == null ? null : norm(i.breadthPct - 50, 35),
    "Amplitude",
    "Breadth",
    i.breadthPct == null ? "" : `${i.breadthPct}% das maiores em alta`,
    i.breadthPct == null ? "" : `${i.breadthPct}% of majors up`,
  );

  add(
    acc,
    "btc",
    30,
    i.btcChange24h == null ? null : norm(i.btcChange24h, 5),
    "Bitcoin 24h",
    "Bitcoin 24h",
    i.btcChange24h == null ? "" : `${i.btcChange24h.toFixed(2)}%`,
    i.btcChange24h == null ? "" : `${i.btcChange24h.toFixed(2)}%`,
  );

  add(
    acc,
    "eth",
    15,
    i.ethChange24h == null ? null : norm(i.ethChange24h, 5),
    "Ethereum 24h",
    "Ethereum 24h",
    i.ethChange24h == null ? "" : `${i.ethChange24h.toFixed(2)}%`,
    i.ethChange24h == null ? "" : `${i.ethChange24h.toFixed(2)}%`,
  );

  add(
    acc,
    "mcap",
    15,
    i.marketCapChange24h == null ? null : norm(i.marketCapChange24h, 4),
    "Capitalização total",
    "Total market cap",
    i.marketCapChange24h == null ? "" : `${i.marketCapChange24h.toFixed(2)}%`,
    i.marketCapChange24h == null ? "" : `${i.marketCapChange24h.toFixed(2)}%`,
  );

  return finish(acc, "direction", true, (v, band) => {
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
  const acc = newAcc();

  // Só magnitude: todos os sinais entram em 0..1, nunca negativos.
  // Alavancagem a crescer é o melhor preditor gratuito de cascata.
  add(
    acc,
    "oi",
    30,
    i.oiChange24hPct == null
      ? null
      : clamp(Math.abs(i.oiChange24hPct) / 8, 0, 1),
    "Alavancagem",
    "Leverage",
    i.oiChange24hPct == null
      ? ""
      : `posições abertas ${i.oiChange24hPct >= 0 ? "+" : ""}${i.oiChange24hPct.toFixed(1)}% em 24h`,
    i.oiChange24hPct == null
      ? ""
      : `open interest ${i.oiChange24hPct >= 0 ? "+" : ""}${i.oiChange24hPct.toFixed(1)}% in 24h`,
  );

  // Funding extremo = quem está posicionado paga caro para lá continuar.
  add(
    acc,
    "funding",
    25,
    i.fundingRate == null
      ? null
      : clamp(Math.abs(i.fundingRate * 10000) / 5, 0, 1),
    "Custo da alavancagem",
    "Funding",
    i.fundingRate == null ? "" : `${(i.fundingRate * 100).toFixed(4)}% por período`,
    i.fundingRate == null ? "" : `${(i.fundingRate * 100).toFixed(4)}% per period`,
  );

  add(
    acc,
    "vol",
    20,
    i.realizedVolPct == null ? null : clamp(i.realizedVolPct / 90, 0, 1),
    "Volatilidade",
    "Volatility",
    i.realizedVolPct == null ? "" : `${i.realizedVolPct.toFixed(0)}% anualizada`,
    i.realizedVolPct == null ? "" : `${i.realizedVolPct.toFixed(0)}% annualised`,
  );

  // Desequilíbrio de posicionamento: 1.0 é equilíbrio, longe disso é aglomeração.
  add(
    acc,
    "ls",
    15,
    i.longShortRatio == null
      ? null
      : clamp(Math.abs(i.longShortRatio - 1) / 1.2, 0, 1),
    "Aglomeração",
    "Crowding",
    i.longShortRatio == null ? "" : `rácio long/short ${i.longShortRatio.toFixed(2)}`,
    i.longShortRatio == null ? "" : `long/short ratio ${i.longShortRatio.toFixed(2)}`,
  );

  add(
    acc,
    "liq",
    10,
    i.liquidationsUsd == null
      ? null
      : clamp(i.liquidationsUsd / 50_000_000, 0, 1),
    "Liquidações",
    "Liquidations",
    i.liquidationsUsd == null
      ? ""
      : `${(i.liquidationsUsd / 1_000_000).toFixed(1)} M USD na janela`,
    i.liquidationsUsd == null
      ? ""
      : `${(i.liquidationsUsd / 1_000_000).toFixed(1)}M USD in window`,
  );

  return finish(acc, "risk", false, (v, band) => {
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
  const acc = newAcc();

  // Oferta de stablecoins é o melhor indicador de dinheiro NOVO a entrar:
  // emitir stables é o passo anterior a comprar.
  add(
    acc,
    "stables",
    45,
    i.stableSupply7dPct == null ? null : norm(i.stableSupply7dPct, 1.5),
    "Oferta de stablecoins",
    "Stablecoin supply",
    i.stableSupply7dPct == null
      ? ""
      : `${i.stableSupply7dPct >= 0 ? "+" : ""}${i.stableSupply7dPct.toFixed(2)}% em 7 dias`,
    i.stableSupply7dPct == null
      ? ""
      : `${i.stableSupply7dPct >= 0 ? "+" : ""}${i.stableSupply7dPct.toFixed(2)}% in 7 days`,
  );

  add(
    acc,
    "etf",
    40,
    i.etfCombinedUsdM == null ? null : norm(i.etfCombinedUsdM, 400),
    "Fluxos ETF",
    "ETF flows",
    i.etfCombinedUsdM == null
      ? ""
      : `${i.etfCombinedUsdM >= 0 ? "+" : ""}${i.etfCombinedUsdM.toFixed(0)} M USD no dia`,
    i.etfCombinedUsdM == null
      ? ""
      : `${i.etfCombinedUsdM >= 0 ? "+" : ""}${i.etfCombinedUsdM.toFixed(0)}M USD on the day`,
  );

  add(
    acc,
    "tvl",
    15,
    i.tvlChange1dPct == null ? null : norm(i.tvlChange1dPct, 3),
    "Depósitos on-chain",
    "On-chain deposits",
    i.tvlChange1dPct == null
      ? ""
      : `${i.tvlChange1dPct >= 0 ? "+" : ""}${i.tvlChange1dPct.toFixed(2)}% em 1 dia`,
    i.tvlChange1dPct == null
      ? ""
      : `${i.tvlChange1dPct >= 0 ? "+" : ""}${i.tvlChange1dPct.toFixed(2)}% in 1 day`,
  );

  return finish(acc, "money", true, (v, band) => {
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
