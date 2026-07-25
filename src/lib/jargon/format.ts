import type { MetricBand } from "@/lib/stats";
import type { MetricContext } from "@/lib/stats";
import type { MetricContextApi } from "@/lib/history/context";

type Ctx = MetricContextApi | MetricContext;

function sampleDays(ctx: Ctx): number {
  return "diasDeAmostra" in ctx ? ctx.diasDeAmostra : ctx.sampleDays;
}

function percentile(ctx: Ctx): number | null {
  return "percentil" in ctx ? ctx.percentil : ctx.percentile;
}

function band(ctx: Ctx): MetricBand {
  return "classificação" in ctx ? ctx.classificação : ctx.classification;
}

/**
 * Values for `jargon.percentile.*` message interpolation.
 * Call sites pass these into next-intl — no prose hardcoded here.
 */
export function percentileMessageValues(ctx: Ctx | null | undefined): {
  p: number;
  days: number;
  insufficient: boolean;
} | null {
  if (!ctx) return null;
  const days = sampleDays(ctx);
  const pct = percentile(ctx);
  const b = band(ctx);
  if (b === "insufficient" || pct == null) {
    return { p: 0, days, insufficient: true };
  }
  return { p: Math.round(pct), days, insufficient: false };
}

/**
 * L/S ratio → message values for `jargon.ls.line*`.
 * ratio > 1 → more longs; < 1 → more shorts.
 */
export function lsMessageValues(ratio: number): {
  ratio: string;
  multiple: string;
  side: "long" | "short" | "flat";
} {
  if (!Number.isFinite(ratio) || ratio <= 0) {
    return { ratio: "—", multiple: "1", side: "flat" };
  }
  if (Math.abs(ratio - 1) < 0.08) {
    return { ratio: ratio.toFixed(2), multiple: "1", side: "flat" };
  }
  if (ratio > 1) {
    return {
      ratio: ratio.toFixed(2),
      multiple: ratio >= 1.8 ? ratio.toFixed(1) : ratio.toFixed(2),
      side: "long",
    };
  }
  const inv = 1 / ratio;
  return {
    ratio: ratio.toFixed(2),
    multiple: inv >= 1.8 ? inv.toFixed(1) : inv.toFixed(2),
    side: "short",
  };
}

/** Breadth % → `jargon.breadth.line` values. */
export function breadthMessageValues(pct: number): { n: number } {
  const n = Math.max(0, Math.min(100, Math.round(pct)));
  return { n };
}

export type FundingBandKey = "calm" | "normal" | "elevated" | "extreme";

/** Map funding rate (not %) to a qualitative band for the twin line. */
export function fundingBandKey(rate: number | null | undefined): FundingBandKey {
  if (rate == null || !Number.isFinite(rate)) return "normal";
  const absBps = Math.abs(rate) * 10_000;
  if (absBps < 0.5) return "calm";
  if (absBps < 2) return "normal";
  if (absBps < 5) return "elevated";
  return "extreme";
}
