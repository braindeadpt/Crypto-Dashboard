import { EtfDesk } from "@/components/desk/EtfDesk";
import { fetchEtfSnapshot } from "@/lib/data/etf";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 1800;

export default async function EtfPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  try {
    const data = await fetchEtfSnapshot();
    return <EtfDesk data={data} />;
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">ETF</h1>
        <p className="mt-3 text-muted">
          {locale === "pt"
            ? "Não foi possível obter fluxos ETF (Farside). Tenta mais tarde."
            : "Could not fetch ETF flows (Farside). Try again later."}
        </p>
      </div>
    );
  }
}
