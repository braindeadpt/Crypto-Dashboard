"use client";

import { PercentileTwin } from "@/components/jargon/PercentileTwin";
import type { MetricContextApi } from "@/lib/history/context";
import {
  BAND_LABEL_EN,
  BAND_LABEL_PT,
  formatContextSentence,
} from "@/lib/history/format";
import type { MetricBand } from "@/lib/stats";
import { useTranslations } from "next-intl";

type Props = {
  context: MetricContextApi | null | undefined;
  /** Compact next to a number (~120px) or full instrument (~400px) */
  variant?: "inline" | "expanded";
  locale?: "pt" | "en";
  /** Prefer "stretched" wording for funding-like metrics */
  stretched?: boolean;
  className?: string;
  /** Optional visible label above expanded variant */
  label?: string;
  /**
   * plain = human sentence (Agora / Mundo / Fluxos)
   * technical = p71 · 90d (Instrumento)
   */
  caption?: "plain" | "technical";
};

const ZONE = {
  extremeLow: 5,
  low: 20,
  high: 80,
  extremeHigh: 95,
} as const;

function bandLabel(band: MetricBand, locale: "pt" | "en"): string {
  return locale === "pt" ? BAND_LABEL_PT[band] : BAND_LABEL_EN[band];
}

function ariaText(
  ctx: MetricContextApi | null | undefined,
  locale: "pt" | "en",
  stretched: boolean,
): string {
  if (!ctx) {
    return locale === "pt"
      ? "Régua: sem histórico persistido."
      : "Ruler: no persisted history.";
  }
  if (ctx.classificação === "insufficient" || ctx.percentil == null) {
    return locale === "pt"
      ? `Régua: amostra curta — só ${ctx.diasDeAmostra} dias de histórico.`
      : `Ruler: short sample — only ${ctx.diasDeAmostra} days of history.`;
  }
  const band = bandLabel(ctx.classificação, locale);
  const sentence = formatContextSentence(ctx, locale, {
    stretchedLabel: stretched,
  });
  return locale === "pt"
    ? `Régua: posição ${band}. ${sentence}.`
    : `Ruler: ${band} position. ${sentence}.`;
}

/**
 * A Régua — calibrated distribution instrument.
 * Shows where today sits vs the window: zones, median, current mark.
 * Custom SVG only — no chart library defaults.
 */
