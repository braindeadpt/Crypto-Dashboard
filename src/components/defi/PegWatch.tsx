"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { useTranslations } from "next-intl";

/**
 * VIGILÂNCIA DE PEG — cada stablecoin como um ponto em torno de 1,00.
 *
 * O desvio real (DefiLlama pegDeviation, %) afasta o ponto da linha; o
 * baloiço contínuo é a respiração do instrumento — amplitude ∝ |desvio|.
 * Acima do limiar declarado o ponto acende; sem desvio medido fica
 * assinalado, nunca inventado.
 */

/** Limiar de alerta — declarado no rodapé, não escondido. */
const WARN_PCT = 0.3;
/** Escala: ±2% de desvio ocupam metade da faixa. */
const SPAN_PCT = 2;

type Stable = {
  symbol: string;
  name: string;
  circulating: number;
  pegDeviation?: number | null;
};

export function PegWatch({ stables }: { stables: Stable[] }) {
  const t = useTranslations("defi");
  const motion = useMotion();

  const items = stables.slice(0, 10);

  return (
    <figure className="m-0">
      <div className="space-y-2" role="list" aria-label={t("pegAria")}>
        {items.map((s) => {
          const dev = s.pegDeviation ?? null;
          const frac =
            dev == null ? 0 : Math.max(-1, Math.min(1, dev / SPAN_PCT));
          const alert = dev != null && Math.abs(dev) > WARN_PCT;
          return (
            <div key={s.symbol} className="flex items-center gap-3" role="listitem">
              <span className="w-12 shrink-0 font-mono text-label text-ink">
                {s.symbol}
              </span>
              <div className="relative h-5 min-w-0 flex-1">
                {/* a linha do peg — o 1,00 que tudo orbita */}
                <div
                  className="absolute inset-y-0 left-1/2 w-px bg-line"
                  aria-hidden
                />
                <div
                  className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border ${
                    dev == null
                      ? "border-line bg-surface-3"
                      : alert
                        ? "border-warn bg-warn"
                        : "border-accent-2 bg-accent-2"
                  } ${!motion.subdued && dev != null ? "peg-sway" : ""}`}
                  style={{
                    left: `calc(50% + ${(frac * 50).toFixed(2)}%)`,
                    marginLeft: -5,
                    ...(dev != null && !motion.subdued
                      ? ({
                          "--peg-amp": `${(0.4 + Math.min(1, Math.abs(frac)) * 2.2).toFixed(2)}px`,
                          animationDuration: `${(2.6 - Math.min(1, Math.abs(frac)) * 1.4) * motion.cadence}s`,
                        } as React.CSSProperties)
                      : {}),
                  }}
                  title={
                    dev == null
                      ? t("pegUnknown")
                      : `${s.name} · ${dev >= 0 ? "+" : ""}${dev.toFixed(3)}%`
                  }
                />
              </div>
              <span
                className={`w-16 shrink-0 text-right font-mono text-label tabular-nums ${
                  dev == null ? "text-faint" : alert ? "text-warn" : "text-muted"
                }`}
              >
                {dev == null
                  ? "—"
                  : `${dev >= 0 ? "+" : ""}${dev.toFixed(2)}%`}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="mt-3 text-meta text-faint">
        {t("pegNote", { warn: WARN_PCT })}
      </figcaption>
    </figure>
  );
}
