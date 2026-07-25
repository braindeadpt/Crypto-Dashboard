/**
 * As três leituras compostas — Direcção, Risco, Dinheiro.
 *
 * Existem para responder à pergunta que 105 percentagens no ecrã não respondem:
 * "está a acontecer alguma coisa?". Cada leitura sintetiza vários sinais crus
 * numa só grandeza legível, e — criticamente — nunca esconde o que lhe faltou.
 */

export type ReadingId = "direction" | "risk" | "money";

/** Um ingrediente que entrou (ou faltou) na leitura. */
export type ReadingContributor = {
  id: string;
  labelPt: string;
  labelEn: string;
  /**
   * Contributo assinado para o valor final, já ponderado.
   * Positivo empurra a leitura para cima, negativo para baixo.
   */
  points: number;
  /** Peso máximo que este ingrediente podia ter (para mostrar proporção). */
  weight: number;
  detailPt: string;
  detailEn: string;
};

/** Ingrediente que não pôde ser usado — nomeado, nunca silenciado. */
export type ReadingGap = {
  id: string;
  labelPt: string;
  labelEn: string;
  /** Peso que ficou por preencher — quanto da leitura está em falta. */
  weight: number;
};

export type ReadingBand =
  | "muito-negativo"
  | "negativo"
  | "neutro"
  | "positivo"
  | "muito-positivo";

export type Reading = {
  id: ReadingId;
  /**
   * Direcção e Dinheiro: -100..+100 (sinal tem significado).
   * Risco: 0..100 (só magnitude).
   */
  value: number;
  band: ReadingBand;
  /**
   * 0..1 — fracção do peso total que foi efectivamente coberta por dados.
   * Uma leitura com confiança baixa NÃO é apresentada como facto.
   */
  confidence: number;
  contributors: ReadingContributor[];
  /** O que faltou. Vazio = leitura completa. */
  gaps: ReadingGap[];
  sentencePt: string;
  sentenceEn: string;
};

export type ReadingSet = {
  direction: Reading;
  risk: Reading;
  money: Reading;
  /** Frase única que resume as três — o topo do Nível 1. */
  headlinePt: string;
  headlineEn: string;
  /** A única coisa a vigiar hoje. */
  watchPt: string;
  watchEn: string;
  updatedAt: string;
};
