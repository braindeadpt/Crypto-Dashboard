"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { useViewportBuild } from "@/lib/motion/useViewportBuild";
import type { SeriesPoint } from "@/lib/stats";
import { formatUsd } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

/**
 * TVL NO TEMPO — a série real de TVL global (90d) como área.
 * Constrói-se ao entrar no viewport (família ①): o traço desenha-se na
 * ordem do tempo, a área preenche por baixo. Reduced-motion: estado final.
 */

const W = 640;
const H = 180;
const PAD = { l: 4, r: 4, t: 10, b: 18 };

export function TvlChart({
  points,
  updatedAt,
}: {
  points: SeriesPoint[];
  updatedAt: string | null;
}) {
  const t = useTranslations("defi");
  const locale = useLocale();
  const isPt = locale === "pt";
  const motion = useMotion();

  const root = useViewportBuild<HTMLElement>((tl) => {
    tl.fromTo(
      "[data-tvl-line]",
      { strokeDashoffset: 1 },
      { strokeDashoffset: 0, duration: 1.1, ease: "power2.out" },
    ).fromTo(
      "[data-tvl-area]",
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: "power1.out" },
      "-=0.35",
    );
  });

  if (points.length < 2) {
    return (
      <p className="text-meta text-faint">
        {t("tvlSeriesEmpty")}
      </p>
    );
  }

  const lo = Math.min(...points.map((p) => p.v));
  const hi = Math.max(...points.map((p) => p.v));
  const span = hi - lo || 1;
  const x = (i: number) =>
    PAD.l + (i / (points.length - 1)) * (W - PAD.l - PAD.r);
  const y = (v: number) =>
    PAD.t + (1 - (v - lo) / span) * (H - PAD.t - PAD.b);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.v).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${x(points.length - 1).toFixed(1)} ${H - PAD.b} L ${x(0).toFixed(1)} ${H - PAD.b} Z`;

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const deltaPct = first.v > 0 ? ((last.v - first.v) / first.v) * 100 : null;

  return (
    <figure className="m-0" ref={root}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("tvlSeriesAria", { days: points.length })}
      >
        <defs>
          <linearGradient id="tvl-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* eixo-base */}
        <line
          x1={PAD.l}
          y1={H - PAD.b}
          x2={W - PAD.r}
          y2={H - PAD.b}
          stroke="var(--line)"
          strokeWidth={1}
        />
        <path data-tvl-area d={area} fill="url(#tvl-fill)" />
        <path
          data-tvl-line
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.6}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={motion.subdued ? 0 : 1}
        />
        {/* ponto de hoje */}
        <circle
          cx={x(points.length - 1)}
          cy={y(last.v)}
          r={3}
          fill="var(--accent-2)"
        />
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-meta text-faint">
        <span>
          {t("tvlSeriesNote", { days: points.length })}
        </span>
        {deltaPct != null && (
          <span
            className={`font-mono tabular-nums ${
              deltaPct >= 0 ? "delta-up" : "delta-down"
            }`}
          >
            {deltaPct >= 0 ? "▲" : "▼"} {formatUsd(last.v, true)} (
            {deltaPct >= 0 ? "+" : ""}
            {deltaPct.toFixed(1)}%)
          </span>
        )}
        {updatedAt && (
          <span className="ml-auto font-mono text-micro">
            {isPt ? "série diária · snapshot" : "daily series · snapshot"}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
