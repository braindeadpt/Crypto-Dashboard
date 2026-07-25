import { OperatorBoard } from "@/components/board/OperatorBoard";
import { getFrontPageData } from "@/lib/data/bundle";
import { setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import BoardLoading from "./loading";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <Suspense fallback={<BoardLoading />}>
      <HomeBoard locale={locale} />
    </Suspense>
  );
}

async function HomeBoard({ locale }: { locale: string }) {
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
    <OperatorBoard
      market={data.market}
      regime={data.regime}
      ritual={data.ritual}
      readings={data.readings}
    />
  );
}
