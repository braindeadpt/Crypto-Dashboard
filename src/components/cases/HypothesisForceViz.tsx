"use client";

import type { CaseFile } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

/**
 * Relative weight of hypotheses — correlation weight, not causation probability.
 */
export function HypothesisForceViz({
  hypotheses,
  className = "",
}: {
  hypotheses: CaseFile["hypotheses"];
  className?: string;
}) {
  const t = useTranslations("case");
  const locale = useLocale();
  if (!hypotheses.length) return null;

  const w = 400;
  const rowH = 36;
  const padL = 4;
  const barMax = 280;
  const h = 8 + hypotheses.length * rowH;

  return (
    <figure className={className}>
      <figcaption className="mb-1 text-label text-faint">
        {t("forceTitle")}
      </figcaption>
      <p className="mb-2 text-meta text-faint">{t("forceHint")}</p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("forceTitle")}
      >
        {hypotheses.map((hyp, i) => {
          const y = 6 + i * rowH;
          const pct = Math.max(0, Math.min(1, hyp.confidence));
          const barW = pct * barMax;
          const label = locale === "pt" ? hyp.labelPt : hyp.labelEn;
          return (
            <g key={hyp.id}>
              <text
                x={padL}
                y={y + 10}
                fill="var(--muted)"
                style={{ fontSize: 10, fontFamily: "var(--font-sans)" }}
              >
                {label.length > 52 ? `${label.slice(0, 50)}…` : label}
              </text>
              <rect
                x={padL}
                y={y + 14}
                width={barMax}
                height={8}
                fill="var(--surface-2)"
                stroke="var(--line)"
                strokeWidth="0.5"
              />
              <rect
                x={padL}
                y={y + 14}
                width={barW}
                height={8}
                fill="color-mix(in srgb, var(--accent) 70%, transparent)"
              />
              <text
                x={padL + barMax + 8}
                y={y + 21}
                fill="var(--ink)"
                style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
              >
                {Math.round(pct * 100)}
              </text>
            </g>
          );
        })}
      </svg>
    </figure>
  );
}
