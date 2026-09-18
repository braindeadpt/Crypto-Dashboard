"use client";

import { useMotion } from "@/lib/motion/useMotion";
import type { CaseFile } from "@/lib/types";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

/**
 * BALANÇA DE HIPÓTESES — evidência a favor contra evidência contra.
 *
 * Peso real: nº de pontos a favor/contra de cada hipótese, ponderado pela
 * confiança declarada do caso. O feixe inclina para o lado mais pesado;
 * caso equilibrado fica nivelado — nunca se inventa convicção.
 */

const MAX_TILT_DEG = 12;

export function HypothesisBalance({
  hypotheses,
}: {
  hypotheses: CaseFile["hypotheses"];
}) {
  const t = useTranslations("case");
  const locale = useLocale();
  const isPt = locale === "pt";
  const motion = useMotion();
  const beamRef = useRef<SVGGElement>(null);
  const target = useRef(0);

  let wFor = 0;
  let wAgainst = 0;
  for (const h of hypotheses) {
    const conf = Math.max(0, Math.min(1, h.confidence));
    wFor += (isPt ? h.forPt : h.forEn).length * conf;
    wAgainst += (isPt ? h.againstPt : h.againstEn).length * conf;
  }
  const tilt =
    wFor + wAgainst > 0
      ? Math.max(
          -MAX_TILT_DEG,
          Math.min(MAX_TILT_DEG, Math.log2((wAgainst + 0.5) / (wFor + 0.5)) * 6),
        )
      : 0;

  useEffect(() => {
    const el = beamRef.current;
    if (!el) return;
    const from = target.current;
    target.current = tilt;
    if (motion.subdued) {
      el.style.transform = `rotate(${tilt}deg)`;
      return;
    }
    const start = performance.now();
    const dur = 0.8 * motion.cadence * 1000;
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      el.style.transform = `rotate(${from + (tilt - from) * e}deg)`;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tilt, motion.subdued, motion.cadence]);

  if (!hypotheses.length) return null;

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 320 160"
        className="h-auto w-full max-w-md"
        role="img"
        aria-label={t("balanceAria")}
      >
        <path
          d="M160 124 L148 148 L172 148 Z"
          fill="var(--surface-3)"
          stroke="var(--line)"
        />
        <line x1="126" y1="148" x2="194" y2="148" stroke="var(--line)" />
        <g
          ref={beamRef}
          style={{
            transform: `rotate(${tilt}deg)`,
            transformOrigin: "160px 124px",
          }}
        >
          <line
            x1="56"
            y1="124"
            x2="264"
            y2="124"
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line x1="68" y1="124" x2="68" y2="140" stroke="var(--line)" />
          <path
            d="M50 140 Q68 153 86 140 Z"
            fill={wFor >= wAgainst ? "var(--up)" : "var(--surface-2)"}
            stroke="var(--line)"
          />
          <line x1="252" y1="124" x2="252" y2="140" stroke="var(--line)" />
          <path
            d="M234 140 Q252 153 270 140 Z"
            fill={wAgainst > wFor ? "var(--down)" : "var(--surface-2)"}
            stroke="var(--line)"
          />
        </g>
        <text
          x="68"
          y="48"
          textAnchor="middle"
          fill="var(--faint)"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
        >
          {t("balanceFor")}
        </text>
        <text
          x="68"
          y="62"
          textAnchor="middle"
          fill="var(--up)"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {wFor.toFixed(1)}
        </text>
        <text
          x="252"
          y="48"
          textAnchor="middle"
          fill="var(--faint)"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
        >
          {t("balanceAgainst")}
        </text>
        <text
          x="252"
          y="62"
          textAnchor="middle"
          fill="var(--down)"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {wAgainst.toFixed(1)}
        </text>
      </svg>
      <figcaption className="mt-1 text-meta text-faint">
        {t("balanceNote")}
      </figcaption>
    </figure>
  );
}
