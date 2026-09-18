import { OperatorBoard } from "@/components/board/OperatorBoard";
import { OnboardingHint } from "@/components/layout/OnboardingHint";
import { getFrontPageData } from "@/lib/data/bundle";
import { getCorrentes } from "@/lib/history/correntes";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import BoardLoading from "./loading";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<BoardLoading />}>
      <HomeBoard locale={locale} />
    </Suspense>
  );
}

async function HomeBoard({ locale }: { locale: string }) {
  let data;
  let correntes;
  try {
    [data, correntes] = await Promise.all([
      getFrontPageData(),
      getCorrentes().catch(() => null),
    ]);
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-display">
          CLAREZA <span className="text-accent">Crypto</span>
        </h1>
        <p className="mt-3 text-muted">
          {locale === "pt"
            ? "Não foi possível obter dados de mercado. Tenta novamente em breve."
            : "Could not fetch market data. Please try again shortly."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="section-pad pt-4">
        <OnboardingHint />
      </div>
      <OperatorBoard
        market={data.market}
        regime={data.regime}
        ritual={data.ritual}
        readings={data.readings}
        asOf={data.asOf}
        regimeHistory={data.regimeHistory}
        mapLayers={data.mapLayers}
        correntes={correntes}
        volRealizedPct={data.volRealizedPct}
        visitVitals={{
          seenAt: new Date().toISOString(),
          posture: data.regime.posture,
          score: data.regime.score,
          btcChange24h: data.market.btc.change24h,
          breadthPct: data.caseContext.breadthPct,
          fearGreed: data.sentiment.fearGreed.value,
          fundingBps: data.sentiment.funding.rate * 10000,
          dominance: data.market.global.btcDominance,
          etfUsdM: data.caseContext.etfCombinedUsdM,
        }}
      />
    </>
  );
}
