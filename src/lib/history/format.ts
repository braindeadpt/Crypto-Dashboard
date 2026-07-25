import type { MetricBand, MetricContext } from "@/lib/stats";
import type { MetricContextApi } from "@/lib/history/context";

/** Short tape hint: "p92 · 90d" or "p92 · 12d" (honest sample). */
export function shortContextHint(ctx: MetricContextApi | MetricContext | null | undefined): string | null {
  if (!ctx) return null;
  const sample =
    "diasDeAmostra" in ctx ? ctx.diasDeAmostra : ctx.sampleDays;
  const pct = "percentil" in ctx ? ctx.percentil : ctx.percentile;
  const band =
    "classificação" in ctx ? ctx.classificação : ctx.classification;
  if (band === "insufficient" || pct == null || sample < 7) {
    return sample > 0 ? `${sample}d` : null;
  }
  return `p${Math.round(pct)} · ${sample}d`;
}

/**
 * Full sentence for tooltips / prose — plain language, no bare "percentil".
 * Prefer PercentileTwin + jargon messages in UI; this remains for aria / titles.
 */
export function formatContextSentence(
  ctx: MetricContextApi | MetricContext,
  locale: "pt" | "en",
  opts?: { stretchedLabel?: boolean },
): string {
  const sample =
    "diasDeAmostra" in ctx ? ctx.diasDeAmostra : ctx.sampleDays;
  const pct = "percentil" in ctx ? ctx.percentil : ctx.percentile;
  const band =
    "classificação" in ctx ? ctx.classificação : ctx.classification;

  if (band === "insufficient" || pct == null) {
    return locale === "pt"
      ? sample > 0
        ? `Ainda só ${sample} dias de histórico — contexto incompleto.`
        : "Sem histórico suficiente."
      : sample > 0
        ? `Only ${sample} days of history — incomplete context.`
        : "Not enough history yet.";
  }

  const p = Math.round(pct);
  void opts;
  if (locale === "pt") {
    return `mais alto que ${p}% dos últimos ${sample} dias`;
  }
  return `higher than ${p}% of the last ${sample} days`;
}

export const BAND_LABEL_PT: Record<MetricBand, string> = {
  extreme_low: "extremo baixo",
  low: "baixo",
  normal: "normal",
  high: "alto",
  extreme_high: "extremo alto",
  insufficient: "amostra curta",
};

export const BAND_LABEL_EN: Record<MetricBand, string> = {
  extreme_low: "extreme low",
  low: "low",
  normal: "normal",
  high: "high",
  extreme_high: "extreme high",
  insufficient: "short sample",
};
