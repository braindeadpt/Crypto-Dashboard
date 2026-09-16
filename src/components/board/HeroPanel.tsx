"use client";

import { AmbientField } from "@/components/ambient/AmbientField";
import { AnimatedNumber } from "@/components/board/AnimatedNumber";
import { Sparkline } from "@/components/board/Sparkline";
import { LOW_CONFIDENCE, type ReadingSet } from "@/lib/reading";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { MarketPosture } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

type Ticker = {
  px: number | undefined;
  chg: number | undefined;
  spark?: number[];
};

/**
 * Nível 0 — o cabeçalho do dia. Estrutura editorial, não painel:
 * masthead (data + regime) → a resposta (manchete + índice de leituras) →
 * a tape (preço live + vitals numa régua dividida por hairlines).
 */
export function HeroPanel({
  readings,
  date,
  btc,
  eth,
  sol,
  intensity = 0.5,
  posture,
  vitals,
}: {
  readings: ReadingSet;
  date: string;
  btc: Ticker;
  eth: Ticker;
  sol: Ticker;
  /** Regime score 0..1 — o campo ambiental reage (calmo = esparso, tempestade = denso). */
  intensity?: number;
  posture?: MarketPosture;
  vitals?: {
    cap: number;
    capChg: number | null;
    vol: number;
    dom: number;
  };
}) {
  const t = useTranslations("readings");
  const tp = useTranslations("pulso");
  const locale = useLocale();
  const isPt = locale === "pt";

  return (
    <section>
      {/* Masthead — o cabeçalho do jornal: data, nome do dia, regime */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2">
        <p className="text-label text-faint">{t("todayEyebrow")}</p>
        <p className="flex items-center gap-3 text-label text-faint tabular-nums">
          {posture && (
            <span className={`chip chip-${posture}`}>
              {tp(`posture.${posture}`)}
            </span>
          )}
          {date}
        </p>
      </div>

      {/* A resposta — manchete grande + índice das três leituras */}
      <div className="relative overflow-hidden">
        <AmbientField intensity={intensity} />
        <div className="relative grid gap-8 py-8 md:py-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="max-w-[16ch] font-display text-display leading-[1.02] text-ink lg:text-hero">
              {isPt ? readings.headlinePt : readings.headlineEn}
            </h1>
            <p className="mt-6 max-w-xl border-l-2 border-accent-2 pl-4 text-body text-muted">
              <span className="text-label text-accent-2">{t("watch")} </span>
              {isPt ? readings.watchPt : readings.watchEn}
            </p>
          </div>

          {/* Índice — as três leituras como entrada de índice, não cards */}
          <div className="border-t border-line lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-8">
            {(
              [
                ["01", readings.direction],
                ["02", readings.risk],
                ["03", readings.money],
              ] as const
            ).map(([n, r]) => (
              <ReadingRow key={r.id} n={n} reading={r} />
            ))}
          </div>
        </div>
      </div>

      {/* A tape — preço live e vitals numa régua dividida, sem caixa */}
      <div className="border-y border-line">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 lg:divide-x lg:divide-line">
          {/* BTC — célula dominante com sparkline */}
          <div className="col-span-2 py-4 sm:col-span-3 lg:col-span-2 lg:pr-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-label text-faint">BTC</p>
                <p className="mt-1 font-display text-display leading-none text-ink">
                  {btc.px != null ? (
                    <AnimatedNumber
                      value={btc.px}
                      format={formatUsd}
                      className={deltaClass(btc.chg ?? 0)}
                    />
                  ) : (
                    "—"
                  )}
                  {btc.chg != null && (
                    <span className={`ml-3 text-data ${deltaClass(btc.chg)}`}>
                      {btc.chg >= 0 ? "▲" : "▼"} {formatPct(btc.chg)}
                    </span>
                  )}
                </p>
              </div>
              {btc.spark && btc.spark.length > 1 && (
                <div className="min-w-32 flex-1">
                  <p className="mb-1 text-label text-faint">{t("spark7d")}</p>
                  <Sparkline
                    points={btc.spark}
                    up={(btc.chg ?? 0) >= 0}
                    className="block w-full"
                    height={40}
                  />
                </div>
              )}
            </div>
          </div>
          <TapeCell
            label="ETH"
            value={eth.px != null ? formatUsd(eth.px) : "—"}
            delta={eth.chg}
          />
          <TapeCell
            label="SOL"
            value={sol.px != null ? formatUsd(sol.px) : "—"}
            delta={sol.chg}
          />
          {vitals && (
            <>
              <TapeCell
                label={t("vitalsCap")}
                value={formatUsd(vitals.cap, true)}
                delta={vitals.capChg}
              />
              <TapeCell
                label={t("vitalsDom")}
                value={formatPct(vitals.dom, 1)}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function TapeCell({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="py-4 lg:pl-6">
      <p className="text-label text-faint">{label}</p>
      <p className="mt-1 font-mono text-data text-ink">
        {value}
        {delta != null && (
          <span className={`ml-1.5 text-label ${deltaClass(delta)}`}>
            {formatPct(delta)}
          </span>
        )}
      </p>
    </div>
  );
}

function ReadingRow({
  n,
  reading,
}: {
  n: string;
  reading: ReadingSet["direction"];
}) {
  const t = useTranslations("readings");
  const locale = useLocale();
  const isPt = locale === "pt";
  const sentence = isPt ? reading.sentencePt : reading.sentenceEn;
  const tone =
    reading.id === "risk"
      ? reading.value >= 70
        ? "text-storm"
        : reading.value >= 45
          ? "text-warn"
          : "text-up"
      : reading.band === "muito-positivo" || reading.band === "positivo"
        ? "text-up"
        : reading.band === "muito-negativo" || reading.band === "negativo"
          ? "text-down"
          : "text-ink";
  const isRisk = reading.id === "risk";
  const pos = isRisk ? reading.value : (reading.value + 100) / 2;

  return (
    <div className="border-b border-line py-4 last:border-0 first:pt-0 lg:first:pt-0">
      <p className="flex items-baseline justify-between gap-3">
        <span className="text-label text-faint">
          <span className="mr-2 font-mono text-accent tabular-nums">{n}</span>
          {t(`${reading.id}.label`)}
        </span>
        <span className={`font-display text-title tabular-nums ${tone}`}>
          {reading.confidence === 0
            ? "—"
            : isRisk
              ? reading.value
              : `${reading.value > 0 ? "+" : ""}${reading.value}`}
        </span>
      </p>
      {reading.confidence > 0 && (
        <div className="mt-2 h-px w-full bg-line" role="presentation">
          <div
            className={`h-px ${tone}`}
            style={{
              width: `${Math.max(2, Math.min(100, pos))}%`,
              backgroundColor: "currentColor",
            }}
          />
        </div>
      )}
      <p className="mt-2 text-meta leading-snug text-muted">{sentence}</p>
      {reading.confidence > 0 && reading.confidence < LOW_CONFIDENCE && (
        <p className="mt-1 text-meta text-warn">
          {t("partial", {
            missing: reading.gaps
              .map((g) => (isPt ? g.labelPt : g.labelEn))
              .join(", "),
          })}
        </p>
      )}
    </div>
  );
}
