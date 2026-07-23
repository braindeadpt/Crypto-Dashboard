import { MarketDesk } from "@/components/desk/MarketDesk";
import { fetchMarketSnapshot } from "@/lib/data/coingecko";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60;

export default async function MercadoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const market = await fetchMarketSnapshot();
  return <MarketDesk market={market} />;
}
