import { ATLAS } from "@/lib/content/atlas";
import type { DayDelta } from "@/lib/history/deltas";
import { utcToday } from "@/lib/history/series";
import type {
  BriefItem,
  CaseFile,
  MarketSnapshot,
  RegimeResult,
  SentimentSnapshot,
} from "@/lib/types";

/**
 * Fixed daily ritual structure (always the same slots):
 * 1. Postura
 * 2. O que mudou desde ontem
 * 3. Movimento com contexto (Caso & Efeito) — or quiet
 * 4. Lição do café (Atlas)
 * 5. Aviso anti-hype
 *
 * Never invents numbers — only formats computed signals.
 */

export type RitualLesson = {
  slug: string;
  titlePt: string;
  titleEn: string;
  summaryPt: string;
  summaryEn: string;
};

export type RitualDont = { pt: string; en: string };

export type RitualMover = {
  symbol: string;
  assetId: string;
  change24h: number;
  causePt: string;
  causeEn: string;
  caseId?: string;
};

export type DailyRitual = {
  id: string;
  date: string;
  posture: RegimeResult["posture"];
  score: number;
  headlinePt: string;
  headlineEn: string;
  summaryPt: string;
  summaryEn: string;
  /** True when no notable D2 deltas and no large mover */
  quietDay: boolean;
  deltas: DayDelta[];
  notableDeltas: DayDelta[];
  mover: RitualMover | null;
  lesson: RitualLesson;
  dont: RitualDont;
  /** Legacy BriefItem fields for /api/brief compatibility */
  fact: string;
  whyItMattersPt: string;
  whyItMattersEn: string;
  uncertainty: string;
  watchNext: string;
  sources: { title: string; url: string }[];
  credibilityTier: "A" | "B" | "C";
  relatedMetrics: string[];
  generatedAt: string;
  mode: "deterministic" | "llm";
};

const ANTI_HYPE: RitualDont[] = [
  {
    pt: "Uma subida de 20% num token fino não é um sinal de mercado — é liquidez fraca a falar alto.",
    en: "A 20% rip in a thin token is not a market signal — it is weak liquidity talking loudly.",
  },
  {
    pt: "Funding positivo não é 'bullish garantido'. É o preço que os longs pagam agora — e muda depressa.",
    en: "Positive funding is not 'guaranteed bullish'. It is what longs pay right now — and it flips fast.",
  },
  {
    pt: "Medo extremo não é ordem de compra. É um termómetro — não um interruptor.",
    en: "Extreme fear is not a buy order. It is a thermometer — not a switch.",
  },
  {
    pt: "Um ETF com um dia verde não redefine o ciclo. Olha a série, não o tweet.",
    en: "One green ETF day does not redefine the cycle. Read the series, not the tweet.",
  },
  {
    pt: "Se precisas de alavancagem para 'não perder o comboio', o comboio provavelmente não é teu.",
    en: "If you need leverage to 'not miss the train', the train is probably not yours.",
  },
  {
    pt: "Correlação com BTC ≠ causalidade. Casos CLAREZA mostram hipóteses, não certezas.",
    en: "Correlation with BTC ≠ causation. CLAREZA cases show hypotheses, not certainties.",
  },
  {
    pt: "Volume sem contexto de profundidade é ruído. Pergunta sempre: quem está do outro lado?",
    en: "Volume without depth context is noise. Always ask: who is on the other side?",
  },
];

function dayIndex(date: string): number {
  let h = 0;
  for (let i = 0; i < date.length; i++) h = (h * 31 + date.charCodeAt(i)) >>> 0;
  return h;
}

function pickLesson(date: string): RitualLesson {
  const beginners = ATLAS.filter((c) => c.level === "beginner");
  const pool = beginners.length ? beginners : ATLAS;
  const c = pool[dayIndex(date) % pool.length];
  return {
    slug: c.slug,
    titlePt: c.titlePt,
    titleEn: c.titleEn,
    summaryPt: c.summaryPt,
    summaryEn: c.summaryEn,
  };
}

function pickDont(date: string): RitualDont {
  return ANTI_HYPE[dayIndex(date) % ANTI_HYPE.length];
}

function formatDeltaLine(d: DayDelta, locale: "pt" | "en"): string {
  const label = locale === "pt" ? d.labelPt : d.labelEn;
  const sign = d.absChange >= 0 ? "+" : "";
  if (d.unit === "rate") {
    return `${label}: ${sign}${(d.absChange * 100).toFixed(4)} pp (${(d.curr * 100).toFixed(4)}%)`;
  }
  if (d.unit === "usd_m") {
    return `${label}: ${sign}${d.absChange.toFixed(0)}M → ${d.curr.toFixed(0)}M`;
  }
  if (d.unit === "index" || d.unit === "pct") {
    const pct =
      d.pctChange != null ? ` (${sign}${d.pctChange.toFixed(1)}%)` : "";
    return `${label}: ${sign}${d.absChange.toFixed(d.unit === "index" ? 0 : 1)}${d.unit === "pct" ? " pp" : ""}${pct}`;
  }
  if (d.unit === "usd") {
    const pct =
      d.pctChange != null ? ` (${sign}${d.pctChange.toFixed(1)}%)` : "";
    return `${label}: ${sign}${d.pctChange?.toFixed(1) ?? "—"}%${pct}`;
  }
  return `${label}: ${sign}${d.absChange.toFixed(2)}`;
}

