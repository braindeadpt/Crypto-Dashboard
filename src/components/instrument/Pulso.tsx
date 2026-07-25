"use client";

import {
  buildPulseDimensions,
  pulseShapeHint,
  type PulseDimension,
  type PulseDimensionId,
} from "@/lib/instrument/pulseDimensions";
import type { MetricContextApi } from "@/lib/history/context";
import type { HistoryMetricId } from "@/lib/history/metrics";
import type { RegimeResult } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useRef, useState } from "react";
import {
  exportPulsoPng,
  serializePulsoSvg,
} from "@/lib/share/pulsoExport";
import { utcToday } from "@/lib/history/series";

type Props = {
  regime: RegimeResult;
  hist: Partial<Record<HistoryMetricId, MetricContextApi>>;
  className?: string;
};

const CX = 160;
const CY = 160;
const R_MAX = 112;
const R_MIN = 28;

function polar(angleDeg: number, r: number): { x: number; y: number } {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function radiusFor(
  dim: PulseDimension,
  posture: RegimeResult["posture"],
  stress: number,
): number {
  // Insufficient → sit on inner dashed ring (honest hole, not invented)
  if (dim.radius == null) return R_MIN * 0.85;

  let r = R_MIN + dim.radius * (R_MAX - R_MIN);

  // Posture morphs silhouette recognizably
  if (posture === "calm") {
    r = R_MIN + dim.radius * (R_MAX - R_MIN) * 0.72;
  } else if (posture === "storm") {
    const spike = 1 + Math.min(0.35, dim.stressPoints / 40);
    r = Math.min(R_MAX + 8, r * spike);
  } else if (posture === "weird") {
    // Alternate pull — asymmetric recognisable silhouette
    const idx = ["breadth", "funding", "sentiment", "oi", "liquidity", "volatility"].indexOf(
      dim.id,
    );
    const twist = idx % 2 === 0 ? 1.12 : 0.82;
    r *= twist;
  } else {
    // unsettled — mild elongation on stressed axes
    if (dim.stressPoints > 0) r *= 1.08;
  }

  // Global stress scales envelope slightly
  const envelope = 0.92 + (stress / 100) * 0.16;
  return Math.max(R_MIN * 0.7, Math.min(R_MAX + 10, r * envelope));
}

function pathFor(
  dims: PulseDimension[],
  posture: RegimeResult["posture"],
  stress: number,
): string {
  const n = dims.length;
  const pts = dims.map((d, i) => {
    const angle = (360 / n) * i;
    const r = radiusFor(d, posture, stress);
    return polar(angle, r);
  });
  if (!pts.length) return "";
  // Smooth-ish closed polygon with slight curve toward next point midpoint
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 0; i < pts.length; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % pts.length];
    const mid = { x: (cur.x + next.x) / 2, y: (cur.y + next.y) / 2 };
    // Control toward centre for calm, away for storm
    const pull =
      posture === "storm" ? 1.08 : posture === "calm" ? 0.94 : 1;
    const c = {
      x: CX + (mid.x - CX) * pull,
      y: CY + (mid.y - CY) * pull,
    };
    d += ` Q ${c.x.toFixed(2)} ${c.y.toFixed(2)} ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }
  return d + " Z";
}

function formatValue(dim: PulseDimension): string {
  if (dim.value == null) return "—";
  switch (dim.id) {
    case "funding":
      return `${(dim.value * 100).toFixed(4)}%`;
    case "breadth":
    case "sentiment":
      return `${Math.round(dim.value)}`;
    case "volatility":
      return `${dim.value.toFixed(1)}%`;
    case "liquidity":
      return `${dim.value >= 0 ? "+" : ""}${dim.value.toFixed(0)}M`;
    case "oi": {
      const abs = Math.abs(dim.value);
      if (abs >= 1e9) return `$${(dim.value / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `$${(dim.value / 1e6).toFixed(0)}M`;
      return `$${dim.value.toFixed(0)}`;
    }
    default:
      return String(dim.value);
  }
}

/**
 * O Pulso — signature market-state silhouette.
 * Custom polar SVG; shape changes recognisably with regime posture.
 */
