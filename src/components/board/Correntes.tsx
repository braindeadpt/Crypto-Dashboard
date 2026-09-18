"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { formatUsd } from "@/lib/format";
import { DataAge } from "@/components/explain/DataAge";
import type { CorrentesData, CorrenteSeries } from "@/lib/history/correntes";
import { useMotion } from "@/lib/motion/useMotion";

/**
 * AS CORRENTES — horizon chart das nove séries de 90 dias.
 *
 * Cada banda é o desvio da série face à SUA mediana — dólares, taxas e
 * índices comparam-se directamente. Metade de cima = acima da mediana,
 * metade de baixo = abaixo; a escuridão marca a magnitude (posição E cor
 * distinguem o sinal — nunca só cor). Lacunas >3,5 dias partem a banda:
 * não interpolamos dados que não existem.
 *
 * SVG próprio sobre os tokens — sem biblioteca de gráficos.
 */

const W = 780;
const LABEL_W = 178;
const ROW_H = 40;
const PAD_T = 8;
const PAD_B = 20;
const HALF = ROW_H / 2 - 4;
const BANDS = 3;
/** Cada banda cobre um terço do desvio máximo — sobrepostas escurecem. */
const BAND_OPACITY = [0.3, 0.3, 0.3];
/** Lacuna temporal que parte a banda (fins-de-semana de ETF ligam: 3d). */
const GAP_SPLIT_MS = 3.5 * 24 * 60 * 60_000;

function fmtValue(id: string, v: number): string {
  switch (id) {
    case "funding_btc":
      return `${(v * 100).toFixed(4)}%`;
    case "vol_realized_btc":
      return `${v.toFixed(1)}%`;
    case "fear_greed":
      return `${Math.round(v)}/100`;
    case "etf_btc_flow":
      return `${v < 0 ? "−" : ""}$${Math.abs(v).toFixed(0)}M`;
    case "breadth":
    case "btc_dominance":
      return `${v.toFixed(1)}%`;
    case "fee_btc":
      return `${v.toFixed(0)} sat/vB`;
    default:
      return formatUsd(v, true);
  }
}

type RowGeom = {
  /** path `d` por banda [0..2] e sinal — já segmentada nas lacunas. */
  up: string[][];
  down: string[][];
  edgeX: number | null;
  edgeY: number | null;
  edgeUp: boolean;
};

function buildRow(
  s: CorrenteSeries,
  t0: number,
  t1: number,
  rowTop: number,
): RowGeom {
  const baseline = rowTop + ROW_H / 2;
  const x0 = LABEL_W;
  const x1 = W - 8;
  const span = Math.max(1, t1 - t0);
  const x = (t: number) => x0 + ((t - t0) / span) * (x1 - x0);

  const up: string[][] = Array.from({ length: BANDS }, () => []);
  const down: string[][] = Array.from({ length: BANDS }, () => []);

  if (s.median == null || s.scale <= 0 || !s.points.length) {
    return { up, down, edgeX: null, edgeY: null, edgeUp: true };
  }

  // Segmentos contíguos — corta em lacunas >3,5d, nunca interpola.
  const segs: { t: number; v: number }[][] = [];
  let cur: { t: number; v: number }[] = [];
  for (const p of s.points) {
    const ts = Date.parse(p.t.length === 10 ? `${p.t}T00:00:00Z` : p.t);
    if (!Number.isFinite(ts) || ts < t0 || ts > t1) continue;
    if (cur.length && ts - cur[cur.length - 1].t > GAP_SPLIT_MS) {
      segs.push(cur);
      cur = [];
    }
    cur.push({ t: ts, v: p.v });
  }
  if (cur.length) segs.push(cur);

  for (const seg of segs) {
    if (!seg.length) continue;
    for (let b = 0; b < BANDS; b++) {
      for (const sign of [1, -1] as const) {
        const pts: string[] = [];
        for (const p of seg) {
          const dev = (p.v - s.median!) / s.scale; // −1..1
          const mag = Math.max(0, Math.min(1, dev * sign));
          const h = Math.min(Math.max(mag - b / BANDS, 0), 1 / BANDS) * BANDS * HALF;
          pts.push(`${x(p.t).toFixed(1)},${(baseline - sign * h).toFixed(1)}`);
        }
        if (pts.length < 2) continue;
        const d = `M${x(seg[0].t).toFixed(1)},${baseline.toFixed(1)}L${pts.join("L")}L${x(seg[seg.length - 1].t).toFixed(1)},${baseline.toFixed(1)}Z`;
        (sign === 1 ? up : down)[b].push(d);
      }
    }
  }

  // Aresta de hoje — último ponto real da série.
  const last = s.points[s.points.length - 1];
  const lastT = Date.parse(last.t.length === 10 ? `${last.t}T00:00:00Z` : last.t);
  const dev = s.median != null && s.scale > 0 ? (last.v - s.median) / s.scale : 0;
  const edgeUp = dev >= 0;
  const edgeX = lastT >= t0 && lastT <= t1 ? x(lastT) : null;
  const edgeY =
    edgeX != null
      ? baseline - Math.sign(dev || 1) * Math.min(Math.abs(dev), 1) * HALF
      : null;

  return { up, down, edgeX, edgeY, edgeUp };
}

