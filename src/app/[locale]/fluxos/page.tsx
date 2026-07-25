import { FluxosDesk } from "@/components/desk/FluxosDesk";
import { fetchEtfSnapshot } from "@/lib/data/etf";
import { fetchLiquiditySnapshot } from "@/lib/data/liquidity";
import { getFrontPageData } from "@/lib/data/bundle";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function FluxosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("fluxos");

  const [liquidity, etf, front] = await Promise.all([
    fetchLiquiditySnapshot(),
    fetchEtfSnapshot().catch(() => null),
    getFrontPageData().catch(() => null),
  ]);

  if (!liquidity) {
    return (
      <div className="mx-auto max-w-3xl section-pad py-16 text-center">
        <h1 className="font-display text-display">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("empty")}</p>
        <p className="mt-2 text-meta text-faint">{t("emptyHint")}</p>
      </div>
    );
  }

  return (
    <FluxosDesk
      liquidity={liquidity}
      etf={etf}
      sentiment={front?.sentiment ?? null}
    />
  );
}
