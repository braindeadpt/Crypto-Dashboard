"use client";

import { DataAge } from "@/components/explain/DataAge";
import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { EtfDesk } from "@/components/desk/EtfDesk";
import { LiquidityDesk } from "@/components/liquidity/LiquidityDesk";
import { LiveLiquidations } from "@/components/board/LiveLiquidations";
import { OndeDoeu } from "@/components/board/OndeDoeu";
import { TermLabel } from "@/components/jargon/TermLabel";
import { TermTwin } from "@/components/jargon/TermTwin";
import type { EtfSnapshot } from "@/lib/data/etf";
import type { LiquiditySnapshot } from "@/lib/data/liquidity";
import type { SentimentSnapshot } from "@/lib/types";
import { useForceLiquidations } from "@/lib/hooks/useForceLiquidations";
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
  // Uma única janela de liquidações alimenta o scatter e a lista textual.
  const liq = useForceLiquidations();

  return (
    <div>
      <div className="obs-shell section-pad pt-6">
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
          <section className="obs-shell section-pad pb-12">
            <h2 className="font-display text-title text-ink">
              {t("leverageTitle")}{" "}
              <DataAge
                at={sentiment.updatedAt}
                className="align-middle text-meta font-normal"
              />
            </h2>
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
                {sentiment.fngHistory && sentiment.fngHistory.length > 1 && (
                  <FngSpark points={sentiment.fngHistory} />
                )}
              </div>
            </div>
            <div className="mt-4">
              <OndeDoeu data={liq} />
            </div>
            <div className="mt-4">
              <LiveLiquidations href={null} data={liq} />
            </div>
          </section>
        )}
      </ExpertiseGate>
    </div>
  );
}

/** 30-day Fear&Greed sparkline — zone bands + line + last point. */
function FngSpark({
  points,
}: {
  points: { value: number; timestamp: string }[];
}) {
  const W = 240;
  const H = 56;
  const min = Math.min(...points.map((p) => p.value));
  const max = Math.max(...points.map((p) => p.value));
  const span = Math.max(1, max - min);
  const x = (i: number) => (i / (points.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / span) * (H - 8) - 4;
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <div className="mt-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full text-accent"
        role="img"
        aria-label={`Fear&Greed 30d: ${min}–${max}`}
      >
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <circle
          cx={x(points.length - 1)}
          cy={y(last.value)}
          r="2.5"
          fill="currentColor"
        />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[0.6rem] text-faint">
        <span>30d</span>
        <span>
          {min}–{max}
        </span>
      </div>
    </div>
  );
}
