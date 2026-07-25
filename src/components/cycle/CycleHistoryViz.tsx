"use client";

import type { CycleSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

const HALVING_MS = [
  Date.parse("2012-11-28T00:00:00Z"),
  Date.parse("2016-07-09T00:00:00Z"),
  Date.parse("2020-05-11T00:00:00Z"),
  Date.parse("2024-04-20T00:00:00Z"),
];

function logPrice(p: number) {
  return Math.log10(Math.max(p, 1));
}

/**
 * Multi-year BTC price (log) with halvings marked — from CoinGecko when present.
 */
export function CycleHistoryViz({
  cycle,
  className = "",
}: {
  cycle: CycleSnapshot;
  className?: string;
}) {
  const t = useTranslations("cycle");
  const locale = useLocale();
  const series = cycle.priceHistory;

  if (series.length < 8) {
    return (
      <p className={`text-meta text-muted ${className}`}>{t("historyUnavailable")}</p>
    );
  }

  const w = 720;
  const h = 260;
  const pad = { top: 20, right: 16, bottom: 36, left: 48 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const t0 = series[0]!.time;
  const t1 = series[series.length - 1]!.time;
  const span = Math.max(1, t1 - t0);
  const logs = series.map((p) => logPrice(p.price));
  const yMin = Math.min(...logs);
  const yMax = Math.max(...logs);
  const ySpan = Math.max(0.01, yMax - yMin);

  const xOf = (time: number) => pad.left + ((time - t0) / span) * innerW;
  const yOf = (price: number) =>
    pad.top + innerH - ((logPrice(price) - yMin) / ySpan) * innerH;

  const path = series
    .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(p.time).toFixed(1)},${yOf(p.price).toFixed(1)}`)
    .join(" ");

  const now = series[series.length - 1]!;
  const years = yearTicks(t0, t1);
  const decadePrices = [10, 100, 1000, 10_000, 100_000].filter(
    (p) => logPrice(p) >= yMin - 0.05 && logPrice(p) <= yMax + 0.05,
  );

  const fmtYear = (ms: number) =>
    new Date(ms).toLocaleDateString(locale === "pt" ? "pt-PT" : "en-GB", {
      year: "numeric",
    });

  return (
    <figure className={className}>
      <figcaption className="mb-1 text-label text-faint">
        {t("historyVizTitle")}
      </figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full border border-line bg-surface"
        role="img"
        aria-label={t("historyVizAria")}
      >
        <title>{t("historyVizTitle")}</title>
        {decadePrices.map((p) => (
          <g key={p}>
            <line
              x1={pad.left}
              x2={w - pad.right}
              y1={yOf(p)}
              y2={yOf(p)}
              stroke="var(--line)"
              strokeWidth="0.5"
              strokeDasharray="3 4"
            />
            <text
              x={pad.left - 6}
              y={yOf(p) + 3}
              textAnchor="end"
              fill="var(--faint)"
              style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
            >
              {p >= 1000 ? `${p / 1000}k` : String(p)}
            </text>
          </g>
        ))}
        {HALVING_MS.filter((ms) => ms >= t0 && ms <= t1).map((ms) => (
          <g key={ms}>
            <line
              x1={xOf(ms)}
              x2={xOf(ms)}
              y1={pad.top}
              y2={pad.top + innerH}
              stroke="color-mix(in srgb, var(--accent) 55%, transparent)"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text
              x={xOf(ms) + 4}
              y={pad.top + 12}
              fill="var(--accent)"
              style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
            >
              H
            </text>
          </g>
        ))}
        <path
          d={path}
          fill="none"
          stroke="var(--ink)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <circle
          cx={xOf(now.time)}
          cy={yOf(now.price)}
          r="4.5"
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth="1.5"
        />
        {years.map((ms) => (
          <text
            key={ms}
            x={xOf(ms)}
            y={h - 10}
            textAnchor="middle"
            fill="var(--faint)"
            style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
          >
            {fmtYear(ms)}
          </text>
        ))}
      </svg>
      <p className="mt-1 text-meta text-faint">{t("historyVizHint")}</p>
    </figure>
  );
}

function yearTicks(t0: number, t1: number): number[] {
  const start = new Date(t0).getUTCFullYear();
  const end = new Date(t1).getUTCFullYear();
  const out: number[] = [];
  const step = end - start > 10 ? 2 : 1;
  for (let y = start; y <= end; y += step) {
    out.push(Date.UTC(y, 0, 1));
  }
  return out.filter((ms) => ms >= t0 && ms <= t1);
}
