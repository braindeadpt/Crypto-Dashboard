import type { HistorySnapshot } from "@/lib/history/metrics";
import type { SeriesPoint } from "@/lib/stats";

/**
 * A MULTIDÃO — desacordo entre posicionamento e preço.
 *
 * Eixo X: rácio long/short diário da Binance (ls_btc) — >1 = multidão
 * comprada, <1 = vendida. Eixo Y: variação diária do BTC (price_btc).
 * Um dia só entra no rasto quando os DOIS lados existem — sem rácio
 * honesto não há ponto, e a falta diz-se.
 */

export type MultidaoQuadrant =
  | "longsUp" // multidão comprada, preço a subir
  | "longsDown" // multidão comprada, preço a cair — o quadrante tenso
  | "shortsUp" // multidão vendida, preço a subir — combustível
  | "shortsDown" // multidão vendida, preço a cair
  | "balanced"; // rácio ≈ 1 — multidão dividida

export type MultidaoDay = {
  t: string; // YYYY-MM-DD
  ratio: number; // long/short
  chgPct: number; // variação do preço nesse dia, %
  quadrant: MultidaoQuadrant;
};

export type MultidaoData = {
  days: MultidaoDay[];
  /** Amplitude real do rácio na amostra (para a escala do eixo X). */
  ratioMin: number;
  ratioMax: number;
  /** Amplitude real do chgPct (para o eixo Y). */
  chgAbsMax: number;
  samples: number;
  source: string;
};

/** Rácio dentro deste intervalo conta como multidão dividida. */
const BALANCED_LO = 0.95;
const BALANCED_HI = 1.05;

function toMap(points: SeriesPoint[] | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const p of points ?? []) {
    if (Number.isFinite(p.v)) m.set(p.t, p.v);
  }
  return m;
}

function prevDayKey(t: string): string {
  return new Date(Date.parse(`${t}T00:00:00Z`) - 86_400_000)
    .toISOString()
    .slice(0, 10);
}

export function quadrantOf(ratio: number, chgPct: number): MultidaoQuadrant {
  if (ratio >= BALANCED_LO && ratio <= BALANCED_HI) return "balanced";
  const longs = ratio > BALANCED_HI;
  if (longs && chgPct >= 0) return "longsUp";
  if (longs) return "longsDown";
  if (chgPct >= 0) return "shortsUp";
  return "shortsDown";
}

export function buildMultidao(
  snap: HistorySnapshot | null | undefined,
): MultidaoData | null {
  const ls = toMap(snap?.series?.ls_btc?.points);
  const price = toMap(snap?.series?.price_btc?.points);
  if (ls.size === 0 || price.size < 2) return null;

  const days: MultidaoDay[] = [];
  for (const [t, ratio] of [...ls.entries()].sort()) {
    const prev = price.get(prevDayKey(t));
    const cur = price.get(t);
    // Sem delta honesto de preço nesse dia, o ponto não existe.
    if (prev == null || cur == null || prev <= 0) continue;
    const chgPct = ((cur - prev) / prev) * 100;
    days.push({ t, ratio, chgPct, quadrant: quadrantOf(ratio, chgPct) });
  }
  if (days.length === 0) return null;

  const ratios = days.map((d) => d.ratio);
  const chgs = days.map((d) => Math.abs(d.chgPct));
  return {
    days,
    ratioMin: Math.min(...ratios, 0.9),
    ratioMax: Math.max(...ratios, 1.1),
    chgAbsMax: Math.max(...chgs, 1),
    samples: days.length,
    source: snap?.series?.ls_btc?.source ?? "",
  };
}
