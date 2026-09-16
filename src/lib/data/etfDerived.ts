import type { EtfDailyFlow } from "@/lib/data/etf";

/**
 * Derivações puras sobre o histórico de fluxos ETF (R6) — seguras para
 * cliente (sem fs nem fetch). Tudo medido na amostra guardada, nunca
 * inventado: quando a janela não chega, a lacuna é declarada com null.
 */

/**
 * Série acumulada da amostra — a soma correndo dia a dia. É a vista que
 * a Farside não tem: não o total desde o lançamento, só a janela guardada.
 */
export function etfCumulativeSeries(
  history: EtfDailyFlow[],
): { date: string; cumUsdM: number }[] {
  let cum = 0;
  return history.map((d) => ({ date: d.date, cumUsdM: (cum += d.totalUsdM) }));
}

/** Maior entrada e maior saída dentro da amostra — nunca inventadas. */
export function etfRecordDays(history: EtfDailyFlow[]): {
  inflow: EtfDailyFlow | null;
  outflow: EtfDailyFlow | null;
} {
  let inflow: EtfDailyFlow | null = null;
  let outflow: EtfDailyFlow | null = null;
  for (const d of history) {
    if (d.totalUsdM > 0 && (!inflow || d.totalUsdM > inflow.totalUsdM)) {
      inflow = d;
    }
    if (d.totalUsdM < 0 && (!outflow || d.totalUsdM < outflow.totalUsdM)) {
      outflow = d;
    }
  }
  return { inflow, outflow };
}

/**
 * Δ semanal: soma dos últimos 5 dias vs os 5 anteriores.
 * prev5 fica null quando a amostra não chega a 10 dias — lacuna declarada.
 */
export function etfWeeklyDelta(history: EtfDailyFlow[]): {
  last5: number | null;
  prev5: number | null;
} {
  const last5 = history.length
    ? history.slice(-5).reduce((s, d) => s + d.totalUsdM, 0)
    : null;
  const prev5 =
    history.length >= 10
      ? history.slice(-10, -5).reduce((s, d) => s + d.totalUsdM, 0)
      : null;
  return { last5, prev5 };
}
