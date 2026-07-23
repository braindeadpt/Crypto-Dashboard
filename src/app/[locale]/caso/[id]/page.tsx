import { CaseDesk } from "@/components/desk/CaseDesk";
import { buildCaseFile, buildDailyCases } from "@/lib/cases/build";
import { getRegimeBundle } from "@/lib/data/bundle";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function CasoPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const { market, sentiment } = await getRegimeBundle();
  const movers = [...market.movers.gainers, ...market.movers.losers];
  const cases = buildDailyCases(movers, sentiment);

  const found =
    cases.find((c) => c.id === id) ||
    (() => {
      const m = movers.find(
        (x) => `case-${x.id}` === id || x.caseId === id || x.id === id,
      );
      return m ? buildCaseFile(m, sentiment) : null;
    })();

  if (!found) notFound();
  return <CaseDesk caseFile={found} />;
}
