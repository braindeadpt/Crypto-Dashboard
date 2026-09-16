import { CarteiraDesk } from "@/components/desk/CarteiraDesk";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function CarteiraPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <CarteiraDesk />;
}
