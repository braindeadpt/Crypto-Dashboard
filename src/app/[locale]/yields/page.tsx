import { YieldsDesk } from "@/components/desk/YieldsDesk";
import { fetchTopYieldPools } from "@/lib/data/yields";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 180;

export default async function YieldsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await fetchTopYieldPools(50).catch(() => ({
    pools: [],
    updatedAt: "",
  }));
  return <YieldsDesk pools={data.pools} />;
}
