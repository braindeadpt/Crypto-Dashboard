"use client";

import { AnimatedNumber } from "@/components/landing/AnimatedNumber";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { MarketSnapshot, RegimeResult, SentimentSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  market: MarketSnapshot;
  sentiment: SentimentSnapshot;
  regime: RegimeResult;
};

export function LiveStatsBar({ market, sentiment, regime }: Props) {
  const t = useTranslations("landing.stats");
  const locale = useLocale();

  const items = [
    {
      label: "BTC",
      value: formatUsd(market.btc.price),
      delta: market.btc.change24h,
      live: true,
    },
    {
      label: "ETH",
      value: formatUsd(market.eth.price),
      delta: market.eth.change24h,
    },
    {
      label: t("dominance"),
      value: `${market.global.btcDominance.toFixed(1)}%`,
    },
    {
      label: "F&G",
      value: String(sentiment.fearGreed.value),
      hint: sentiment.fearGreed.classification,
    },
    {
      label: t("posture"),
      value: t(regime.posture),
      posture: true as const,
      postureKey: regime.posture,
    },
    {
      label: t("stress"),
      valueNode: (
        <AnimatedNumber value={regime.score} suffix="/100" className="font-mono" />
      ),
    },
  ];

  return (
    <div className="border-y border-line bg-bg-elevated/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-stretch gap-0 overflow-x-auto section-pad">
        <div className="flex shrink-0 items-center gap-2 border-r border-line pr-4 py-2.5">
          <span className="live-dot" />
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-accent">
            {t("live")}
          </span>
        </div>
        {items.map((item) => (
          <div
            key={item.label}
            className="flex min-w-[7.5rem] shrink-0 flex-col justify-center border-r border-line px-4 py-2.5 last:border-r-0"
          >
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-faint">
              {item.label}
            </span>
            <span className="mt-0.5 flex items-baseline gap-2">
              {"valueNode" in item && item.valueNode ? (
                item.valueNode
              ) : (
                <span className="font-mono text-sm font-medium tabular-nums text-ink">
                  {item.value}
                </span>
              )}
              {"delta" in item && item.delta != null && (
                <span
                  className={`font-mono text-[0.7rem] tabular-nums ${deltaClass(item.delta)}`}
                >
                  {formatPct(item.delta)}
                </span>
              )}
            </span>
            {"hint" in item && item.hint && (
              <span className="font-mono text-[0.6rem] text-faint">{item.hint}</span>
            )}
            {"posture" in item && item.posture && (
              <span className={`chip mt-1 w-fit chip-${item.postureKey}`}>
                {locale === "pt" ? "SISTEMA" : "SYSTEM"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
