"use client";

import { PostureBadge } from "@/components/front/PostureBadge";
import { useExpertise } from "@/components/providers/ExpertiseProvider";
import { useVisit } from "@/components/providers/VisitProvider";
import { Link } from "@/i18n/navigation";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type {
  BriefItem,
  CaseFile,
  CycleSnapshot,
  DefiSnapshot,
  MarketSnapshot,
  RegimeResult,
  SentimentSnapshot,
} from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

type Props = {
  regime: RegimeResult;
  market: MarketSnapshot;
  sentiment: SentimentSnapshot;
  cases: CaseFile[];
  brief: BriefItem;
  cycle: CycleSnapshot | null;
  defi: DefiSnapshot | null;
};

export function FrontPage({
  regime,
  market,
  sentiment,
  cases,
  brief,
  cycle,
  defi,
}: Props) {
  const t = useTranslations("front");
  const tPosture = useTranslations("postureExplain");
  const tShortcuts = useTranslations("front.shortcuts");
  const locale = useLocale();
  const { level } = useExpertise();
  const { recordVisit, deltaSentence } = useVisit();

  useEffect(() => {
    recordVisit({
      btcPrice: market.btc.price,
      btcChange: market.btc.change24h,
      posture: regime.posture,
      fng: sentiment.fearGreed.value,
      at: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headline = locale === "pt" ? regime.headlinePt : regime.headlineEn;
  const dont = locale === "pt" ? regime.dontPt : regime.dontEn;
  const why = locale === "pt" ? brief.whyItMattersPt : brief.whyItMattersEn;
  const delta = deltaSentence(locale, {
    btcPrice: market.btc.price,
    btcChange: market.btc.change24h,
    posture: regime.posture,
    fng: sentiment.fearGreed.value,
    at: new Date().toISOString(),
  });

  const shortcuts = [
    { href: "/mercado" as const, title: locale === "pt" ? "Mercado" : "Market", desc: tShortcuts("market") },
    { href: "/sentimento" as const, title: locale === "pt" ? "Sentimento" : "Sentiment", desc: tShortcuts("sentiment") },
    { href: "/ciclo" as const, title: locale === "pt" ? "Ciclo" : "Cycle", desc: tShortcuts("cycle") },
    { href: "/atlas" as const, title: locale === "pt" ? "Aprender" : "Learn", desc: tShortcuts("learn") },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 enter">
      {/* 1. HERO — BTC + estado */}
      <section className="card relative overflow-hidden p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="live-dot" />
            <span className="font-medium text-accent">{t("live")}</span>
            <span className="text-faint">·</span>
            <span>
              {t("updated")}{" "}
              {new Date(regime.updatedAt).toLocaleTimeString(locale, {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          <PostureBadge posture={regime.posture} label={t(regime.posture)} />
        </div>

        <p className="mt-8 text-sm font-medium text-faint">{t("btcLabel")}</p>
        <div className="mt-2 flex flex-wrap items-end gap-4">
          <p className="font-mono text-5xl font-semibold tracking-tight tabular-nums md:text-6xl">
            {formatUsd(market.btc.price)}
          </p>
          <p
            className={`mb-2 font-mono text-xl font-semibold tabular-nums ${deltaClass(market.btc.change24h)}`}
          >
            {formatPct(market.btc.change24h)}
            <span className="ml-1 text-sm font-medium text-faint">24h</span>
          </p>
        </div>

        <p className="mt-4 max-w-2xl text-sm text-muted">{tPosture(regime.posture)}</p>

        <div className="mt-6 grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
          <Mini
            label="ETH"
            value={formatUsd(market.eth.price)}
            change={market.eth.change24h}
          />
          <Mini
            label={locale === "pt" ? "Dominância" : "Dominance"}
            value={`${market.global.btcDominance.toFixed(1)}%`}
          />
          <Mini
            label="Fear & Greed"
            value={String(sentiment.fearGreed.value)}
            hint={sentiment.fearGreed.classification}
          />
        </div>
      </section>

      {/* 2. O que mudou + resumo */}
      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t("delta")}
          </p>
          <p className="mt-2 text-[1.05rem] leading-snug text-ink">{delta}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t("headline")}
          </p>
          <p className="mt-2 text-[1.05rem] font-medium leading-snug text-ink">
            {headline}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">{why}</p>
          <Link
            href="/brief"
            className="mt-4 inline-flex text-sm font-semibold text-accent hover:underline"
          >
            {t("openBrief")} →
          </Link>
        </div>
      </section>

      {/* 3. Atalhos claros */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-ink">{t("explore")}</h2>
        <p className="mt-1 text-sm text-muted">{t("whatMatters")}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {shortcuts.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="card group p-4 transition hover:border-accent/40 hover:bg-surface-2"
            >
              <p className="font-semibold text-ink group-hover:text-accent">
                {s.title}
              </p>
              <p className="mt-1 text-sm text-muted">{s.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Ciclo + indicadores (pro) */}
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        {cycle && (
          <div className="card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">
              {t("cyclePosition")}
            </p>
            <p className="mt-2 text-xl font-semibold">
              {locale === "pt" ? cycle.phaseLabelPt : cycle.phaseLabelEn}
            </p>
            <p className="mt-1 font-mono text-sm text-muted">
              {cycle.halving.daysLeft} {t("daysToHalving")}
            </p>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-bg">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${Math.max(4, cycle.cycleProgressPct)}%` }}
              />
            </div>
            <Link
              href="/ciclo"
              className="mt-4 inline-flex text-sm font-semibold text-accent"
            >
              {t("seeCycle")} →
            </Link>
          </div>
        )}

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t("receipts")}
          </p>
          <ul className="mt-3 space-y-2.5">
            {regime.receipts.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 text-sm">
                <span className="text-muted">
                  {locale === "pt" ? r.label : r.labelEn}
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {r.value}
                </span>
              </li>
            ))}
          </ul>
          {(level === "operator" || level === "analyst") && (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <p className="text-faint">Funding</p>
                <p className="font-mono">
                  {(sentiment.funding.rate * 100).toFixed(4)}%
                </p>
              </div>
              {defi && (
                <div>
                  <p className="text-faint">TVL</p>
                  <p className="font-mono">{formatUsd(defi.totalTvl, true)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 5. Aprende + Atenção */}
      <section className="mt-4 grid gap-4 md:grid-cols-2">
        <Link
          href={`/atlas/${regime.lessonSlug}`}
          className="card group p-5 transition hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t("lesson")}
          </p>
          <p className="mt-2 text-xl font-semibold capitalize group-hover:text-accent">
            {regime.lessonSlug.replace(/-/g, " ")}
          </p>
          <p className="mt-1 text-sm text-muted">{t("lessonHint")}</p>
        </Link>
        <div className="card border-storm/30 bg-storm/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-storm">
            {t("dont")}
          </p>
          <p className="mt-2 text-lg font-medium leading-snug text-ink">{dont}</p>
        </div>
      </section>

      {/* 6. Casos */}
      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-faint">
              {t("causeEffect")}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{t("casesTitle")}</h2>
          </div>
          <Link href="/mercado" className="text-sm font-semibold text-accent">
            {t("seeMarket")} →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {cases.map((c) => (
            <Link
              key={c.id}
              href={`/caso/${c.id}`}
              className="card group p-4 transition hover:border-accent/40 hover:bg-surface-2"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-lg font-semibold group-hover:text-accent">
                  {c.symbol}
                </span>
                <span
                  className={`font-mono text-sm font-semibold tabular-nums ${deltaClass(c.change24h)}`}
                >
                  {formatPct(c.change24h)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-muted">
                {locale === "pt" ? c.observationPt : c.observationEn}
              </p>
              <span className="mt-3 inline-block text-xs font-semibold text-accent">
                {t("openCase")} →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Mini({
  label,
  value,
  change,
  hint,
}: {
  label: string;
  value: string;
  change?: number;
  hint?: string;
}) {
  return (
    <div>
      <p className="text-xs text-faint">{label}</p>
      <p className="mt-0.5 font-mono text-base font-medium tabular-nums">{value}</p>
      {change != null && (
        <p className={`font-mono text-xs tabular-nums ${deltaClass(change)}`}>
          {formatPct(change)}
        </p>
      )}
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}