export function Correntes({ data }: { data: CorrentesData }) {
  const t = useTranslations("correntes");
  const motion = useMotion();

  const t1 = useMemo(() => {
    let m = 0;
    for (const s of data.series) {
      for (const p of s.points) {
        const ts = Date.parse(p.t.length === 10 ? `${p.t}T00:00:00Z` : p.t);
        if (ts > m) m = ts;
      }
    }
    return m;
  }, [data.series]);
  const t0 = t1 - data.windowDays * 24 * 60 * 60_000;

  const rows = useMemo(
    () =>
      data.series.map((s, i) => ({
        s,
        geom: buildRow(s, t0, t1, PAD_T + i * ROW_H),
      })),
    [data.series, t0, t1],
  );

  const H = PAD_T + data.series.length * ROW_H + PAD_B;
  const fillDur = 0.9 * motion.cadence;

  if (!data.series.length) {
    return <p className="text-meta text-faint">{t("empty")}</p>;
  }

  return (
    <figure className="border border-line bg-surface p-4" aria-label={t("aria")}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[0.62rem] uppercase tracking-wider text-faint">
          {t("legend")}
        </span>
        <DataAge at={data.updatedAt} className="text-[0.62rem]" />
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full"
        role="img"
        aria-hidden="true"
      >
        <defs>
          {rows.map((_, i) => (
            <clipPath key={i} id={`corrente-wipe-${i}`}>
              <rect
                x={LABEL_W}
                y={PAD_T + i * ROW_H - 2}
                width={W - LABEL_W}
                height={ROW_H + 4}
                className={motion.subdued ? undefined : "corrente-wipe"}
                style={
                  motion.subdued
                    ? undefined
                    : {
                        animationDuration: `${fillDur}s`,
                        animationDelay: `${i * 0.07 * motion.cadence}s`,
                      }
                }
              />
            </clipPath>
          ))}
        </defs>

        {rows.map(({ s, geom }, i) => {
          const baseline = PAD_T + i * ROW_H + ROW_H / 2;
          return (
            <g key={s.id}>
              {/* hit-area + hover nativo: valor, percentil, amostra, fonte */}
              <rect
                x={0}
                y={PAD_T + i * ROW_H}
                width={W}
                height={ROW_H}
                fill="transparent"
              >
                <title>
                  {`${t(`series.${s.id}`)} — ${t("hoverValue")} ${
                    s.latest != null ? fmtValue(s.id, s.latest) : "—"
                  } · ${t("hoverPercentile")} ${
                    s.percentile != null ? `p${Math.round(s.percentile)}` : "—"
                  } · ${t("hoverDays", { days: s.days })} · ${s.source}`}
                </title>
              </rect>

              <text
                x={4}
                y={baseline - 2}
                className="fill-current font-mono text-[9.5px] text-ink"
              >
                {t(`series.${s.id}`)}
              </text>
              <text
                x={4}
                y={baseline + 9}
                className="fill-current font-mono text-[7.5px] text-faint"
              >
                {s.percentile != null
                  ? `p${Math.round(s.percentile)} · ${s.days}d`
                  : `${s.days}d`}
              </text>

              <g clipPath={`url(#corrente-wipe-${i})`}>
              <line
                x1={LABEL_W}
                x2={W - 8}
                y1={baseline}
                y2={baseline}
                className="stroke-current text-line"
                strokeWidth="0.5"
              />

              {geom.up.map((paths, b) =>
                paths.map((d, j) => (
                  <path
                    key={`u${b}-${j}`}
                    d={d}
                    className="corrente-up"
                    opacity={BAND_OPACITY[b]}
                  />
                )),
              )}
              {geom.down.map((paths, b) =>
                paths.map((d, j) => (
                  <path
                    key={`d${b}-${j}`}
                    d={d}
                    className="corrente-down"
                    opacity={BAND_OPACITY[b]}
                  />
                )),
              )}

              {geom.edgeX != null && geom.edgeY != null && (
                <circle
                  cx={geom.edgeX}
                  cy={geom.edgeY}
                  r={2.2}
                  className={`${
                    geom.edgeUp ? "corrente-edge-up" : "corrente-edge-down"
                  } ${motion.subdued ? "" : "corrente-edge-pulse"}`}
                  style={
                    motion.subdued
                      ? undefined
                      : { animationDuration: `${2.4 * motion.cadence}s` }
                  }
                />
              )}
              </g>
            </g>
          );
        })}

        <text
          x={LABEL_W}
          y={H - 6}
          className="fill-current font-mono text-[8px] text-faint"
        >
          {t("axisStart", { days: data.windowDays })}
        </text>
        <text
          x={W - 8}
          y={H - 6}
          textAnchor="end"
          className="fill-current font-mono text-[8px] text-faint"
        >
          {t("axisEnd")}
        </text>
      </svg>

      {/* Amostra curta — assinalada, nunca fingida */}
      {data.shortSample.length > 0 && (
        <p className="mt-2 font-mono text-[0.6rem] text-faint">
          {t("shortSample")}{" "}
          {data.shortSample.map((id) => t(`series.${id}`)).join(" · ")}
        </p>
      )}

      {/* Alternativa textual — a tabela carrega o que a cor não pode */}
      <details className="mt-2">
        <summary className="cursor-pointer font-mono text-[0.62rem] uppercase tracking-wider text-muted">
          {t("tableShow")}
        </summary>
        <table className="mt-2 w-full font-mono text-[0.68rem] tabular-nums">
          <thead>
            <tr className="text-left text-faint">
              <th className="pb-1 font-normal">{t("thSeries")}</th>
              <th className="pb-1 text-right font-normal">{t("thToday")}</th>
              <th className="pb-1 text-right font-normal">{t("thPercentile")}</th>
              <th className="pb-1 text-right font-normal">{t("thDays")}</th>
            </tr>
          </thead>
          <tbody>
            {data.series.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="py-1 text-ink">{t(`series.${s.id}`)}</td>
                <td className="py-1 text-right text-muted">
                  {s.latest != null ? fmtValue(s.id, s.latest) : "—"}
                </td>
                <td className="py-1 text-right text-muted">
                  {s.percentile != null ? `p${Math.round(s.percentile)}` : "—"}
                </td>
                <td className="py-1 text-right text-faint">{s.days}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
