"use client";

import { AmbientField } from "@/components/ambient/AmbientField";
import { AnimatedNumber } from "@/components/board/AnimatedNumber";
import { Sparkline } from "@/components/board/Sparkline";
import type { ReadingSet } from "@/lib/reading";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

type Ticker = { px: number | undefined; chg: number | undefined; spark?: number[] };

/**
 * Nível 0 — o hero. A manchete do dia em display grande sobre um campo de
 * dados ambiental; o preço live entra no mesmo painel em vez de ser mais
 * uma caixa por baixo.
 */
export function HeroPanel({
  readings,
  date,
  btc,
  eth,
  sol,
  intensity = 0.5,
  vitals,
}: {
  readings: ReadingSet;
  date: string;
  btc: Ticker;
  eth: Ticker;
  sol: Ticker;
  /** Regime score 0..1 — o campo ambiental reage (calmo = esparso, tempestade = denso). */
  intensity?: number;
  /** Vitals globais — coluna direita do hero em desktop. */
  vitals?: {
    cap: number;
    capChg: number | null;
    vol: number;
    dom: number;
  };
}) {
  const t = useTranslations("readings");
  const locale = useLocale();
  const isPt = locale === "pt";

  return (
    <section className="lum-hero panel-hero relative overflow-hidden p-5 md:p-8">
      <AmbientField intensity={intensity} />
      <div className="relative">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-label text-faint">{t("todayEyebrow")}</p>
          <p className="text-label text-faint tabular-nums">{date}</p>
        </header>

        <div className="mt-4 flex items-start justify-between gap-8">
          <h1 className="max-w-[15ch] font-display text-display leading-[1.02] text-ink md:text-hero">
            {isPt ? readings.headlinePt : readings.headlineEn}
          </h1>
          {/* Vitals — o estado do mercado em três números, à direita */}
          {vitals && (
            <dl className="hidden shrink-0 gap-5 border-l border-line pl-6 lg:flex">
              {[
                [t("vitalsCap"), formatUsd(vitals.cap, true), vitals.capChg],
                [t("vitalsVol"), formatUsd(vitals.vol, true), null],
                [t("vitalsDom"), formatPct(vitals.dom, 1), null],
              ].map(([label, value, d]) => (
                <div key={label as string}>
                  <dt className="text-label text-faint">{label}</dt>
                  <dd className="mt-1 font-mono text-data text-ink">
                    {value}
                    {typeof d === "number" && (
                      <span className={`ml-1.5 text-label ${deltaClass(d)}`}>
                        {formatPct(d)}
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <p className="mt-4 max-w-xl text-body text-muted">
          <span className="text-label text-accent-2">{t("watch")}: </span>
          {isPt ? readings.watchPt : readings.watchEn}
        </p>

        {/* O preço live vive no hero — não é uma caixa separada. */}
        <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-t border-line pt-5">
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
                <span
                  className={`ml-3 text-data ${deltaClass(btc.chg)}`}
                >
                  {btc.chg >= 0 ? "▲" : "▼"} {formatPct(btc.chg)}
                </span>
              )}
            </p>
          </div>
          {/* 7 dias do BTC — a forma do preço no mesmo palco que o número */}
          {btc.spark && btc.spark.length > 1 && (
            <div className="min-w-[180px] flex-1 self-end">
              <p className="mb-1 text-label text-faint">{t("spark7d")}</p>
              <Sparkline
                points={btc.spark}
                up={(btc.chg ?? 0) >= 0}
                className="block w-full"
                height={56}
              />
            </div>
          )}
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-label text-faint">ETH</p>
              <p className={`text-data ${deltaClass(eth.chg ?? 0)}`}>
                {eth.px != null ? (
                  <>
                    <AnimatedNumber value={eth.px} format={formatUsd} />
                    {" · "}
                    {formatPct(eth.chg ?? 0)}
                  </>
                ) : (
                  "—"
                )}
              </p>
            </div>
            {sol.px != null && sol.chg != null && (
              <div>
                <p className="text-label text-faint">SOL</p>
                <p className={`text-data ${deltaClass(sol.chg)}`}>
                  <AnimatedNumber value={sol.px} format={formatUsd} />
                  {" · "}
                  {formatPct(sol.chg)}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
