import { SentimentDesk } from "@/components/desk/SentimentDesk";
import { fetchSentimentSnapshot } from "@/lib/data/sentiment";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function SentimentoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await fetchSentimentSnapshot().catch(() => null);
  if (!data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">
          {locale === "pt" ? "Sentimento" : "Sentiment"}
        </h1>
        <p className="mt-3 text-muted">
          {locale === "pt"
            ? "Dados de sentimento indisponíveis."
            : "Sentiment data unavailable."}
        </p>
      </div>
    );
  }
  return <SentimentDesk data={data} />;
}
