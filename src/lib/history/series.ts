import type { SeriesPoint } from "@/lib/stats";

/** UTC calendar day YYYY-MM-DD */
export function dayKey(isoOrDay: string): string {
  if (isoOrDay.length >= 10) return isoOrDay.slice(0, 10);
  const t = Date.parse(isoOrDay);
  if (!Number.isFinite(t)) return isoOrDay;
  return new Date(t).toISOString().slice(0, 10);
}

export function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Merge by day key (incoming wins), sort ascending, keep last `maxDays` days.
 * Does not fill gaps — missing days stay missing.
 */
export function mergeDailyPoints(
  existing: SeriesPoint[],
  incoming: SeriesPoint[],
  maxDays = 90,
): SeriesPoint[] {
  const map = new Map<string, number>();
  for (const p of existing) {
    if (!Number.isFinite(p.v)) continue;
    map.set(dayKey(p.t), p.v);
  }
  for (const p of incoming) {
    if (!Number.isFinite(p.v)) continue;
    map.set(dayKey(p.t), p.v);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-maxDays)
    .map(([t, v]) => ({ t, v }));
}

/** Append/overwrite today's point only (for metrics without API history). */
export function appendToday(
  existing: SeriesPoint[],
  value: number,
  maxDays = 90,
): SeriesPoint[] {
  if (!Number.isFinite(value)) return existing;
  return mergeDailyPoints(existing, [{ t: utcToday(), v: value }], maxDays);
}

/**
 * 30-day realized volatility (annualized %, close-to-close).
 * Returns one point per day that has a full 30-day lookback — no extrapolation.
 */
export function realizedVolSeries(
  prices: { t: string; v: number }[],
  lookback = 30,
): SeriesPoint[] {
  if (prices.length < lookback + 1) return [];
  const out: SeriesPoint[] = [];
  for (let i = lookback; i < prices.length; i++) {
    const window = prices.slice(i - lookback, i + 1);
    const rets: number[] = [];
    for (let j = 1; j < window.length; j++) {
      const a = window[j - 1].v;
      const b = window[j].v;
      if (a > 0 && b > 0) rets.push(Math.log(b / a));
    }
    if (rets.length < lookback - 5) continue;
    const avg = rets.reduce((s, x) => s + x, 0) / rets.length;
    const ss = rets.reduce((s, x) => s + (x - avg) ** 2, 0);
    const sd = Math.sqrt(ss / (rets.length - 1));
    const ann = sd * Math.sqrt(365) * 100;
    out.push({ t: dayKey(prices[i].t), v: ann });
  }
  return out;
}
