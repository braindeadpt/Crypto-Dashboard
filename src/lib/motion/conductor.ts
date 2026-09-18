import type { ReadingSet } from "@/lib/reading";

/**
 * O MAESTRO — estado de movimento global.
 *
 * Nenhum componente inventa a sua própria duração ou amplitude: todos leem
 * daqui. É isto que faz o produto mover-se como um organismo em vez de uma
 * colecção de widgets animados.
 *
 * Cada canal codifica uma variável REAL do mercado (ver docs/PLANO-MOVIMENTO.md
 * §2). Se um canal deixasse de reflectir o mercado, era decoração e saía.
 */

export type MotionState = {
  /** Multiplicador de duração. <1 = mais rápido (mercado agitado). */
  cadence: number;
  /** 0..1 — amplitude de deriva e densidade do campo ambiente. */
  agitation: number;
  /** −1..1 — sentido/energia cromática, vem da Direcção. */
  temperature: number;
  /** true quando o utilizador pediu menos movimento, ou os dados não o sustentam. */
  subdued: boolean;
};

/** Estado de repouso — usado com prefers-reduced-motion e com dados fracos. */
export const MOTION_REST: MotionState = {
  cadence: 1,
  agitation: 0,
  temperature: 0,
  subdued: true,
};

/**
 * Abaixo desta confiança nas leituras, o ecrã não finge energia.
 * Ver PLANO-MOVIMENTO §2 "degradação honesta".
 */
export const MIN_CONFIDENCE_FOR_MOTION = 0.6;

/**
 * Tecto absoluto de agitação. Um crash é quando o utilizador MAIS precisa de
 * ler o ecrã — nunca deixamos o movimento ultrapassar isto, aconteça o que
 * acontecer ao mercado (PLANO-MOVIMENTO §7.2).
 */
export const AGITATION_CEILING = 0.85;

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

/**
 * TODO(dono do produto) — A CURVA DE AGITAÇÃO.
 *
 * Converte a leitura de Risco (0..100) na agitação visível do ecrã (0..1).
 *
 * Esta é uma decisão de PRODUTO, não técnica, e é por isso que não a escrevi:
 * define o que o utilizador sente, e tu é que conheces a sensação certa para
 * um dia de mercado. As opções não são equivalentes:
 *
 *  - LINEAR (risk/100): previsível, mas o ecrã já treme a meio da escala. Num
 *    dia comum (risco ~40) há movimento constante que pode cansar.
 *
 *  - LIMIAR (0 até ~45, depois sobe): dias normais ficam SERENOS e só o stress
 *    real acorda o ecrã. O contraste é maior — quando mexe, quer dizer algo.
 *    Risco: parece "morto" a quem abre num dia calmo e esperava o "wow".
 *
 *  - EXPONENCIAL ((risk/100)^2): meio-termo, sobe devagar e dispara no fim.
 *
 * Considera também: o "wow" tem de existir num dia CALMO (é quando a maioria
 * visita), mas o ecrã não pode ser insuportável num dia de queda de 10%.
 *
 * Devolve 0..1. O tecto é aplicado a seguir, não te preocupes com ele.
 */
export function agitationFromRisk(risk: number): number {
  // TODO: implementa a curva escolhida.
  // `risk` vem 0..100. Devolve 0..1.
  return clamp01(risk / 100);
}

/**
 * Deriva o estado de movimento das leituras que já existem.
 *
 * `realizedVolPct` alimenta a cadência: mercado volátil = transições mais
 * curtas. `reduced` vem de prefers-reduced-motion e ganha sempre.
 */
export function conduct(
  readings: ReadingSet | null,
  opts: { reduced?: boolean; realizedVolPct?: number | null } = {},
): MotionState {
  if (opts.reduced || !readings) return MOTION_REST;

  // Honestidade: leituras fracas não autorizam um ecrã cheio de energia.
  const weakest = Math.min(
    readings.direction.confidence,
    readings.risk.confidence,
    readings.money.confidence,
  );
  if (weakest < MIN_CONFIDENCE_FOR_MOTION) return MOTION_REST;

  // Volatilidade alta encurta as transições. Sem série, cadência neutra.
  const vol = opts.realizedVolPct;
  const cadence =
    vol == null ? 1 : Math.max(0.55, Math.min(1.4, 1.4 - clamp01(vol / 90) * 0.85));

  const agitation = Math.min(
    AGITATION_CEILING,
    clamp01(agitationFromRisk(readings.risk.value)),
  );

  return {
    cadence,
    agitation,
    temperature: Math.max(-1, Math.min(1, readings.direction.value / 100)),
    subdued: false,
  };
}
