import { SentimentDesk } from "@/components/desk/SentimentDesk";
import { fetchSentimentSnapshot } from "@/lib/data/sentiment";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 60;

export default async function SentimentoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const data = await fetchSentimentSnapshot();
  return <SentimentDesk data={data} />;
}
