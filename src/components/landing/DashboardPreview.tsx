"use client";

import { AnimatedNumber } from "@/components/landing/AnimatedNumber";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type {
  MarketSnapshot,
  RegimeResult,
  SentimentSnapshot,
} from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

type Props = {
  market: MarketSnapshot;
  sentiment: SentimentSnapshot;
  regime: RegimeResult;
};

const STREAM_KEYS = [
  "feed.btcTick",
  "feed.funding",
  "feed.oi",
  "feed.fng",
  "feed.dominance",
  "feed.case",
] as const;

export function DashboardPreview({ market, sentiment, regime }: Props) {
  const t = useTranslations("landing.preview");
  const locale = useLocale();
  const [activePanel, setActivePanel] = useState<"market" | "risk" | "cycle">(
    "market",
  );
  const [streamIdx, setStreamIdx] = useState(0);
  const [hoverZone, setHoverZone] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setStreamIdx((i) => (i + 1) % STREAM_KEYS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const chartPoints = useMemo(() => {
    const base = market.btc.price;
    const pts: number[] = [];
    let v = base * 0.97;
    for (let i = 0; i < 32; i++) {
      const wave = Math.sin(i / 4.2) * 0.008 + Math.cos(i / 7) * 0.004;
      const drift = (i / 32) * (market.btc.change24h / 100) * 0.6;
      v = base * (0.97 + drift + wave);
      pts.push(v);
    }
    pts[pts.length - 1] = base;
    return pts;
  }, [market.btc.price, market.btc.change24h]);

  const path = useMemo(() => toSparkPath(chartPoints, 320, 96), [chartPoints]);
  const area = useMemo(() => toAreaPath(chartPoints, 320, 96), [chartPoints]);

  const headline = locale === "pt" ? regime.headlinePt : regime.headlineEn;
  const dont = locale === "pt" ? regime.dontPt : regime.dontEn;

  const streamValues: Record<(typeof STREAM_KEYS)[number], string> = {
    "feed.btcTick": `BTC ${formatUsd(market.btc.price)} ${formatPct(market.btc.change24h)}`,
    "feed.funding": `FUND ${(sentiment.funding.rate * 100).toFixed(4)}%`,
    "feed.oi": `OI ${formatUsd(sentiment.openInterest.value, true)}`,
    "feed.fng": `F&G ${sentiment.fearGreed.value} · ${sentiment.fearGreed.classification}`,
    "feed.dominance": `DOM ${market.global.btcDominance.toFixed(2)}%`,
    "feed.case": t("streamCase"),
  };

  return (
    <div className="relative overflow-hidden border border-line bg-surface shadow-[0_0_0_1px_rgba(61,255,168,0.06)]">
      <div className="scan-line" aria-hidden />

      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg-elevated px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-3">
          <span className="live-dot" />
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-accent">
            {t("session")}
          </span>
          <span className="hidden font-mono text-[0.65rem] text-faint sm:inline">
            DESK · {regime.posture.toUpperCase()}
          </span>
        </div>
        <div className="flex gap-1">
          {(
            [
              ["market", t("tabMarket")],
              ["risk", t("tabRisk")],
              ["cycle", t("tabCycle")],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActivePanel(id)}
              className={`font-mono px-2.5 py-1 text-[0.65rem] uppercase tracking-wider transition ${
                activePanel === id
                  ? "bg-accent-dim text-accent border border-accent/30"
                  : "text-faint border border-transparent hover:text-muted hover:border-line"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.35fr_0.9fr]">
        {/* Main chart / map */}
        <div className="border-b border-line lg:border-b-0 lg:border-r">
          <div className="flex items-end justify-between gap-3 px-4 pt-4">
            <div>
              <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">
                {activePanel === "market"
                  ? t("chartBtc")
                  : activePanel === "risk"
                    ? t("chartRisk")
                    : t("chartCycle")}
              </p>
              <p className="mt-1 font-mono text-2xl font-medium tabular-nums sm:text-3xl">
                {activePanel === "market" && formatUsd(market.btc.price)}
                {activePanel === "risk" && (
                  <>
                    <AnimatedNumber value={sentiment.fearGreed.value} />
                    <span className="ml-2 text-sm text-muted">F&G</span>
                  </>
                )}
                {activePanel === "cycle" && (
                  <span className="text-xl sm:text-2xl">
                    {locale === "pt" ? "Fase activa" : "Active phase"}
                  </span>
                )}
              </p>
              {activePanel === "market" && (
                <p
                  className={`mt-1 font-mono text-sm tabular-nums ${deltaClass(market.btc.change24h)}`}
                >
                  {formatPct(market.btc.change24h)} 24h
                </p>
              )}
            </div>
            <p className="max-w-[14rem] text-right font-mono text-[0.65rem] leading-snug text-faint">
              {hoverZone === "zoneChart"
                ? t("zoneChart")
                : hoverZone === "zoneAlert"
                  ? t("zoneAlert")
                  : hoverZone === "zoneStream"
                    ? t("zoneStream")
                    : t("hoverHint")}
            </p>
          </div>

          <div
            className="relative px-3 pb-3 pt-2"
            onMouseEnter={() => setHoverZone("zoneChart")}
            onMouseLeave={() => setHoverZone(null)}
          >
            {activePanel === "cycle" ? (
              <CycleMap locale={locale} />
            ) : (
              <svg
                viewBox="0 0 320 96"
                className="h-28 w-full sm:h-36"
                preserveAspectRatio="none"
                role="img"
                aria-label={t("chartBtc")}
              >
                <defs>
                  <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(61,255,168,0.22)" />
                    <stop offset="100%" stopColor="rgba(61,255,168,0)" />
                  </linearGradient>
                </defs>
                {[0.25, 0.5, 0.75].map((y) => (
                  <line
                    key={y}
                    x1="0"
                    x2="320"
                    y1={96 * y}
                    y2={96 * y}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                ))}
                <path d={area} fill="url(#fillGrad)" />
                <path
                  d={path}
                  fill="none"
                  stroke={
                    activePanel === "risk" ? "var(--warn)" : "var(--accent)"
                  }
                  strokeWidth="1.5"
                  className="chart-path"
                />
              </svg>
            )}
          </div>

          {/* Layer chips */}
          <div className="flex flex-wrap gap-2 border-t border-line px-4 py-3">
            {[t("layerPrice"), t("layerFunding"), t("layerDom")].map((layer) => (
              <span key={layer} className="chip">
                {layer}
              </span>
            ))}
          </div>
        </div>

        {/* Side: alerts + stream */}
        <div className="flex flex-col">
          <div
            className="border-b border-line p-4 alert-pulse"
            onMouseEnter={() => setHoverZone("zoneAlert")}
            onMouseLeave={() => setHoverZone(null)}
          >
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-warn">
              {t("alert")}
            </p>
            <p className="mt-2 text-sm leading-snug text-ink">{dont}</p>
          </div>

          <div className="border-b border-line p-4">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">
              {t("posture")}
            </p>
            <p className="mt-2 text-sm font-medium leading-snug">{headline}</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`chip chip-${regime.posture}`}>
                {regime.posture}
              </span>
              <span className="font-mono text-[0.7rem] text-muted">
                stress {regime.score}/100
              </span>
            </div>
          </div>

          <div
            className="flex-1 p-4"
            onMouseEnter={() => setHoverZone("zoneStream")}
            onMouseLeave={() => setHoverZone(null)}
          >
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">
              {t("stream")}
            </p>
            <ul className="mt-3 space-y-2 font-mono text-[0.72rem]">
              {STREAM_KEYS.map((key, i) => (
                <li
                  key={key}
                  className={`flex justify-between gap-3 border-b border-line/60 pb-1.5 ${
                    i === streamIdx ? "text-accent" : "text-muted"
                  }`}
                >
                  <span className="text-faint">
                    {new Date(
                      Date.now() - (STREAM_KEYS.length - i) * 14000,
                    ).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                  <span className="truncate text-right">
                    {streamValues[key]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Status footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-bg-elevated px-4 py-2">
        <div className="flex items-center gap-4 font-mono text-[0.62rem] uppercase tracking-wider text-faint">
          <span className="inline-flex items-center gap-1.5">
            <span className="live-dot" />
            {t("feedsOk")}
          </span>
          <span>LAT &lt; 60s</span>
        </div>
        <span className="font-mono text-[0.62rem] text-faint">
          {t("sources")}: CoinGecko · Binance · DefiLlama · Alt.me
        </span>
      </div>
    </div>
  );
}

function CycleMap({ locale }: { locale: string }) {
  return (
    <div className="relative h-28 w-full overflow-hidden border border-line bg-bg-elevated sm:h-36">
      <svg viewBox="0 0 320 120" className="h-full w-full" aria-hidden>
        <circle
          cx="160"
          cy="60"
          r="44"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="1"
        />
        <circle
          cx="160"
          cy="60"
          r="44"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeDasharray="70 210"
          strokeLinecap="square"
          transform="rotate(-90 160 60)"
          className="chart-path"
        />
        <line
          x1="160"
          y1="16"
          x2="160"
          y2="104"
          stroke="rgba(255,255,255,0.06)"
        />
        <line
          x1="116"
          y1="60"
          x2="204"
          y2="60"
          stroke="rgba(255,255,255,0.06)"
        />
        <circle cx="198" cy="38" r="3" fill="var(--accent)" />
      </svg>
      <p className="pointer-events-none absolute inset-x-0 bottom-2 text-center font-mono text-[0.65rem] text-muted">
        {locale === "pt" ? "Camada de ciclo · 4 anos" : "Cycle layer · 4yr"}
      </p>
    </div>
  );
}

function toSparkPath(values: number[], w: number, h: number): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function toAreaPath(values: number[], w: number, h: number): string {
  const line = toSparkPath(values, w, h);
  return `${line} L${w} ${h} L0 ${h} Z`;
}
