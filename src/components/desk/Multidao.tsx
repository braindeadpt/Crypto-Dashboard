"use client";

import type { MultidaoData, MultidaoQuadrant } from "@/lib/history/multidao";
import { quadrantOf } from "@/lib/history/multidao";
import { useMotion } from "@/lib/motion/useMotion";
import { useLocale, useTranslations } from "next-intl";

/**
 * A MULTIDÃO — campo de duas dimensões.
 *
 * X: posicionamento da multidão (rácio long/short). Y: direcção do preço.
 * O que interessa não é o nível de sentimento — é o DESACORDO entre a
 * multidão e o preço. O marcador de hoje deixa o rasto dos últimos dias;
 * se o rácio falhar, o campo diz-o em vez de inventar um ponto.
 */
const W = 640;
const H = 300;
const PAD = { l: 46, r: 18, t: 22, b: 40 };

export function Multidao({
  data,
  today,
}: {
  data: MultidaoData | null;
  /** Rácio e variação de hoje, ao vivo — null quando a fonte falha. */
  today: { ratio: number | null; chgPct: number | null } | null;
}) {
  const t = useTranslations("multidao");
  const locale = useLocale();
  const motion = useMotion();

  if (!data || data.days.length === 0) {
    return (
      <div className="border border-line bg-surface p-4">
        <p className="text-label text-faint">{t("title")}</p>
        <p className="mt-2 text-meta text-muted">{t("empty")}</p>
      </div>
    );
  }

  const allRatio = [
    ...data.days.map((d) => d.ratio),
    ...(today?.ratio != null ? [today.ratio] : []),
  ];
  const allChg = [
    ...data.days.map((d) => Math.abs(d.chgPct)),
    ...(today?.chgPct != null ? [Math.abs(today.chgPct)] : []),
  ];
  const xMin = Math.min(...allRatio, 0.85);
  const xMax = Math.max(...allRatio, 1.15);
  const yMax = Math.max(...allChg, 1) * 1.15;

  const x = (r: number) =>
    PAD.l + ((r - xMin) / (xMax - xMin)) * (W - PAD.l - PAD.r);
  const y = (c: number) =>
    PAD.t + (1 - (c / yMax + 1) / 2) * (H - PAD.t - PAD.b);

  const eq = x(1); // equilíbrio: multidão dividida
  const zero = y(0);

  const todayQuad: MultidaoQuadrant | null =
    today?.ratio != null && today.chgPct != null
      ? quadrantOf(today.ratio, today.chgPct)
      : null;

  const aria =
    locale === "pt"
      ? `A Multidão: rácio long/short contra direcção do preço, ${data.samples} dias.`
      : `The Crowd: long/short ratio vs price direction, ${data.samples} days.`;

  const breath = `${(2.4 * motion.cadence).toFixed(2)}s`;

  return (
    <div className="border border-line bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-label text-faint">{t("title")}</p>
        <p className="font-mono text-[0.68rem] tabular-nums text-muted">
          {t("todayLabel", { n: data.samples })}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full"
        role="img"
        aria-label={aria}
      >
        {/* quadrantes — nomes em língua comum, posição também no texto */}
        <text x={W - PAD.r} y={PAD.t + 10} textAnchor="end" className="fill-faint font-mono" fontSize="9">
          {t("q.longsUp")}
        </text>
        <text x={W - PAD.r} y={H - PAD.b - 6} textAnchor="end" className="fill-faint font-mono" fontSize="9">
          {t("q.longsDown")}
        </text>
        <text x={PAD.l + 4} y={PAD.t + 10} className="fill-faint font-mono" fontSize="9">
          {t("q.shortsUp")}
        </text>
        <text x={PAD.l + 4} y={H - PAD.b - 6} className="fill-faint font-mono" fontSize="9">
          {t("q.shortsDown")}
        </text>

        {/* eixos gravados: equilíbrio (rácio 1) e preço inalterado */}
        <line x1={eq} x2={eq} y1={PAD.t} y2={H - PAD.b} stroke="var(--line)" strokeDasharray="2 3" />
        <line x1={PAD.l} x2={W - PAD.r} y1={zero} y2={zero} stroke="var(--line)" strokeDasharray="2 3" />
        <text x={eq} y={H - PAD.b + 14} textAnchor="middle" className="fill-faint font-mono" fontSize="8.5">
          {t("equilibrium")}
        </text>
        <text x={PAD.l - 6} y={PAD.t + 4} textAnchor="end" className="fill-faint font-mono" fontSize="8.5">
          +{yMax.toFixed(0)}%
        </text>
        <text x={PAD.l - 6} y={H - PAD.b - 2} textAnchor="end" className="fill-faint font-mono" fontSize="8.5">
          −{yMax.toFixed(0)}%
        </text>
        <text x={PAD.l} y={H - 8} className="fill-faint font-mono" fontSize="8.5">
          {t("crowdShort")}
        </text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="fill-faint font-mono" fontSize="8.5">
          {t("crowdLong")}
        </text>

        {/* o rasto — mais antigo = mais ténue */}
        <polyline
          points={data.days.map((d) => `${x(d.ratio)},${y(d.chgPct)}`).join(" ")}
          fill="none"
          stroke="var(--accent)"
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        {data.days.map((d, i) => (
          <circle
            key={d.t}
            cx={x(d.ratio)}
            cy={y(d.chgPct)}
            r={2 + (i / data.days.length) * 1.5}
            fill="var(--accent)"
            opacity={0.25 + (i / data.days.length) * 0.55}
          >
            <title>{`${d.t} · ${t("ratio")} ${d.ratio.toFixed(2)} · ${d.chgPct >= 0 ? "+" : ""}${d.chgPct.toFixed(1)}% · ${t(`q.${d.quadrant}`)}`}</title>
          </circle>
        ))}

        {/* o marcador de hoje — respira ao ritmo do Maestro */}
        {today?.ratio != null && today.chgPct != null && (
          <g>
            {!motion.subdued && (
              <circle
                cx={x(today.ratio)}
                cy={y(today.chgPct)}
                r="7"
                fill="none"
                stroke="var(--accent2, var(--accent))"
                strokeWidth="1"
                className="multidao-breath"
                style={{ animationDuration: breath }}
              />
            )}
            <circle
              cx={x(today.ratio)}
              cy={y(today.chgPct)}
              r="4.5"
              fill="var(--accent2, var(--accent))"
              stroke="var(--bg)"
              strokeWidth="1.5"
            >
              <title>{`${t("today")} · ${t("ratio")} ${today.ratio.toFixed(2)} · ${today.chgPct >= 0 ? "+" : ""}${today.chgPct.toFixed(1)}%`}</title>
            </circle>
          </g>
        )}
      </svg>

      {/* alternativa textual — a posição não depende só de cor */}
      <p className="mt-2 text-meta text-muted">
        {todayQuad
          ? t("todayReading", {
              ratio: today!.ratio!.toFixed(2),
              chg: `${today!.chgPct! >= 0 ? "+" : ""}${today!.chgPct!.toFixed(1)}`,
              quadrant: t(`q.${todayQuad}`),
            })
          : t("noToday")}
      </p>
      <p className="mt-1 font-mono text-[0.62rem] text-faint">
        {t("legend")} · {data.source}
      </p>
    </div>
  );
}
