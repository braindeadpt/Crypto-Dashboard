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
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">DeFi</h1>
        <p className="mt-3 text-muted">
          {locale === "pt"
            ? "Dados DeFi indisponíveis. Corre npm run snapshots:refresh ou tenta mais tarde."
            : "DeFi data unavailable. Run npm run snapshots:refresh or try again later."}
        </p>
      </div>
    );
  }
  return <DefiDesk data={data} />;
}
