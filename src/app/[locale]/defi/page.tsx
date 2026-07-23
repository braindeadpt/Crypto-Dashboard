import { DefiDesk } from "@/components/desk/DefiDesk";
import { fetchDefiSnapshot } from "@/lib/data/defillama";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 120;

export default async function DefiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await fetchDefiSnapshot();
  return <DefiDesk data={data} />;
}
