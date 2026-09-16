import {
  computeDirection,
  computeMoney,
  computeRisk,
  type ReadingInputs,
} from "@/lib/reading/compute";
import type {
  HeadlineClaim,
  Reading,
  ReadingSet,
} from "@/lib/reading/types";

export type {
  HeadlineClaim,
  Reading,
  ReadingBand,
  ReadingContributor,
  ReadingGap,
  ReadingId,
  ReadingSet,
} from "@/lib/reading/types";
export {
  READING_BANDS,
  READING_SPECS,
  type ReadingIngredientSpec,
  type ReadingInputs,
  type ReadingSpec,
} from "@/lib/reading/compute";
export { computeDirection, computeMoney, computeRisk };

/** Abaixo disto a leitura não é apresentada como afirmação. */
export const LOW_CONFIDENCE = 0.6;

/** Âncoras de /metodologia por leitura — a fonte linkável de cada conta (R9). */
export const READING_METHOD_ANCHOR: Record<Reading["id"], string> = {
  direction: "direccao",
  risk: "risco",
  money: "dinheiro",
};

/**
 * A frase do topo do Nível 1.
 *
 * Junta as três leituras numa só afirmação em português comum. A ordem não é
 * arbitrária: primeiro o que o leitor vê no preço (direcção), depois o que
 * explica ou desmente (dinheiro), por fim o que o pode magoar (risco).
 *
 * Se a confiança for baixa, a frase di-lo em vez de afirmar com firmeza — é a
 * mesma regra de "estado vazio honesto" aplicada à prosa.
 */
function buildHeadline(
  direction: Reading,
  risk: Reading,
  money: Reading,
): {
  pt: string;
  en: string;
  claims: HeadlineClaim[];
  caveatPt: string | null;
  caveatEn: string | null;
} {
  const claims: HeadlineClaim[] = [
    { reading: "direction", textPt: direction.sentencePt, textEn: direction.sentenceEn },
  ];

  // O dinheiro só entra na manchete quando diz alguma coisa.
  if (money.band !== "neutro" && money.confidence >= LOW_CONFIDENCE) {
    claims.push({ reading: "money", textPt: money.sentencePt, textEn: money.sentenceEn });
  }

  // O risco só entra quando é accionável (elevado).
  if (risk.value >= 45 && risk.confidence >= LOW_CONFIDENCE) {
    claims.push({ reading: "risk", textPt: risk.sentencePt, textEn: risk.sentenceEn });
  }

  const weakest = Math.min(
    direction.confidence,
    risk.confidence,
    money.confidence,
  );
  const caveat =
    weakest < LOW_CONFIDENCE
      ? {
          pt: "Leitura parcial — faltam sinais.",
          en: "Partial reading — signals missing.",
        }
      : { pt: null, en: null };

  return {
    pt: claims.map((c) => c.textPt).join(" ") + (caveat.pt ? ` ${caveat.pt}` : ""),
    en: claims.map((c) => c.textEn).join(" ") + (caveat.en ? ` ${caveat.en}` : ""),
    claims,
    caveatPt: caveat.pt,
    caveatEn: caveat.en,
  };
}

/**
 * A única coisa a vigiar hoje.
 *
 * Escolhe o contributo isolado mais forte de entre as três leituras. Um único
 * ponto de atenção é accionável; cinco não são — por isso devolve-se um só.
 */
function buildWatch(readings: Reading[]): { pt: string; en: string } {
  const all = readings.flatMap((r) =>
    r.contributors.map((c) => ({ reading: r, c })),
  );
  if (!all.length) {
    return {
      pt: "Sem sinais suficientes para destacar algo hoje.",
      en: "Not enough signals to highlight anything today.",
    };
  }
  all.sort((a, b) => Math.abs(b.c.points) - Math.abs(a.c.points));
  const top = all[0];
  return {
    pt: `${top.c.labelPt}: ${top.c.detailPt}`,
    en: `${top.c.labelEn}: ${top.c.detailEn}`,
  };
}

/** Constrói as três leituras e a síntese do Nível 1. */
export function buildReadingSet(inputs: ReadingInputs): ReadingSet {
  const direction = computeDirection(inputs);
  const risk = computeRisk(inputs);
  const money = computeMoney(inputs);
  const headline = buildHeadline(direction, risk, money);
  const watch = buildWatch([risk, money, direction]);

  return {
    direction,
    risk,
    money,
    headlinePt: headline.pt,
    headlineEn: headline.en,
    headlineClaims: headline.claims,
    headlineCaveatPt: headline.caveatPt,
    headlineCaveatEn: headline.caveatEn,
    watchPt: watch.pt,
    watchEn: watch.en,
    updatedAt: new Date().toISOString(),
  };
}
