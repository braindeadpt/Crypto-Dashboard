import { BriefDesk } from "@/components/desk/BriefDesk";
import { getRegimeBundle } from "@/lib/data/bundle";
import { buildDeterministicBrief } from "@/lib/editorial/brief";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 120;

export default async function BriefPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { market, regime, sentiment } = await getRegimeBundle();
  const brief = buildDeterministicBrief({ market, regime, sentiment });
  return <BriefDesk brief={brief} />;
}
