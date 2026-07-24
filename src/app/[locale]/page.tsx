import { OperatorBoard } from "@/components/board/OperatorBoard";
import { getFrontPageData } from "@/lib/data/bundle";
import { fetchTrendingCoins } from "@/lib/data/coingecko";
import { fetchDerivativesSnapshot } from "@/lib/data/derivatives";
import { fetchDexFrenzy } from "@/lib/data/dex";
import { fetchEtfSnapshot } from "@/lib/data/etf";
import { fetchMempoolFees } from "@/lib/data/mempool";
import { fetchTopYieldPools } from "@/lib/data/yields";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

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

  const [yieldsBundle, etf, derivs, dex, trending, mempool] = await Promise.all([
    fetchTopYieldPools(30).catch(() => ({ pools: [], updatedAt: "" })),
    fetchEtfSnapshot().catch(() => null),
    fetchDerivativesSnapshot().catch(() => null),
    fetchDexFrenzy().catch(() => null),
    fetchTrendingCoins().catch(() => []),
    fetchMempoolFees().catch(() => null),
  ]);

  return (
    <OperatorBoard
      market={data.market}
      sentiment={data.sentiment}
      regime={data.regime}
      defi={data.defi}
      yields={yieldsBundle.pools}
      etf={etf}
      derivs={derivs}
      dex={dex}
      trending={trending}
      mempool={mempool}
    />
  );
}
