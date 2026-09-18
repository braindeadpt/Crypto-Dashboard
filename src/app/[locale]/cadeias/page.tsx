import { CadeiasDesk } from "@/components/desk/CadeiasDesk";
import { fetchDefiSnapshot } from "@/lib/data/defillama";
import { getRegimeBundle } from "@/lib/data/bundle";
import { MotionProvider } from "@/lib/motion/useMotion";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function CadeiasPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("cadeias");

  const [defi, regimeBundle] = await Promise.all([
    fetchDefiSnapshot().catch(() => null),
    getRegimeBundle().catch(() => null),
  ]);

  if (!defi || !defi.chains.length) {
    return (
      <div className="mx-auto max-w-3xl section-pad py-16 text-center">
        <h1 className="font-display text-display">{t("title")}</h1>
        <p className="mt-3 text-muted">{t("empty")}</p>
      </div>
    );
  }

  return (
    <MotionProvider
      readings={regimeBundle?.readings ?? null}
      realizedVolPct={regimeBundle?.volRealizedPct ?? null}
    >
      <CadeiasDesk defi={defi} />
    </MotionProvider>
  );
}