export function Pulso({ regime, hist, className = "" }: Props) {
  const locale = useLocale();
  const t = useTranslations("pulso");
  const loc = locale === "pt" ? "pt" : "en";
  const uid = useId().replace(/:/g, "");
  const dims = useMemo(
    () => buildPulseDimensions(hist, regime),
    [hist, regime],
  );
  const [active, setActive] = useState<PulseDimensionId | null>(null);
  const [sharing, setSharing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const d = pathFor(dims, regime.posture, regime.score);
  const activeDim = dims.find((x) => x.id === active) ?? null;
  const headline = loc === "pt" ? regime.headlinePt : regime.headlineEn;
  const summary = loc === "pt" ? regime.summaryPt : regime.summaryEn;
  const shape = pulseShapeHint(regime.posture, loc);
  const n = dims.length;

  const aria = useMemo(() => {
    const parts = dims.map((dim) => {
      const name = loc === "pt" ? dim.labelPt : dim.labelEn;
      if (dim.percentile == null) {
        return loc === "pt"
          ? `${name}: amostra curta (${dim.sampleDays}d)`
          : `${name}: short sample (${dim.sampleDays}d)`;
      }
      return `${name}: p${Math.round(dim.percentile)}`;
    });
    return `${t("ariaLead", { posture: t(`posture.${regime.posture}`) })}. ${headline}. ${parts.join(". ")}`;
  }, [dims, headline, loc, regime.posture, t]);

  async function onShare() {
    if (!svgRef.current || sharing) return;
    setSharing(true);
    try {
      await exportPulsoPng({
        date: utcToday(),
        postureLabel: t(`posture.${regime.posture}`),
        stress: regime.score,
        headline,
        summary,
        brand: "CLAREZA Crypto",
        svgMarkup: serializePulsoSvg(svgRef.current),
      });
    } catch {
      /* ignore */
    } finally {
      setSharing(false);
    }
  }

  return (
    <section
      className={`pulso panel-hero ${className}`}
      data-posture={regime.posture}
      aria-label={t("title")}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-8">
        {/* SVG instrument */}
        <div className="pulso__stage relative mx-auto w-full max-w-[320px] shrink-0 lg:mx-0">
          <svg
            ref={svgRef}
            viewBox="0 0 320 320"
            className="pulso__svg h-auto w-full"
            role="img"
            aria-label={aria}
          >
            <title>{aria}</title>
            <defs>
              <pattern
                id={`pulso-hatch-${uid}`}
                width="6"
                height="6"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(35)"
              >
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="6"
                  stroke="currentColor"
                  strokeOpacity="0.2"
                  strokeWidth="1"
                />
              </pattern>
            </defs>

            {/* Reference rings */}
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <circle
                key={f}
                cx={CX}
                cy={CY}
                r={R_MIN + f * (R_MAX - R_MIN)}
                fill="none"
                stroke="var(--line)"
                strokeWidth="1"
                strokeDasharray={f === 0.5 ? "none" : "2 3"}
              />
            ))}
            {/* Median ring label */}
            <text
              x={CX + 4}
              y={CY - (R_MIN + 0.5 * (R_MAX - R_MIN)) + 3}
              fill="var(--faint)"
              style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
            >
              p50
            </text>

            {/* Spokes */}
            {dims.map((dim, i) => {
              const angle = (360 / n) * i;
              const outer = polar(angle, R_MAX + 6);
              const tip = polar(
                angle,
                radiusFor(dim, regime.posture, regime.score),
              );
              const labelR = R_MAX + 28;
              const lp = polar(angle, labelR);
              const isOn = active === dim.id;
              return (
                <g key={dim.id}>
                  <line
                    x1={CX}
                    y1={CY}
                    x2={outer.x}
                    y2={outer.y}
                    stroke="var(--line)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={tip.x}
                    cy={tip.y}
                    r={dim.radius == null ? 3 : isOn ? 5 : 3.5}
                    fill={
                      dim.radius == null
                        ? "var(--faint)"
                        : isOn
                          ? "var(--accent)"
                          : "var(--ink)"
                    }
                    stroke="var(--bg)"
                    strokeWidth="1"
                    className="pulso__node"
                  />
                  {/* Hit target */}
                  <circle
                    cx={lp.x}
                    cy={lp.y}
                    r="22"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setActive(dim.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(dim.id)}
                    onBlur={() => setActive(null)}
                    tabIndex={0}
                    role="button"
                    aria-label={
                      loc === "pt" ? dim.labelPt : dim.labelEn
                    }
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isOn ? "var(--accent)" : "var(--muted)"}
                    style={{
                      fontSize: 10,
                      fontFamily: "var(--font-mono)",
                      fontWeight: isOn ? 600 : 400,
                    }}
                    className="pointer-events-none select-none"
                  >
                    {(loc === "pt" ? dim.labelPt : dim.labelEn).slice(0, 10)}
                  </text>
                  {dim.radius == null && (
                    <text
                      x={tip.x}
                      y={tip.y + 12}
                      textAnchor="middle"
                      fill="var(--faint)"
                      style={{ fontSize: 8, fontFamily: "var(--font-mono)" }}
                      className="pointer-events-none"
                    >
                      {dim.sampleDays}d
                    </text>
                  )}
                </g>
              );
            })}

            {/* Silhouette fill */}
            <path
              d={d}
              fill={
                regime.posture === "storm"
                  ? `url(#pulso-hatch-${uid})`
                  : "color-mix(in srgb, var(--accent) 14%, transparent)"
              }
              stroke={`var(--${regime.posture === "calm" ? "calm" : regime.posture === "storm" ? "storm" : regime.posture === "weird" ? "weird" : "unsettled"})`}
              strokeWidth="2"
              className="pulso__shape"
            />
            {/* Stroke outline on top for shareable edge */}
            <path
              d={d}
              fill="none"
              stroke="var(--ink)"
              strokeOpacity="0.35"
              strokeWidth="1"
              className="pulso__shape"
            />

            {/* Centre mark */}
            <circle
              cx={CX}
              cy={CY}
              r="4"
              fill="var(--ink)"
            />
            <text
              x={CX}
              y={CY + 18}
              textAnchor="middle"
              fill="var(--muted)"
              style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
            >
              {regime.score}
            </text>
          </svg>
        </div>

        {/* Textual reading — always present */}
        <div className="min-w-0 flex-1">
          <p className="text-label text-faint">{t("title")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className={`chip chip-${regime.posture}`}>
              {t(`posture.${regime.posture}`)}
            </span>
            <span className="text-data tabular-nums text-muted">
              {t("stress", { score: regime.score })}
            </span>
            <button
              type="button"
              onClick={() => void onShare()}
              disabled={sharing}
              className="ml-auto border border-line px-2 py-1 text-label text-muted hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {sharing ? t("sharing") : t("share")}
            </button>
          </div>
          <h2 className="mt-3 font-display text-title text-ink text-balance">
            {headline}
          </h2>
          <p className="mt-2 max-w-xl text-body text-muted">{summary}</p>
          <p className="mt-2 text-meta text-faint">{shape}</p>

          {/* Hover / focus panel */}
          <div
            className="mt-4 border border-line bg-surface p-3"
            aria-live="polite"
          >
            {activeDim ? (
              <>
                <p className="text-label text-accent">
                  {loc === "pt" ? activeDim.labelPt : activeDim.labelEn}
                </p>
                <p className="mt-1 text-data tabular-nums text-ink">
                  {formatValue(activeDim)}
                  {activeDim.percentile != null && (
                    <span className="ml-2 text-muted">
                      · p{Math.round(activeDim.percentile)} ·{" "}
                      {activeDim.sampleDays}d
                    </span>
                  )}
                  {activeDim.percentile == null && (
                    <span className="ml-2 text-warn">
                      · {t("shortSample", { days: activeDim.sampleDays })}
                    </span>
                  )}
                </p>
                <p className="mt-2 text-meta text-muted">
                  {loc === "pt" ? activeDim.explainPt : activeDim.explainEn}
                </p>
                <p className="mt-1 text-meta text-faint">
                  {t("source")}: {activeDim.source}
                  {activeDim.stressPoints > 0 && (
                    <span>
                      {" "}
                      · {t("contrib", { points: activeDim.stressPoints })}
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-meta text-muted">{t("hoverHint")}</p>
            )}
          </div>

          {/* Top regime contributors (real engine weights) */}
          {(regime.contributors?.length ?? 0) > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {regime.contributors.slice(0, 4).map((c) => (
                <li
                  key={c.id}
                  className="border border-line px-2 py-1 text-meta text-muted"
                >
                  <span className="text-ink">
                    {loc === "pt" ? c.labelPt : c.labelEn}
                  </span>
                  <span className="ml-1 tabular-nums text-warn">
                    +{c.points}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
