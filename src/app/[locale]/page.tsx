import { LandingPage } from "@/components/landing/LandingPage";
import { getFrontPageData } from "@/lib/data/bundle";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  let data;
  try {
    data = await getFrontPageData();
  } catch {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-semibold">
          CLAREZA <span className="text-accent">Crypto</span>
        </h1>
        <p className="mt-3 text-muted">
          {locale === "pt"
            ? "Não foi possível obter dados de mercado. Tenta novamente em breve."
            : "Could not fetch market data. Please try again shortly."}
        </p>
      </div>
    );
  }

  return (
    <LandingPage
      market={data.market}
      sentiment={data.sentiment}
      regime={data.regime}
    />
  );
}
