"use client";

import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { EtfDesk } from "@/components/desk/EtfDesk";
import { LiquidityDesk } from "@/components/liquidity/LiquidityDesk";
import { LiveLiquidations } from "@/components/board/LiveLiquidations";
import type { EtfSnapshot } from "@/lib/data/etf";
import type { LiquiditySnapshot } from "@/lib/data/liquidity";
import type { SentimentSnapshot } from "@/lib/types";
import { formatUsd } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  liquidity: LiquiditySnapshot;
  etf: EtfSnapshot | null;
  sentiment: SentimentSnapshot | null;
};

/**
 * FLUXOS — where money comes from: stables, ETF spot, leverage.
 */
export function FluxosDesk({ liquidity, etf, sentiment }: Props) {
  const t = useTranslations("fluxos");
  const locale = useLocale();

  return (
    <div>
      <div className="mx-auto w-full max-w-[1400px] section-pad pt-6">
        <header className="max-w-3xl">
          <p className="text-label text-faint">{t("eyebrow")}</p>
          <h1 className="mt-1 font-display text-display text-ink">{t("title")}</h1>
          <ExpertiseGate section="readings">
            <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
          </ExpertiseGate>
        </header>
      </div>

      <LiquidityDesk initial={liquidity} embedded />

      {etf && (
        <div className="border-t border-line">
          <EtfDesk data={etf} embedded />
        </div>
      )}

      <ExpertiseGate section="derivsTable">
        {sentiment && (
          <section className="mx-auto w-full max-w-[1400px] section-pad pb-12">
            <h2 className="font-display text-title text-ink">{t("leverageTitle")}</h2>
            <ExpertiseGate section="readings">
              <p className="mt-1 text-meta text-muted">{t("leverageHint")}</p>
            </ExpertiseGate>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="border border-line bg-surface p-4">
                <p className="text-label text-faint">Funding BTC</p>
                <p className="mt-1 text-data font-medium">
                  {(sentiment.funding.rate * 100).toFixed(4)}%
                </p>
                <ExpertiseGate section="explanations">
                  <p className="mt-2 text-meta text-muted">
                    {locale === "pt"
                      ? "Positivo = longs pagam shorts."
                      : "Positive = longs pay shorts."}
                  </p>
                </ExpertiseGate>
              </div>
              <div className="border border-line bg-surface p-4">
                <p className="text-label text-faint">Open interest</p>
                <p className="mt-1 text-data font-medium">
                  {formatUsd(sentiment.openInterest.value, true)}
                </p>
              </div>
              <div className="border border-line bg-surface p-4">
                <p className="text-label text-faint">Fear & Greed</p>
                <p className="mt-1 text-data font-medium">
                  {sentiment.fearGreed.value}
                </p>
                <p className="text-meta text-muted">
                  {sentiment.fearGreed.classification}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <LiveLiquidations href={null} />
            </div>
          </section>
        )}
      </ExpertiseGate>
    </div>
  );
}
