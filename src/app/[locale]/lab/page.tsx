import { LabDesk } from "@/components/desk/LabDesk";
import { getRegimeBundle } from "@/lib/data/bundle";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function LabPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const bundle = await getRegimeBundle().catch(() => null);
  if (!bundle) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Lab</h1>
        <p className="mt-3 text-muted">
          {locale === "pt"
            ? "Não foi possível obter dados de mercado. Tenta novamente em breve."
            : "Could not fetch market data. Please try again shortly."}
        </p>
      </div>
    );
  }

  return (
    <LabDesk
      regime={bundle.regime}
      market={bundle.market}
      sentiment={bundle.sentiment}
    />
  );
}
