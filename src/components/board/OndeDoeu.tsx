"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { formatUsd } from "@/lib/format";
import type {
  ForceLiqConnection,
  ForceLiqEvent,
  ForceLiqWindow,
} from "@/lib/hooks/useForceLiquidations";
import { useMotion } from "@/lib/motion/useMotion";
import { cn } from "@/lib/format";

/**
 * ONDE DOEU — liquidações REAIS plotadas em preço × tempo.
 *
 * O Coinglass estima onde liquidações poderão ocorrer (modelo). Isto é o
 * contrário: cada golpe é um evento verdadeiro do stream forceOrder da
 * Binance, no seu preço, no momento em que chegou. Daí o rótulo obrigatório
 * "observado, não previsto" — é a distinção que justifica a peça.
 *
 * Janela: últimos 60 minutos (o hook poda); o que sai da janela desaparece
 * — não fabricamos história que não observámos.
 * Long = triângulo para baixo (venda forçada); short = para cima.
 * Forma E cor distinguem o lado — nunca só cor. Tamanho = nocional real.
 */

const LANES = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;
const WINDOW_MIN = 60;

function connLabel(
  t: ReturnType<typeof useTranslations>,
  c: ForceLiqConnection,
) {
  if (c === "live") return t("conn.live");
  if (c === "reconnecting") return t("conn.reconnecting");
  if (c === "offline") return t("conn.offline");
  return t("conn.connecting");
}

export function OndeDoeu({ data }: { data: ForceLiqWindow }) {
  const t = useTranslations("ondeDoeu");
  const motion = useMotion();

  /** Eventos por lane com escala de preço própria. A janela ancora no
      último evento recebido — pure render, determinista. */
  const t1 = data.lastEventAt ?? 0;
  const t0 = t1 - WINDOW_MIN * 60_000;
  const lanes = useMemo(() => {
    return LANES.map((sym) => {
      const evs = data.events
        .filter((e) => e.symbol === sym && e.time >= t0)
        .sort((a, b) => a.time - b.time);
      const prices = evs.map((e) => e.price);
      return {
        sym,
        evs,
        min: prices.length ? Math.min(...prices) : null,
        max: prices.length ? Math.max(...prices) : null,
      };
    });
  }, [data.events, t0]);

  const W = 720;
  const LANE_H = 56;
  const PAD = { l: 44, r: 58, t: 8, b: 22 };
  const H = PAD.t + LANES.length * LANE_H + PAD.b;
  const x = (time: number) =>
    PAD.l + ((time - t0) / (t1 - t0)) * (W - PAD.l - PAD.r);

  function eventMark(e: ForceLiqEvent, lane: (typeof lanes)[number]) {
    if (lane.min == null || lane.max == null) return null;
    const span = Math.max(lane.max - lane.min, lane.min * 0.0005);
    const yMid = PAD.t + LANES.indexOf(lane.sym as (typeof LANES)[number]) * LANE_H + LANE_H / 2;
    const y =
      yMid - ((e.price - lane.min) / span - 0.5) * (LANE_H - 18);
    const size = Math.max(
      3,
      Math.min(11, Math.sqrt(e.notional / 40_000) * 3),
    );
    const isNewest = data.lastEventAt != null && e.time === data.lastEventAt;
    const dur = 0.6 * motion.cadence;
    return (
      <g key={e.id}>
        {isNewest && !motion.subdued && (
          <circle
            cx={x(e.time)}
            cy={y}
            r={size + 4}
            className="liq-hit"
            style={{ animationDuration: `${dur}s` }}
          />
        )}
        <polygon
          points={
            e.side === "long"
              ? `${x(e.time)},${y + size} ${x(e.time) - size},${y - size} ${x(e.time) + size},${y - size}`
              : `${x(e.time)},${y - size} ${x(e.time) - size},${y + size} ${x(e.time) + size},${y + size}`
          }
          className={e.side === "long" ? "liq-long" : "liq-short"}
        >
          <title>
            {`${e.symbol.replace("USDT", "")} ${e.side === "long" ? t("longs") : t("shorts")} · ${formatUsd(e.notional, true)} @ ${formatUsd(e.price)}`}
          </title>
        </polygon>
      </g>
    );
  }

  const total = data.longNotional + data.shortNotional;

  return (
    <section
      className={cn(
        "border bg-surface p-5",
        data.connection === "live" ? "border-line" : "border-warn/35",
      )}
      aria-label={t("title")}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-title text-ink">{t("title")}</h2>
          <span
            className={cn(
              "font-mono text-[0.62rem] uppercase tracking-wider",
              data.connection === "live"
                ? "text-accent"
                : data.connection === "offline"
                  ? "text-faint"
                  : "text-warn",
            )}
          >
            {connLabel(t, data.connection)}
          </span>
          <span className="border border-line px-1.5 py-0.5 font-mono text-[0.58rem] uppercase tracking-wider text-faint">
            {t("observed")}
          </span>
        </div>
        <span className="font-mono text-[0.58rem] uppercase tracking-wider text-faint">
          {t("window", { min: WINDOW_MIN })}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.7rem] tabular-nums">
        <span className="text-down">
          {t("longs")} {formatUsd(data.longNotional, true)}
        </span>
        <span className="text-up">
          {t("shorts")} {formatUsd(data.shortNotional, true)}
        </span>
        <span className="text-faint">
          {t("total")} {formatUsd(total, true)}
        </span>
      </div>

      {total === 0 ? (
        <p className="mt-4 font-mono text-[0.7rem] text-muted">
          {t("waiting")}
        </p>
      ) : (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-3 w-full"
          role="img"
          aria-label={t("aria")}
        >
          {lanes.map((lane, li) => {
            const y0 = PAD.t + li * LANE_H;
            const yMid = y0 + LANE_H / 2;
            return (
              <g key={lane.sym}>
                <text
                  x={4}
                  y={yMid + 3}
                  className="fill-current font-mono text-[9px] text-faint"
                >
                  {lane.sym.replace("USDT", "")}
                </text>
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={y0}
                  y2={y0}
                  className="stroke-current text-line"
                  strokeWidth="0.5"
                />
                <line
                  x1={PAD.l}
                  x2={W - PAD.r}
                  y1={yMid}
                  y2={yMid}
                  className="stroke-current text-line"
                  strokeWidth="0.5"
                  strokeDasharray="2 3"
                />
                {lane.min != null && (
                  <>
                    <text
                      x={W - PAD.r + 2}
                      y={y0 + 8}
                      className="fill-current font-mono text-[8px] text-faint"
                    >
                      {formatUsd(lane.max!)}
                    </text>
                    <text
                      x={W - PAD.r + 2}
                      y={y0 + LANE_H - 4}
                      className="fill-current font-mono text-[8px] text-faint"
                    >
                      {formatUsd(lane.min)}
                    </text>
                  </>
                )}
                {lane.evs.map((e) => eventMark(e, lane))}
              </g>
            );
          })}
          <text
            x={PAD.l}
            y={H - 6}
            className="fill-current font-mono text-[8px] text-faint"
          >
            −{WINDOW_MIN}m
          </text>
          <text
            x={W - PAD.r}
            y={H - 6}
            textAnchor="end"
            className="fill-current font-mono text-[8px] text-faint"
          >
            {t("now")}
          </text>
        </svg>
      )}
    </section>
  );
}
