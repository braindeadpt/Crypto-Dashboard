import type { EvidenceChip, Mover, SentimentSnapshot } from "@/lib/types";

/**
 * Case & Effect correlation context.
 * All numbers must come from live fetches / snapshots — never invented.
 * Language produced by callers must say "consistent with", never "caused by".
 */
export type CaseContext = {
  sentiment: SentimentSnapshot;
  btcChange24h: number;
  ethChange24h: number;
  marketCapChange24h: number;
  breadthPct: number | null;
  etfCombinedUsdM: number | null;
  longShortRatio: number | null;
  oiChange24hPct: number | null;
  defiTvlChange1d: number | null;
};

export type CaseHypothesis = {
  id: string;
  labelPt: string;
  labelEn: string;
  /** 0–1 provisional weight from signal agreement — not a probability of causation */
  confidence: number;
  forPt: string[];
  forEn: string[];
  againstPt: string[];
  againstEn: string[];
  sources: { title: string; url: string }[];
};

export type CorrelationResult = {
  hypotheses: CaseHypothesis[];
  evidence: EvidenceChip[];
  /** True when no hypothesis clears the clarity bar */
  unclear: boolean;
  summaryPt: string;
  summaryEn: string;
  observationPt: string;
  observationEn: string;
  conclusionPt: string;
  conclusionEn: string;
};

const CG = "https://www.coingecko.com";
const FNG = "https://alternative.me/crypto/fear-and-greed-index/";
const BINANCE_FAPI = "https://www.binance.com/en/futures";
const FARSIDE = "https://farside.co.uk/btc/";
const DEFILLAMA = "https://defillama.com";

function fmtPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function sameSign(a: number, b: number) {
  return a === 0 || b === 0 ? false : Math.sign(a) === Math.sign(b);
}

/**
 * Correlate available board signals with an asset move.
 * Deterministic — no LLM. Does not assert causality.
 *
 * LLM BOUNDARY: if a future editorial pass rewrites prose, it may ONLY rephrase
 * hypotheses/evidence already produced here. It must never invent numbers,
 * news headlines, or causal claims. Without a key, this function is the product.
 */
