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
 * Full sentence for tooltips / prose.
 * PT: "percentil 92 dos últimos 90 dias — só 8% dos dias estiveram mais esticados"
 * Uses sampleDays honestly when < windowDays.
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
  const above = Math.max(0, 100 - p);
  const stretched = opts?.stretchedLabel !== false;

  if (locale === "pt") {
    const tail = stretched
      ? ` — só ${above}% dos dias estiveram mais esticados`
      : ` — só ${above}% dos dias foram mais altos`;
    return `percentil ${p} dos últimos ${sample} dias${tail}`;
  }

  const tail = stretched
    ? ` — only ${above}% of days were more stretched`
    : ` — only ${above}% of days were higher`;
  return `percentile ${p} of the last ${sample} days${tail}`;
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
