import { CycleDesk } from "@/components/desk/CycleDesk";
import { fetchCycleSnapshot } from "@/lib/data/cycle";
import { setRequestLocale } from "next-intl/server";

export const revalidate = 300;

export default async function CicloPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const cycle = await fetchCycleSnapshot();
  return <CycleDesk cycle={cycle} />;
}