export function correlateMove(
  mover: Mover,
  ctx: CaseContext,
): CorrelationResult {
  const up = mover.change24h >= 0;
  const abs = Math.abs(mover.change24h);
  const isBtc = mover.id === "bitcoin" || mover.symbol.toUpperCase() === "BTC";
  const isEth = mover.id === "ethereum" || mover.symbol.toUpperCase() === "ETH";
  const funding = ctx.sentiment.funding.rate;
  const fundingBps = funding * 10000;
  const fng = ctx.sentiment.fearGreed.value;
  const oi = ctx.oiChange24hPct;
  const ls = ctx.longShortRatio;
  const btc = ctx.btcChange24h;
  const breadth = ctx.breadthPct;
  const etf = ctx.etfCombinedUsdM;
  const tvl = ctx.defiTvlChange1d;
  const volVsMcap =
    mover.marketCap > 0 ? mover.volume24h / mover.marketCap : null;

  const evidence: EvidenceChip[] = [
    {
      id: "chg",
      label: "Variação 24h",
      labelEn: "24h change",
      value: fmtPct(mover.change24h),
      tone: up ? "up" : "down",
    },
    {
      id: "vol",
      label: "Volume 24h",
      labelEn: "24h volume",
      value: `$${(mover.volume24h / 1e6).toFixed(1)}M`,
      tone: "neutral",
    },
    {
      id: "btc",
      label: "BTC 24h",
      labelEn: "BTC 24h",
      value: fmtPct(btc),
      tone: btc >= 0 ? "up" : "down",
    },
    {
      id: "fng",
      label: "Medo & Ganância",
      labelEn: "Fear & Greed",
      value: String(Math.round(fng)),
      tone: fng <= 30 ? "warn" : fng >= 70 ? "down" : "neutral",
    },
    {
      id: "fund",
      label: "Funding BTC",
      labelEn: "BTC funding",
      value: `${(funding * 100).toFixed(4)}%`,
      tone: Math.abs(fundingBps) >= 2 ? "warn" : "neutral",
    },
  ];
  if (oi != null) {
    evidence.push({
      id: "oi",
      label: "OI Δ24h",
      labelEn: "OI Δ24h",
      value: fmtPct(oi),
      tone: "neutral",
    });
  }
  if (ls != null) {
    evidence.push({
      id: "ls",
      label: "L/S BTC",
      labelEn: "BTC L/S",
      value: ls.toFixed(2),
      tone: ls >= 1.6 || ls <= 0.7 ? "warn" : "neutral",
    });
  }
  if (breadth != null) {
    evidence.push({
      id: "breadth",
      label: "Amplitude",
      labelEn: "Breadth",
      value: `${breadth}%`,
      tone: breadth <= 40 ? "warn" : "neutral",
    });
  }
  if (etf != null && (isBtc || isEth)) {
    evidence.push({
      id: "etf",
      label: "ETF BTC+ETH 1d",
      labelEn: "ETF BTC+ETH 1d",
      value: `${etf >= 0 ? "+" : ""}${etf.toFixed(0)}M`,
      tone: etf >= 0 ? "up" : "down",
    });
  }
  if (tvl != null) {
    evidence.push({
      id: "tvl",
      label: "TVL DeFi 1d",
      labelEn: "DeFi TVL 1d",
      value: fmtPct(tvl),
      tone: tvl >= 0 ? "up" : "down",
    });
  }

  const hyps: CaseHypothesis[] = [];

  // --- 1. Leverage / derivatives -------------------------------------------
  {
    const forPt: string[] = [];
    const forEn: string[] = [];
    const againstPt: string[] = [];
    const againstEn: string[] = [];
    let score = 0.15;

    if (up && fundingBps >= 2) {
      score += 0.2;
      forPt.push(`Funding BTC positivo (${(funding * 100).toFixed(4)}%) — lado long a pagar`);
      forEn.push(`Positive BTC funding (${(funding * 100).toFixed(4)}%) — longs paying`);
    } else if (!up && fundingBps <= -2) {
      score += 0.2;
      forPt.push(`Funding BTC negativo (${(funding * 100).toFixed(4)}%) — lado short a pagar`);
      forEn.push(`Negative BTC funding (${(funding * 100).toFixed(4)}%) — shorts paying`);
    } else if (up && fundingBps <= -2) {
      againstPt.push("Funding negativo enquanto o preço sobe — menos típico de chase long");
      againstEn.push("Negative funding while price rises — less typical of long chase");
      score -= 0.05;
    } else if (!up && fundingBps >= 2) {
      againstPt.push("Funding positivo enquanto o preço cai — possível desfazer de longs");
      againstEn.push("Positive funding while price falls — possible long unwind");
      score += 0.1;
      forPt.push("Funding ainda positivo com queda — consistente com liquidação / desfazer de longs");
      forEn.push("Still-positive funding on a drop — consistent with long liquidation / unwind");
    }

    if (oi != null && Math.abs(oi) >= 3 && sameSign(oi, mover.change24h)) {
      score += 0.18;
      forPt.push(`OI a mover-se com o preço (Δ ${fmtPct(oi)}) — alavancagem a acompanhar`);
      forEn.push(`OI moving with price (Δ ${fmtPct(oi)}) — leverage accompanying the move`);
    } else if (oi != null && Math.abs(oi) >= 3 && !sameSign(oi, mover.change24h)) {
      score += 0.12;
      forPt.push(`OI em sentido oposto ao preço (Δ ${fmtPct(oi)}) — possível short/long squeeze`);
      forEn.push(`OI opposite to price (Δ ${fmtPct(oi)}) — possible short/long squeeze`);
    } else if (oi == null) {
      againstPt.push("Sem variação de OI disponível para este activo");
      againstEn.push("No OI change available for this asset");
    }

    if (ls != null && up && ls >= 1.5) {
      score += 0.08;
      forPt.push(`L/S elevado (${ls.toFixed(2)}) — contas long crowding`);
      forEn.push(`Elevated L/S (${ls.toFixed(2)}) — long account crowding`);
    } else if (ls != null && !up && ls <= 0.75) {
      score += 0.08;
      forPt.push(`L/S baixo (${ls.toFixed(2)}) — contas short crowding`);
      forEn.push(`Low L/S (${ls.toFixed(2)}) — short account crowding`);
    }

    if (abs < 3) {
      score -= 0.1;
      againstPt.push("Movimento pequeno — sinal de derivados pouco discriminativo");
      againstEn.push("Small move — derivatives signal is weakly discriminative");
    }

    hyps.push({
      id: "leverage",
      labelPt: "Consistente com fluxo de alavancagem (derivados)",
      labelEn: "Consistent with leveraged / derivatives flow",
      confidence: clamp01(score),
      forPt,
      forEn,
      againstPt,
      againstEn,
      sources: [
        { title: "Binance Futures", url: BINANCE_FAPI },
      ],
    });
  }

  // --- 2. Spot / institutional (ETF) — mainly BTC/ETH -----------------------
  {
    const forPt: string[] = [];
    const forEn: string[] = [];
    const againstPt: string[] = [];
    const againstEn: string[] = [];
    let score = 0.1;

    if (!(isBtc || isEth)) {
      againstPt.push("ETF spot BTC/ETH não aplicam directamente a este activo");
      againstEn.push("Spot BTC/ETH ETFs do not apply directly to this asset");
      score = 0.05;
    } else if (etf == null) {
      againstPt.push("Snapshot ETF indisponível — não há evidência spot institucional hoje");
      againstEn.push("ETF snapshot unavailable — no institutional spot evidence today");
      score = 0.08;
    } else {
      if (up && etf > 50) {
        score += 0.28;
        forPt.push(`Entradas ETF combinadas +${etf.toFixed(0)}M USD — procura spot institucional`);
        forEn.push(`Combined ETF inflows +${etf.toFixed(0)}M USD — institutional spot demand`);
      } else if (!up && etf < -50) {
        score += 0.28;
        forPt.push(`Saídas ETF combinadas ${etf.toFixed(0)}M USD — oferta spot institucional`);
        forEn.push(`Combined ETF outflows ${etf.toFixed(0)}M USD — institutional spot supply`);
      } else if (up && etf < -50) {
        againstPt.push("ETF a sair enquanto o preço sobe — menos consistente com bid spot");
        againstEn.push("ETF outflows while price rises — less consistent with spot bid");
        score -= 0.05;
      } else if (!up && etf > 50) {
        againstPt.push("ETF a entrar enquanto o preço cai — pressão pode ser alavancagem/outro");
        againstEn.push("ETF inflows while price falls — pressure may be leverage/other");
        score -= 0.05;
      } else {
        againstPt.push(`Fluxo ETF perto de neutro (${etf.toFixed(0)}M) — pouco explicativo`);
        againstEn.push(`Near-flat ETF flow (${etf.toFixed(0)}M) — weakly explanatory`);
      }
    }

    hyps.push({
      id: "spot-etf",
      labelPt: "Consistente com fluxo spot / institucional (ETF)",
      labelEn: "Consistent with spot / institutional (ETF) flow",
      confidence: clamp01(score),
      forPt,
      forEn,
      againstPt,
      againstEn,
      sources: [{ title: "Farside Investors", url: FARSIDE }],
    });
  }

  // --- 3. Macro / market-wide ----------------------------------------------
  {
    const forPt: string[] = [];
    const forEn: string[] = [];
    const againstPt: string[] = [];
    const againstEn: string[] = [];
    let score = 0.12;

    const corrBtc = sameSign(mover.change24h, btc) && Math.abs(btc) >= 1;
    const gapVsBtc = Math.abs(mover.change24h - btc);

    if (corrBtc && gapVsBtc <= 3) {
      score += 0.25;
      forPt.push(`Move alinhado com BTC (${fmtPct(btc)}, gap ${gapVsBtc.toFixed(1)}pp)`);
      forEn.push(`Aligned with BTC (${fmtPct(btc)}, gap ${gapVsBtc.toFixed(1)}pp)`);
    } else if (!isBtc && gapVsBtc >= 6) {
      againstPt.push(`Desvio forte vs BTC (gap ${gapVsBtc.toFixed(1)}pp) — menos macro puro`);
      againstEn.push(`Large gap vs BTC (${gapVsBtc.toFixed(1)}pp) — less pure macro`);
      score -= 0.08;
    }

    if (breadth != null && !up && breadth <= 40) {
      score += 0.15;
      forPt.push(`Amplitude estreita (${breadth}% em alta) — tape frágil de mercado`);
      forEn.push(`Narrow breadth (${breadth}% green) — fragile market tape`);
    } else if (breadth != null && up && breadth >= 65) {
      score += 0.12;
      forPt.push(`Amplitude larga (${breadth}% em alta) — participação ampla`);
      forEn.push(`Wide breadth (${breadth}% green) — broad participation`);
    }

    if (Math.abs(ctx.marketCapChange24h) >= 2 && sameSign(ctx.marketCapChange24h, mover.change24h)) {
      score += 0.1;
      forPt.push(`Cap. de mercado ${fmtPct(ctx.marketCapChange24h)} no mesmo sentido`);
      forEn.push(`Market cap ${fmtPct(ctx.marketCapChange24h)} in the same direction`);
    }

    if ((fng <= 30 && !up) || (fng >= 70 && up)) {
      score += 0.08;
      forPt.push(`Sentimento (${Math.round(fng)}) alinhado com a direcção do preço`);
      forEn.push(`Sentiment (${Math.round(fng)}) aligned with price direction`);
    }

    hyps.push({
      id: "macro",
      labelPt: "Consistente com risco macro / mercado amplo",
      labelEn: "Consistent with broad market / macro risk",
      confidence: clamp01(score),
      forPt,
      forEn,
      againstPt,
      againstEn,
      sources: [
        { title: "CoinGecko Global", url: `${CG}/en/global-charts` },
        { title: "Fear & Greed", url: FNG },
      ],
    });
  }

  // --- 4. Idiosyncratic / asset-specific -----------------------------------
  {
    const forPt: string[] = [];
    const forEn: string[] = [];
    const againstPt: string[] = [];
    const againstEn: string[] = [];
    let score = 0.1;
    const gapVsBtc = Math.abs(mover.change24h - btc);

    if (!isBtc && gapVsBtc >= 5) {
      score += 0.22;
      forPt.push(`Desvio vs BTC de ${gapVsBtc.toFixed(1)}pp — componente específica do activo`);
      forEn.push(`${gapVsBtc.toFixed(1)}pp gap vs BTC — asset-specific component`);
    } else if (isBtc) {
      againstPt.push("BTC é a âncora macro — ‘idiosincrático’ aplica-se menos");
      againstEn.push("BTC is the macro anchor — ‘idiosyncratic’ applies less");
      score = 0.08;
    } else {
      againstPt.push("Movimento próximo do BTC — pouca evidência idiosincrática nos dados");
      againstEn.push("Move close to BTC — little idiosyncratic evidence in the data");
    }

    if (volVsMcap != null && volVsMcap >= 0.25) {
      score += 0.15;
      forPt.push(`Volume/mcap ${(volVsMcap * 100).toFixed(0)}% — rotação / especulação elevada`);
      forEn.push(`Volume/mcap ${(volVsMcap * 100).toFixed(0)}% — elevated rotation / speculation`);
    }

    if (tvl != null && Math.abs(tvl) >= 2 && sameSign(tvl, mover.change24h) && !isBtc) {
      score += 0.08;
      forPt.push(`TVL DeFi ${fmtPct(tvl)} no mesmo sentido — possível fluxo on-chain`);
      forEn.push(`DeFi TVL ${fmtPct(tvl)} same direction — possible on-chain flow`);
    }

    hyps.push({
      id: "idio",
      labelPt: "Consistente com factor específico do activo",
      labelEn: "Consistent with an asset-specific factor",
      confidence: clamp01(score),
      forPt,
      forEn,
      againstPt,
      againstEn,
      sources: [
        { title: "CoinGecko", url: `${CG}/en/coins/${mover.id}` },
        { title: "DefiLlama", url: DEFILLAMA },
      ],
    });
  }

  hyps.sort((a, b) => b.confidence - a.confidence);

  // Clarity bar: need a lead with real supporting bullets and abs move ≥ 2%
  const lead = hyps[0];
  const leadHasFor = (lead?.forPt.length ?? 0) > 0;
  const unclear =
    abs < 2 ||
    !lead ||
    !leadHasFor ||
    lead.confidence < 0.28 ||
    hyps.filter((h) => h.confidence >= 0.28 && h.forPt.length > 0).length === 0;

  const observationPt = `${mover.name} (${mover.symbol}) variou ${fmtPct(mover.change24h)} nas últimas 24h, a ~$${mover.price.toLocaleString("en")}.`;
  const observationEn = `${mover.name} (${mover.symbol}) moved ${fmtPct(mover.change24h)} in the last 24h, near $${mover.price.toLocaleString("en")}.`;

  let summaryPt: string;
  let summaryEn: string;
  let conclusionPt: string;
  let conclusionEn: string;

  if (unclear) {
    summaryPt = "Sem explicação clara nos dados disponíveis.";
    summaryEn = "No clear explanation in the available data.";
    conclusionPt =
      "Os sinais cruzados (funding, OI, amplitude, ETF, correlação com BTC) não bastam para uma leitura confiável. Isto não é falha — é honestidade: correlação fraca ≠ causa. Volta quando houver movimento e confirmação.";
    conclusionEn =
      "Crossed signals (funding, OI, breadth, ETF, BTC correlation) are not enough for a reliable read. That is honesty, not failure: weak correlation ≠ cause. Revisit when the move and confirmation are clearer.";
  } else {
    summaryPt = `Leitura líder: ${lead.labelPt} (peso ${Math.round(lead.confidence * 100)}%).`;
    summaryEn = `Leading read: ${lead.labelEn} (weight ${Math.round(lead.confidence * 100)}%).`;
    conclusionPt = `${lead.labelPt} é a hipótese mais consistente com os números disponíveis (peso ${Math.round(lead.confidence * 100)}%). Isto é correlação temporal de sinais — não prova de causa. Contradições: ${(lead.againstPt[0] ?? "nenhuma forte assinalada")}.`;
    conclusionEn = `${lead.labelEn} is the hypothesis most consistent with available numbers (weight ${Math.round(lead.confidence * 100)}%). This is temporal signal correlation — not proof of cause. Contradictions: ${(lead.againstEn[0] ?? "none strong noted")}.`;
  }

  return {
    hypotheses: hyps,
    evidence,
    unclear,
    summaryPt,
    summaryEn,
    observationPt,
    observationEn,
    conclusionPt,
    conclusionEn,
  };
}

/** Short blurb for mover lists — still correlation language, never fake catalysts. */
export function correlateBlurb(
  mover: Mover,
  ctx: CaseContext,
): { pt: string; en: string } {
  const r = correlateMove(mover, ctx);
  if (r.unclear) {
    return {
      pt: "Sem leitura clara nos sinais disponíveis.",
      en: "No clear read in available signals.",
    };
  }
  return {
    pt: r.summaryPt,
    en: r.summaryEn,
  };
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
