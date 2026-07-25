"use client";

import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { EtfDesk } from "@/components/desk/EtfDesk";
import { LiquidityDesk } from "@/components/liquidity/LiquidityDesk";
import { LiveLiquidations } from "@/components/board/LiveLiquidations";
import { TermLabel } from "@/components/jargon/TermLabel";
import { TermTwin } from "@/components/jargon/TermTwin";
import type { EtfSnapshot } from "@/lib/data/etf";
import type { LiquiditySnapshot } from "@/lib/data/liquidity";
import type { SentimentSnapshot } from "@/lib/types";
import { formatUsd } from "@/lib/format";
import { useTranslations } from "next-intl";

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
                <TermLabel term="funding" />
                <TermTwin
                  className="mt-2"
                  term="funding"
                  fundingRate={sentiment.funding.rate}
                  value={`${(sentiment.funding.rate * 100).toFixed(4)}%`}
                />
              </div>
              <div className="border border-line bg-surface p-4">
                <TermLabel term="openInterest" />
                <TermTwin
                  className="mt-2"
                  term="openInterest"
                  lineValue={formatUsd(sentiment.openInterest.value, true)}
                  value={formatUsd(sentiment.openInterest.value, true)}
                />
              </div>
              <div className="border border-line bg-surface p-4">
                <TermLabel term="fearGreed" />
                <TermTwin
                  className="mt-2"
                  term="fearGreed"
                  lineValue={String(sentiment.fearGreed.value)}
                  value={String(sentiment.fearGreed.value)}
                />
                <p className="mt-1 text-meta text-muted">
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
