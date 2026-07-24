import { ChartsDesk } from "@/components/desk/ChartsDesk";
import { setRequestLocale } from "next-intl/server";

export default async function GraficosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChartsDesk />;
}