function pickMover(
  market: MarketSnapshot,
  cases: CaseFile[],
): RitualMover | null {
  const pool = [...market.movers.gainers, ...market.movers.losers];
  if (!pool.length) return null;
  const top = [...pool].sort(
    (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
  )[0];
  // Quiet price day for majors: require meaningful move
  if (Math.abs(top.change24h) < 3) return null;
  const c = cases.find((x) => x.assetId === top.id || x.symbol === top.symbol);
  return {
    symbol: top.symbol,
    assetId: top.id,
    change24h: top.change24h,
    causePt: top.causePt,
    causeEn: top.causeEn,
    caseId: c?.id ?? top.caseId,
  };
}

export function buildDailyRitual(args: {
  market: MarketSnapshot;
  regime: RegimeResult;
  sentiment: SentimentSnapshot;
  deltas: DayDelta[];
  cases?: CaseFile[];
}): DailyRitual {
  const { market, regime, sentiment, deltas } = args;
  const date = utcToday();
  const notableDeltas = deltas.filter((d) => d.notable).slice(0, 5);
  const mover = pickMover(market, args.cases ?? []);
  const quietDay = notableDeltas.length === 0 && mover == null;
  const lesson = pickLesson(date);
  const dont = pickDont(date);

  const deltaFactPt = quietDay
    ? "Desde ontem: nada de material nas séries centrais — dia quieto."
    : `Desde ontem: ${notableDeltas.map((d) => formatDeltaLine(d, "pt")).join(" · ")}`;
  const deltaFactEn = quietDay
    ? "Since yesterday: nothing material in the core series — a quiet day."
    : `Since yesterday: ${notableDeltas.map((d) => formatDeltaLine(d, "en")).join(" · ")}`;

  const moverFactPt = mover
    ? ` Maior movimento: ${mover.symbol} ${mover.change24h >= 0 ? "+" : ""}${mover.change24h.toFixed(1)}%.`
    : "";

  const fact = `BTC ${market.btc.change24h >= 0 ? "+" : ""}${market.btc.change24h.toFixed(2)}% · F&G ${sentiment.fearGreed.value} · Dom ${market.global.btcDominance.toFixed(1)}%. ${deltaFactPt}${moverFactPt}`;

  const whyItMattersPt = quietDay
    ? `${regime.headlinePt} Dia sem catalisador óbvio nas séries — o trabalho é não inventar narrativa.`
    : `${regime.headlinePt} ${deltaFactPt}${mover ? ` ${mover.causePt}` : ""}`;
  const whyItMattersEn = quietDay
    ? `${regime.headlineEn} No obvious catalyst in the series — the job is not inventing a narrative.`
    : `${regime.headlineEn} ${deltaFactEn}${mover ? ` ${mover.causeEn}` : ""}`;

  return {
    id: `ritual-${date}`,
    date,
    posture: regime.posture,
    score: regime.score,
    headlinePt: regime.headlinePt,
    headlineEn: regime.headlineEn,
    summaryPt: regime.summaryPt,
    summaryEn: regime.summaryEn,
    quietDay,
    deltas,
    notableDeltas,
    mover,
    lesson,
    dont,
    fact,
    whyItMattersPt,
    whyItMattersEn,
    uncertainty:
      "Séries diárias podem atrasar vs. o tape live; funding e liquidações são proxies.",
    watchNext: quietDay
      ? "Se o dia continuar quieto: funding BTC, fluxo ETF e amplitude — sem forçar uma história."
      : "Confirma se o movimento tem volume e se o Caso & Efeito mantém a hipótese.",
    sources: [
      { title: "CoinGecko", url: "https://www.coingecko.com/" },
      {
        title: "Alternative.me Fear & Greed",
        url: "https://alternative.me/crypto/fear-and-greed-index/",
      },
      { title: "Histórico CLAREZA (D2)", url: "/api/history/context" },
    ],
    credibilityTier: "B",
    relatedMetrics: notableDeltas.map((d) => d.metricId),
    generatedAt: new Date().toISOString(),
    mode: "deterministic",
  };
}

/** Map ritual → legacy BriefItem for older consumers. */
export function ritualToBriefItem(ritual: DailyRitual): BriefItem {
  return {
    id: ritual.id,
    fact: ritual.fact,
    whyItMattersPt: ritual.whyItMattersPt,
    whyItMattersEn: ritual.whyItMattersEn,
    uncertainty: ritual.uncertainty,
    watchNext: ritual.watchNext,
    sources: ritual.sources,
    credibilityTier: ritual.credibilityTier,
    relatedMetrics: ritual.relatedMetrics,
    generatedAt: ritual.generatedAt,
  };
}
