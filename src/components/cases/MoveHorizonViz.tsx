"use client";

import { deltaClass, formatPct } from "@/lib/format";
import type { CaseFile } from "@/lib/types";
import { useTranslations } from "next-intl";

/**
 * Horizon bars — 1h / 24h / 7d when present. Never invents missing windows.
 */
export function MoveHorizonViz({
  caseFile,
  className = "",
}: {
  caseFile: CaseFile;
  className?: string;
}) {
  const t = useTranslations("case");
  const points: { key: string; label: string; v: number | null }[] = [
    { key: "1h", label: t("horizon1h"), v: caseFile.change1h ?? null },
    { key: "24h", label: t("horizon24h"), v: caseFile.change24h },
    { key: "7d", label: t("horizon7d"), v: caseFile.change7d ?? null },
  ];
  const present = points.filter((p) => p.v != null && Number.isFinite(p.v));
  if (!present.length) return null;

  const maxAbs = Math.max(0.01, ...present.map((p) => Math.abs(p.v!)));
  const w = 320;
  const rowH = 28;
  const h = 16 + present.length * rowH;
  const mid = 140;
  const barMax = 120;

  return (
    <figure className={className}>
      <figcaption className="mb-1 text-label text-faint">{t("horizonTitle")}</figcaption>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full max-w-md"
        role="img"
        aria-label={t("horizonTitle")}
      >
        <line
          x1={mid}
          x2={mid}
          y1={4}
          y2={h - 4}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        {present.map((p, i) => {
          const y = 10 + i * rowH;
          const v = p.v!;
          const barW = (Math.abs(v) / maxAbs) * barMax;
          const up = v >= 0;
          return (
            <g key={p.key}>
              <text
                x={8}
                y={y + 12}
                fill="var(--muted)"
                style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
              >
                {p.label}
              </text>
              <rect
                x={up ? mid : mid - barW}
                y={y + 2}
                width={barW}
                height={14}
                className={up ? "lum-up" : "lum-down"}
                fill={
                  up
                    ? "color-mix(in srgb, var(--up) 45%, transparent)"
                    : "color-mix(in srgb, var(--down) 45%, transparent)"
                }
                stroke="var(--line)"
                strokeWidth="0.5"
              />
              <text
                x={up ? mid + barW + 6 : mid - barW - 6}
                y={y + 13}
                textAnchor={up ? "start" : "end"}
                fill="var(--ink)"
                style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                className={deltaClass(v)}
              >
                {formatPct(v)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
