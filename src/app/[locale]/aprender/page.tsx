import { ContextoDesk } from "@/components/desk/ContextoDesk";
import { fetchCycleSnapshot } from "@/lib/data/cycle";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 120;

export default async function ContextoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cycle = await fetchCycleSnapshot().catch(() => null);
  return <ContextoDesk cycle={cycle} />;
}
