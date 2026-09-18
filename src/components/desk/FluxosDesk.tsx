"use client";

import { DataAge } from "@/components/explain/DataAge";
import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { Balanca } from "@/components/fluxos/Balanca";
import { CaudalRiver } from "@/components/fluxos/CaudalRiver";
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

  // Caudal combinado dos ETF spot (BTC+ETH+SOL por dia) — série real Farside.
  const etfCombined: { t: string; v: number }[] = (() => {
    if (!etf) return [];
    const byDay = new Map<string, number>();
    for (const asset of [etf.btc, etf.eth, etf.sol]) {
      for (const d of asset?.history ?? []) {
        byDay.set(d.date, (byDay.get(d.date) ?? 0) + d.totalUsdM);
      }
    }
    return [...byDay.entries()]
      .map(([t, v]) => ({ t, v }))
      .sort((a, b) => a.t.localeCompare(b.t));
  })();

  // Balança: Δ de OI em USD reais (oiUsd × Δ% declarado) contra o fluxo ETF.
  const oiDeltaUsd =
    liquidity.leverage.oiUsd != null && liquidity.leverage.oiChange24hPct != null
      ? liquidity.leverage.oiUsd * (liquidity.leverage.oiChange24hPct / 100)
      : null;

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

      {/* O CAUDAL — o dinheiro como rio: ETF spot e stables, partículas
          no sentido real do sinal. A peça mais literal do conceito. */}
      <section className="obs-shell section-pad pb-8">
        <h2 className="font-display text-title text-ink">{t("caudalTitle")}</h2>
        <p className="mt-1 text-meta text-muted">{t("caudalHint")}</p>
        <div className="mt-4 border border-line bg-surface p-3">
          <CaudalRiver
            etfFlows={etfCombined}
            stableSupply={liquidity.stables.series}
            updatedAt={etf?.updatedAt ?? liquidity.ingestedAt}
          />
        </div>
      </section>

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
            {/* A Balança — spot institucional contra alavancagem, o prato
                inclina para o lado que pesa mais hoje (dólares reais). */}
            <div className="mt-3 border border-line bg-surface p-4">
              <h3 className="text-label text-faint">{t("balanceTitle")}</h3>
              <div className="mt-2">
                <Balanca
                  spotUsdM={liquidity.spot.etfCombined1dUsdM}
                  oiDeltaUsd={oiDeltaUsd}
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
