import { LabDesk } from "@/components/desk/LabDesk";
import { getRegimeBundle } from "@/lib/data/bundle";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60;

export default async function LabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { regime, market, sentiment } = await getRegimeBundle();
  return <LabDesk regime={regime} market={market} sentiment={sentiment} />;
}
