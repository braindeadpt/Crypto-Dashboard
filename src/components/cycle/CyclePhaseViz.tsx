"use client";

import type { CycleSnapshot } from "@/lib/types";
import { useTranslations } from "next-intl";

const PHASES: CycleSnapshot["phase"][] = [
  "early",
  "accumulation",
  "bull",
  "distribution",
  "bear",
];

/** Ends of phase bands as % of ~1460-day cycle (matches cycle.ts thresholds). */
const PHASE_ENDS = [25, 45, 70, 85, 100];

/**
 * Where we are in the ~4-year cycle — phase bands + marker.
 * Heuristic map, not a forecast.
 */
export function CyclePhaseViz({
  cycle,
  className = "",
}: {
  cycle: CycleSnapshot;
  className?: string;
}) {
  const t = useTranslations("cycle");
  const w = 640;
  const h = 120;
  const padX = 16;
  const barY = 36;
  const barH = 28;
  const innerW = w - padX * 2;
  const markerX = padX + (cycle.cycleProgressPct / 100) * innerW;

  const bands = PHASE_ENDS.map((end, i) => {
    const start = i === 0 ? 0 : PHASE_ENDS[i - 1]!;
    return {
      phase: PHASES[i]!,
      x: padX + (start / 100) * innerW,
      width: ((end - start) / 100) * innerW,
      active: cycle.phase === PHASES[i],
    };
  });

  return (
    <figure className={className}>
      <figcaption className="mb-1 text-label text-faint">
        {t("phaseVizTitle")}
      </figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full border border-line bg-surface"
        role="img"
        aria-label={t("phaseVizAria", {
          phase: t(`phases.${cycle.phase}`),
          pct: Math.round(cycle.cycleProgressPct),
        })}
      >
        <title>{t("phaseVizTitle")}</title>
        {bands.map((b) => (
          <g key={b.phase}>
            <rect
              x={b.x}
              y={barY}
              width={Math.max(0, b.width - 1)}
              height={barH}
              fill={
                b.active
                  ? "color-mix(in srgb, var(--accent) 35%, transparent)"
                  : "color-mix(in srgb, var(--line-strong) 25%, transparent)"
              }
              stroke="var(--line)"
              strokeWidth="0.5"
            />
            {b.width > 48 && (
              <text
                x={b.x + b.width / 2}
                y={barY + 18}
                textAnchor="middle"
                fill={b.active ? "var(--ink)" : "var(--muted)"}
                style={{ fontSize: 10, fontFamily: "var(--font-sans)" }}
              >
                {t(`phases.${b.phase}`)}
              </text>
            )}
          </g>
        ))}
        <line
          x1={markerX}
          x2={markerX}
          y1={barY - 8}
          y2={barY + barH + 8}
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <circle cx={markerX} cy={barY - 10} r="5" fill="var(--accent)" />
        <text
          x={markerX}
          y={barY + barH + 24}
          textAnchor="middle"
          fill="var(--ink)"
          style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
        >
          {t("youAreHere")} · {Math.round(cycle.cycleProgressPct)}%
        </text>
        <text
          x={padX}
          y={h - 8}
          fill="var(--faint)"
          style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
        >
          {cycle.halving.lastHalving}
        </text>
        <text
          x={w - padX}
          y={h - 8}
          textAnchor="end"
          fill="var(--faint)"
          style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
        >
          {cycle.halving.nextEstimate}
        </text>
      </svg>
      <p className="mt-1 text-meta text-faint">{t("phaseVizHint")}</p>
    </figure>
  );
}
