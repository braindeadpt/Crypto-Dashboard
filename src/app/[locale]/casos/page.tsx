import { MundoDesk } from "@/components/desk/MundoDesk";
import { getFrontPageData } from "@/lib/data/bundle";
import { fetchMarketSnapshot } from "@/lib/data/coingecko";
import { fetchSectorsSnapshot } from "@/lib/data/sectors";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function MundoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("mundo");

  const [sectors, market, front] = await Promise.all([
    fetchSectorsSnapshot(),
    fetchMarketSnapshot().catch(() => null),
    getFrontPageData().catch(() => null),
  ]);

  if (!sectors || !market) {
    return (
      <div className="mx-auto max-w-3xl section-pad py-16 text-center">
        <h1 className="font-display text-display">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("empty")}</p>
      </div>
    );
  }

  return (
    <MundoDesk
      sectors={sectors}
      market={market}
      cases={front?.cases ?? []}
    />
  );
}
