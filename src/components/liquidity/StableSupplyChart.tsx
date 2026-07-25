"use client";

import type { SeriesPoint } from "@/lib/stats";
import { formatUsd } from "@/lib/format";

type Props = {
  series: SeriesPoint[];
  locale: "pt" | "en";
  width?: number;
  height?: number;
};

/**
 * Stablecoin supply area chart — custom SVG, no library.
 * Shows 90d level; rising area = fuel entering the system.
 */
export function StableSupplyChart({
  series,
  locale,
  width = 720,
  height = 220,
}: Props) {
  if (series.length < 2) {
    return (
      <p className="border border-line bg-surface p-4 text-meta text-muted">
        {locale === "pt"
          ? "Série de oferta ainda insuficiente."
          : "Supply series still insufficient."}
      </p>
    );
  }

  const pad = { t: 16, r: 12, b: 28, l: 52 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const vals = series.map((p) => p.v);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const xAt = (i: number) => pad.l + (i / (series.length - 1)) * iw;
  const yAt = (v: number) => pad.t + ih - ((v - min) / span) * ih;

  const line = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.v).toFixed(1)}`)
    .join(" ");
  const area =
    line +
    ` L ${xAt(series.length - 1).toFixed(1)} ${(pad.t + ih).toFixed(1)}` +
    ` L ${xAt(0).toFixed(1)} ${(pad.t + ih).toFixed(1)} Z`;

  const last = series[series.length - 1];
  const first = series[0];
  const up = last.v >= first.v;

  const aria =
    locale === "pt"
      ? `Oferta agregada de stablecoins: ${formatUsd(last.v, true)} · série ${series.length} dias.`
      : `Aggregate stablecoin supply: ${formatUsd(last.v, true)} · ${series.length}-day series.`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full border border-line bg-surface"
      role="img"
      aria-label={aria}
    >
      <title>{aria}</title>
      {/* Grid */}
      {[0, 0.5, 1].map((f) => {
        const y = pad.t + ih * (1 - f);
        const v = min + span * f;
        return (
          <g key={f}>
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={y}
              y2={y}
              stroke="var(--line)"
              strokeWidth="1"
            />
            <text
              x={pad.l - 6}
              y={y + 3}
              textAnchor="end"
              fill="var(--faint)"
              style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
            >
              {formatUsd(v, true)}
            </text>
          </g>
        );
      })}
      <path
        d={area}
        fill={
          up
            ? "color-mix(in srgb, var(--up) 16%, transparent)"
            : "color-mix(in srgb, var(--down) 14%, transparent)"
        }
      />
      <path
        d={line}
        fill="none"
        stroke={up ? "var(--up)" : "var(--down)"}
        strokeWidth="2"
      />
      <circle
        cx={xAt(series.length - 1)}
        cy={yAt(last.v)}
        r="3.5"
        fill="var(--accent)"
        stroke="var(--bg)"
        strokeWidth="1"
      />
      <text
        x={pad.l}
        y={height - 8}
        fill="var(--faint)"
        style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
      >
        {first.t}
      </text>
      <text
        x={width - pad.r}
        y={height - 8}
        textAnchor="end"
        fill="var(--faint)"
        style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
      >
        {last.t}
      </text>
      <text
        x={xAt(series.length - 1) - 4}
        y={yAt(last.v) - 8}
        textAnchor="end"
        fill="var(--ink)"
        style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 500 }}
      >
        {(up ? "▲ " : "▼ ") + formatUsd(last.v, true)}
      </text>
    </svg>
  );
}
