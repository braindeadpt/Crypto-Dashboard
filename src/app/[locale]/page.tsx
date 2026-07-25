import { OperatorBoard } from "@/components/board/OperatorBoard";
import { getFrontPageData } from "@/lib/data/bundle";
import { fetchTrendingCoins } from "@/lib/data/coingecko";
import { fetchDerivativesSnapshot } from "@/lib/data/derivatives";
import { fetchDexFrenzy } from "@/lib/data/dex";
import { fetchEtfSnapshot } from "@/lib/data/etf";
import { fetchMempoolFees } from "@/lib/data/mempool";
import { fetchTopYieldPools } from "@/lib/data/yields";
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
  try {
    data = await getFrontPageData();
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">
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

  // Yields/DeFi read slim snapshots (no 11MB payloads). ETF/DEX stream in a nested boundary.
  const [yieldsBundle, derivs, trending, mempool] = await Promise.all([
    fetchTopYieldPools(30).catch(() => ({
      pools: [],
      updatedAt: "",
      stale: true,
      source: "error",
    })),
    fetchDerivativesSnapshot().catch(() => null),
    fetchTrendingCoins().catch(() => []),
    fetchMempoolFees().catch(() => null),
  ]);

  return (
    <>
      <OperatorBoard
        market={data.market}
        sentiment={data.sentiment}
        regime={data.regime}
        ritual={data.ritual}
        defi={data.defi}
        yields={yieldsBundle.pools}
        etf={null}
        derivs={derivs}
        dex={null}
        trending={trending}
        mempool={mempool}
      />
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-[1400px] section-pad">
            <div className="h-24 animate-pulse border border-line bg-surface" />
          </div>
        }
      >
        <SlowMarketExtras />
      </Suspense>
    </>
  );
}

async function SlowMarketExtras() {
  const [etf, dex] = await Promise.all([
    fetchEtfSnapshot().catch(() => null),
    fetchDexFrenzy().catch(() => null),
  ]);
  const { BoardSlowExtras } = await import("@/components/board/BoardSlowExtras");
  return <BoardSlowExtras etf={etf} dex={dex} />;
}