export function Regua({
  context,
  variant = "inline",
  locale = "pt",
  stretched = false,
  className = "",
  label,
  caption = "plain",
}: Props) {
  const tPct = useTranslations("jargon.percentile");
  const insufficient =
    !context ||
    context.classificação === "insufficient" ||
    context.percentil == null ||
    context.diasDeAmostra < 7;

  const pct = context?.percentil ?? null;
  const medianPct =
    context &&
    context.min != null &&
    context.max != null &&
    context.mediana != null &&
    context.max !== context.min
      ? ((context.mediana - context.min) / (context.max - context.min)) * 100
      : 50;

  const w = variant === "inline" ? 120 : 400;
  const h = variant === "inline" ? 16 : 56;
  const padX = variant === "inline" ? 2 : 28;
  const trackY = variant === "inline" ? 6 : 22;
  const trackH = variant === "inline" ? 4 : 8;
  const trackW = w - padX * 2;
  const xAt = (p: number) => padX + (Math.max(0, Math.min(100, p)) / 100) * trackW;

  const descId = `regua-desc-${variant}-${context?.diasDeAmostra ?? 0}-${Math.round(pct ?? 0)}`;

  return (
    <figure
      className={`regua regua--${variant} ${insufficient ? "regua--short" : ""} ${className}`}
      aria-labelledby={undefined}
    >
      {label && variant === "expanded" && (
        <figcaption className="mb-1 text-label text-faint">{label}</figcaption>
      )}
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-describedby={descId}
        className="regua__svg block max-w-full"
      >
        <title>{ariaText(context, locale, stretched)}</title>
        <desc id={descId}>{ariaText(context, locale, stretched)}</desc>

        <defs>
          <pattern
            id={`${descId}-hatch`}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="4"
              stroke="var(--ink)"
              strokeOpacity="0.22"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        {/* Track base */}
        <rect
          x={padX}
          y={trackY}
          width={trackW}
          height={trackH}
          fill="var(--surface-2)"
          stroke="var(--line-strong)"
          strokeWidth="1"
          rx="1"
        />

        {/* Extreme zones — hatch, not colour alone */}
        <rect
          x={xAt(0)}
          y={trackY}
          width={xAt(ZONE.extremeLow) - xAt(0)}
          height={trackH}
          fill={`url(#${descId}-hatch)`}
        />
        <rect
          x={xAt(ZONE.extremeHigh)}
          y={trackY}
          width={xAt(100) - xAt(ZONE.extremeHigh)}
          height={trackH}
          fill={`url(#${descId}-hatch)`}
        />

        {/* Zone ticks */}
        {[ZONE.extremeLow, ZONE.low, ZONE.high, ZONE.extremeHigh].map((z) => (
          <line
            key={z}
            x1={xAt(z)}
            x2={xAt(z)}
            y1={trackY - 1}
            y2={trackY + trackH + 1}
            stroke="var(--line-strong)"
            strokeWidth="1"
          />
        ))}

        {/* Median reference — triangle below track */}
        {!insufficient && (
          <polygon
            points={`${xAt(medianPct)},${trackY + trackH + 2} ${xAt(medianPct) - 3},${trackY + trackH + 7} ${xAt(medianPct) + 3},${trackY + trackH + 7}`}
            fill="var(--muted)"
          >
            <title>
              {locale === "pt" ? "Mediana da janela" : "Window median"}
            </title>
          </polygon>
        )}

        {/* Current position */}
        {insufficient ? (
          <g opacity="0.55">
            <line
              x1={padX}
              x2={padX + trackW}
              y1={trackY + trackH / 2}
              y2={trackY + trackH / 2}
              stroke="var(--faint)"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            {variant === "expanded" && (
              <text
                x={w / 2}
                y={trackY - 6}
                textAnchor="middle"
                fill="var(--muted)"
                style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
              >
                {locale === "pt"
                  ? `${context?.diasDeAmostra ?? 0}d · amostra curta`
                  : `${context?.diasDeAmostra ?? 0}d · short sample`}
              </text>
            )}
          </g>
        ) : (
          <g>
            {/* Stem */}
            <line
              x1={xAt(pct!)}
              x2={xAt(pct!)}
              y1={trackY - 4}
              y2={trackY + trackH + 1}
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
            {/* Diamond marker — shape, not just colour */}
            <polygon
              points={`${xAt(pct!)},${trackY - 5} ${xAt(pct!) + 4},${trackY - 1} ${xAt(pct!)},${trackY + 3} ${xAt(pct!) - 4},${trackY - 1}`}
              fill="var(--accent)"
              stroke="var(--bg)"
              strokeWidth="1"
            />
          </g>
        )}

        {variant === "expanded" && !insufficient && context && (
          <g
            fill="var(--muted)"
            style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
          >
            <text x={padX} y={h - 4}>
              {formatAxis(context.min)}
            </text>
            <text x={w / 2} y={h - 4} textAnchor="middle">
              {locale === "pt" ? "med" : "med"} {formatAxis(context.mediana)}
            </text>
            <text x={w - padX} y={h - 4} textAnchor="end">
              {formatAxis(context.max)}
            </text>
          </g>
        )}
      </svg>

      {/* Visible text backup — never colour-only */}
      <p className="sr-only">{ariaText(context, locale, stretched)}</p>
      {variant === "inline" && (
        <PercentileTwin
          context={context}
          technical={caption === "technical"}
          className="regua__caption"
        />
      )}
      {variant === "expanded" && !insufficient && pct != null && context && (
        <p className="mt-1 text-meta text-muted">
          {caption === "technical"
            ? `${tPct("tech", { p: Math.round(pct), days: context.diasDeAmostra })} · ${bandLabel(context.classificação, locale)}`
            : tPct("line", { p: Math.round(pct), days: context.diasDeAmostra })}
        </p>
      )}
      {variant === "expanded" && insufficient && (
        <PercentileTwin context={context} className="mt-1 block" />
      )}
    </figure>
  );
}

function formatAxis(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (abs >= 10) return n.toFixed(1);
  if (abs >= 0.01) return n.toFixed(3);
  return n.toFixed(5);
}
