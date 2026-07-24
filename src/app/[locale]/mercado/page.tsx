import { MarketDesk } from "@/components/desk/MarketDesk";
import { fetchMarketSnapshot } from "@/lib/data/coingecko";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function MercadoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const market = await fetchMarketSnapshot().catch(() => null);
  if (!market) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          {locale === "pt" ? "Mercado" : "Market"}
        </h1>
        <p className="mt-3 text-muted">
          {locale === "pt"
            ? "Não foi possível obter dados de mercado."
            : "Could not fetch market data."}
        </p>
      </div>
    );
  }
  return <MarketDesk market={market} />;
}
