import { MercadoDesk } from "@/components/desk/MercadoDesk";
import { fetchMarketSnapshot } from "@/lib/data/coingecko";
import { fetchMapLayers } from "@/lib/data/mapLayersServer";
import { getRegimeBundle } from "@/lib/data/bundle";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function MercadoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("market");

  const [market, layers, regimeBundle] = await Promise.all([
    fetchMarketSnapshot().catch(() => null),
    fetchMapLayers().catch(() => null),
    getRegimeBundle().catch(() => null),
  ]);

  if (!market) {
    return (
      <div className="mx-auto max-w-3xl section-pad py-16 text-center">
        <h1 className="font-display text-display">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("empty")}</p>
      </div>
    );
  }

  return (
    <MercadoDesk
      market={market}
      layers={layers}
      readings={regimeBundle?.readings ?? null}
      volRealizedPct={regimeBundle?.volRealizedPct ?? null}
    />
  );
}
