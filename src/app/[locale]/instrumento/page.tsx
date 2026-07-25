import { InstrumentDesk } from "@/components/board/InstrumentDesk";
import { getFrontPageData } from "@/lib/data/bundle";
import { fetchTrendingCoins } from "@/lib/data/coingecko";
import { fetchDerivativesSnapshot } from "@/lib/data/derivatives";
import { fetchDexFrenzy } from "@/lib/data/dex";
import { fetchEtfSnapshot } from "@/lib/data/etf";
import { fetchMempoolFees } from "@/lib/data/mempool";
import { fetchTopYieldPools } from "@/lib/data/yields";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function InstrumentoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("instrumento");

  let data;
  try {
    data = await getFrontPageData();
  } catch {
    return (
      <div className="mx-auto max-w-3xl section-pad py-16 text-center">
        <h1 className="font-display text-display">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("empty")}</p>
      </div>
    );
  }

  const [yieldsBundle, derivs, trending, mempool, etf, dex] = await Promise.all([
    fetchTopYieldPools(30).catch(() => ({
      pools: [],
      updatedAt: "",
      stale: true,
      source: "error",
    })),
    fetchDerivativesSnapshot().catch(() => null),
    fetchTrendingCoins().catch(() => []),
    fetchMempoolFees().catch(() => null),
    fetchEtfSnapshot().catch(() => null),
    fetchDexFrenzy().catch(() => null),
  ]);

  return (
    <InstrumentDesk
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
