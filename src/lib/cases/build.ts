import {
  correlateBlurb,
  correlateMove,
  type CaseContext,
} from "@/lib/cases/correlate";
import type { CaseFile, Mover, SentimentSnapshot } from "@/lib/types";

export type { CaseContext };

/** Minimal context when only sentiment is available (API fallback). */
export function contextFromSentiment(
  sentiment: SentimentSnapshot,
  extras: Partial<CaseContext> = {},
): CaseContext {
  return {
    sentiment,
    btcChange24h: extras.btcChange24h ?? 0,
    ethChange24h: extras.ethChange24h ?? 0,
    marketCapChange24h: extras.marketCapChange24h ?? 0,
    breadthPct: extras.breadthPct ?? null,
    etfCombinedUsdM: extras.etfCombinedUsdM ?? null,
    longShortRatio: extras.longShortRatio ?? null,
    oiChange24hPct:
      extras.oiChange24hPct ?? sentiment.openInterest.change24hPct,
    defiTvlChange1d: extras.defiTvlChange1d ?? null,
    ...extras,
  };
}

export function buildCaseFile(
  mover: Mover,
  ctxOrSentiment?: CaseContext | SentimentSnapshot | null,
): CaseFile {
  const ctx = normalizeCtx(ctxOrSentiment);
  const corr = correlateMove(mover, ctx);

  return {
    id: mover.caseId ?? `case-${mover.id}`,
    assetId: mover.id,
    symbol: mover.symbol,
    observationPt: corr.observationPt,
    observationEn: corr.observationEn,
    change24h: mover.change24h,
    change1h: mover.change1h ?? null,
    change7d: mover.change7d ?? null,
    price: mover.price,
    hypotheses: corr.hypotheses.map((h) => ({
      id: h.id,
      labelPt: h.labelPt,
      labelEn: h.labelEn,
      confidence: h.confidence,
      forPt: h.forPt,
      forEn: h.forEn,
      againstPt: h.againstPt,
      againstEn: h.againstEn,
      sources: h.sources,
    })),
    evidence: corr.evidence,
    unclear: corr.unclear,
    conclusionPt: corr.conclusionPt,
    conclusionEn: corr.conclusionEn,
    quiz: {
      questionPt: "O que NÃO deves fazer ao ver um movimento >8%?",
      questionEn: "What should you NOT do when seeing an >8% move?",
      optionsPt: [
        "Abrir a análise e comparar evidências a favor e contra",
        "Aumentar imediatamente a posição por FOMO",
        "Verificar funding, OI e amplitude",
        "Aceitar «sem explicação clara» quando os dados não chegam",
      ],
      optionsEn: [
        "Open the case and compare evidence for and against",
        "Immediately size up from FOMO",
        "Check funding, OI and breadth",
        "Accept 'no clear explanation' when data is thin",
      ],
      answerIndex: 1,
    },
    createdAt: new Date().toISOString(),
  };
}

export function buildDailyCases(
  movers: Mover[],
  ctxOrSentiment?: CaseContext | SentimentSnapshot | null,
): CaseFile[] {
  const pool = [...movers].sort(
    (a, b) => Math.abs(b.change24h) - Math.abs(a.change24h),
  );
  return pool.slice(0, 8).map((m) => buildCaseFile(m, ctxOrSentiment));
}

export function annotateMoverCauses(
  movers: Mover[],
  ctx: CaseContext,
): Mover[] {
  return movers.map((m) => {
    const blurb = correlateBlurb(m, ctx);
    return { ...m, causePt: blurb.pt, causeEn: blurb.en };
  });
}

function normalizeCtx(
  ctxOrSentiment?: CaseContext | SentimentSnapshot | null,
): CaseContext {
  if (!ctxOrSentiment) {
    return contextFromSentiment({
      fearGreed: { value: 50, classification: "Neutral", timestamp: "" },
      funding: { rate: 0, annualized: 0, bias: "neutral" },
      openInterest: { value: 0, change24hPct: null },
      updatedAt: "",
    });
  }
  if ("sentiment" in ctxOrSentiment) {
    return ctxOrSentiment;
  }
  return contextFromSentiment(ctxOrSentiment);
}
