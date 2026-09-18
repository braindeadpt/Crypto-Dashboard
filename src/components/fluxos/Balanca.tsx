"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { formatUsd } from "@/lib/format";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

/**
 * A BALANÇA — spot institucional contra alavancagem, como prato que inclina.
 *
 * Dois pesos reais em dólares: |fluxo ETF spot do dia| contra |Δ de open
 * interest em USD|. O feixe roda para o lado mais pesado — ângulo ∝ log do
 * rácio, com tecto. Quando um lado não tem dados, o prato cai declarado.
 */

const MAX_TILT_DEG = 14;

export function Balanca({
  spotUsdM,
  oiDeltaUsd,
}: {
  /** Fluxo combinado dos ETF spot do dia, USD milhões (sinal incluído). */
  spotUsdM: number | null;
  /** Δ de open interest em USD (oiUsd × Δ% real) — sinal incluído. */
  oiDeltaUsd: number | null;
}) {
  const t = useTranslations("fluxos");
  const motion = useMotion();
  const beamRef = useRef<SVGGElement>(null);

  const spotUsd = spotUsdM != null ? spotUsdM * 1e6 : null;
  const a = spotUsd != null ? Math.abs(spotUsd) : null;
  const b = oiDeltaUsd != null ? Math.abs(oiDeltaUsd) : null;

  // Inclinação: log-rácio das magnitudes — nunca inventada, só ausente
  // quando falta um lado. Sinal: quem domina hoje puxa o prato para baixo.
  let tilt = 0;
  if (a != null && b != null && a > 0 && b > 0) {
    tilt = Math.max(
      -MAX_TILT_DEG,
      Math.min(MAX_TILT_DEG, Math.log2(b / a) * 5),
    );
  }

  const target = useRef(tilt);
  useEffect(() => {
    const el = beamRef.current;
    if (!el) return;
    if (motion.subdued) {
      el.style.transform = `rotate(${tilt}deg)`;
      target.current = tilt;
      return;
    }
    const obj = { v: target.current };
    const tween = gsapLike(el, obj, tilt, 0.9 * motion.cadence);
    target.current = tilt;
    return tween;
  }, [tilt, motion.subdued, motion.cadence]);

  const heavierLeft = a != null && b != null && a >= b;

  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 320 170"
        className="h-auto w-full max-w-md"
        role="img"
        aria-label={t("balanceAria")}
      >
        {/* fulcro */}
        <path
          d="M160 132 L146 158 L174 158 Z"
          fill="var(--surface-3)"
          stroke="var(--line)"
        />
        <line x1="120" y1="158" x2="200" y2="158" stroke="var(--line)" />
        {/* feixe — roda em torno do fulcro */}
        <g
          ref={beamRef}
          style={{
            transform: `rotate(${tilt}deg)`,
            transformOrigin: "160px 132px",
            transition: motion.subdued ? "none" : undefined,
          }}
        >
          <line
            x1="52"
            y1="132"
            x2="268"
            y2="132"
            stroke="var(--ink)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* prato esquerdo — spot institucional */}
          <line x1="64" y1="132" x2="64" y2="150" stroke="var(--line)" />
          <path
            d="M44 150 Q64 164 84 150 Z"
            fill={heavierLeft ? "var(--up)" : "var(--surface-2)"}
            stroke="var(--line)"
          />
          {/* prato direito — alavancagem */}
          <line x1="256" y1="132" x2="256" y2="150" stroke="var(--line)" />
          <path
            d="M236 150 Q256 164 276 150 Z"
            fill={!heavierLeft && b != null ? "var(--down)" : "var(--surface-2)"}
            stroke="var(--line)"
          />
        </g>
        {/* etiquetas */}
        <text
          x="64"
          y="40"
          textAnchor="middle"
          fill="var(--faint)"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
        >
          {t("balanceSpot")}
        </text>
        <text
          x="64"
          y="52"
          textAnchor="middle"
          fill="var(--ink)"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {spotUsdM == null ? "—" : formatUsd(spotUsdM * 1e6, true)}
        </text>
        <text
          x="256"
          y="40"
          textAnchor="middle"
          fill="var(--faint)"
          style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
        >
          {t("balanceLeverage")}
        </text>
        <text
          x="256"
          y="52"
          textAnchor="middle"
          fill="var(--ink)"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {oiDeltaUsd == null ? "—" : formatUsd(oiDeltaUsd, true)}
        </text>
        {/* sinais do dia por baixo de cada prato */}
        <text
          x="64"
          y="118"
          textAnchor="middle"
          fill={
            spotUsd == null
              ? "var(--faint)"
              : spotUsd >= 0
                ? "var(--up)"
                : "var(--down)"
          }
          style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
        >
          {spotUsd == null ? "" : spotUsd >= 0 ? "▲ entrada" : "▼ saída"}
        </text>
        <text
          x="256"
          y="118"
          textAnchor="middle"
          fill={
            oiDeltaUsd == null
              ? "var(--faint)"
              : oiDeltaUsd >= 0
                ? "var(--up)"
                : "var(--down)"
          }
          style={{ fontFamily: "var(--font-mono)", fontSize: 9 }}
        >
          {oiDeltaUsd == null ? "" : oiDeltaUsd >= 0 ? "▲ +" : "▼ −"}
        </text>
      </svg>
      <figcaption className="mt-1 text-meta text-faint">
        {t("balanceNote")}
      </figcaption>
    </figure>
  );
}

/* Tween mínimo de rotação — escreve transform directo, sem layout. */
function gsapLike(
  el: SVGGElement,
  obj: { v: number },
  to: number,
  dur: number,
) {
  const start = performance.now();
  const from = obj.v;
  let raf = 0;
  function step(now: number) {
    const k = Math.min(1, (now - start) / (dur * 1000));
    const e = 1 - Math.pow(1 - k, 3);
    const v = from + (to - from) * e;
    el.style.transform = `rotate(${v}deg)`;
    obj.v = v;
    if (k < 1) raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}
