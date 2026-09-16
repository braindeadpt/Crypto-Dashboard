"use client";

import { useId, useMemo } from "react";

/**
 * Sparkline de área — linha + preenchimento subtil. Desenha-se uma vez
 * (chart-draw) e fica parada; sem loop contínuo.
 */
export function Sparkline({
  points,
  up,
  className = "",
  height = 64,
}: {
  points: number[];
  up: boolean;
  className?: string;
  height?: number;
}) {
  const gid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const { line, area } = useMemo(() => {
    if (points.length < 2) return { line: "", area: "" };
    const w = 100;
    const min = Math.min(...points);
    const max = Math.max(...points);
    const span = max - min || 1;
    const step = w / (points.length - 1);
    const pts = points.map(
      (p, i) => [i * step, 96 - ((p - min) / span) * 92] as const,
    );
    const linePath = pts
      .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
      .join(" ");
    return { line: linePath, area: `${linePath} L100 100 L0 100 Z` };
  }, [points]);

  if (!line) return null;

  const color = up ? "var(--up)" : "var(--down)";

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={className}
      style={{ height }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
        className="chart-path"
      />
    </svg>
  );
}
