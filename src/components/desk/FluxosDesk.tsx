"use client";

import { DataAge } from "@/components/explain/DataAge";
import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { EtfDesk } from "@/components/desk/EtfDesk";
import { LiquidityDesk } from "@/components/liquidity/LiquidityDesk";
import { LiveLiquidations } from "@/components/board/LiveLiquidations";
import { Multidao } from "@/components/desk/Multidao";
import { OndeDoeu } from "@/components/board/OndeDoeu";
import { TermLabel } from "@/components/jargon/TermLabel";
import { TermTwin } from "@/components/jargon/TermTwin";
import type { EtfSnapshot } from "@/lib/data/etf";
import type { LiquiditySnapshot } from "@/lib/data/liquidity";
import type { MultidaoData } from "@/lib/history/multidao";
import type { ReadingSet } from "@/lib/reading";
import type { SentimentSnapshot } from "@/lib/types";
import { useForceLiquidations } from "@/lib/hooks/useForceLiquidations";
import { MotionProvider } from "@/lib/motion/useMotion";
import { formatUsd } from "@/lib/format";
import { useTranslations } from "next-intl";

type Props = {
  liquidity: LiquiditySnapshot;
  etf: EtfSnapshot | null;
  sentiment: SentimentSnapshot | null;
  /** Rasto multidão (histórico) + marcador de hoje + leituras do Maestro. */
  multidao: MultidaoData | null;
  crowdToday: { ratio: number | null; chgPct: number | null } | null;
  readings: ReadingSet | null;
  volRealizedPct: number | null;
};

/**
 * FLUXOS — where money comes from: stables, ETF spot, leverage.
 */
export function FluxosDesk({
  liquidity,
  etf,
  sentiment,
  multidao,
  crowdToday,
  readings,
  volRealizedPct,
}: Props) {
  const t = useTranslations("fluxos");
  // Uma única janela de liquidações alimenta o scatter e a lista textual.
  const liq = useForceLiquidations();

  return (
    // A página inteira herda o Maestro — caudal, multidão e qualquer
    // movimento leem a mesma cadência. Sem leituras → repouso honesto.
    <MotionProvider readings={readings} realizedVolPct={volRealizedPct}>
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
            <div className="mt-4 grid gap-3 md:grid-cols-2">
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
            </div>
            {/* A Multidão substitui o velocímetro de F&G — o que interessa é
                o desacordo entre posicionamento e preço, não um número que
                toda a gente já viu. */}
            <div className="mt-3">
              <Multidao data={multidao} today={crowdToday} />
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
    </MotionProvider>
  );
}
