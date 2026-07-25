import { DailyRitualCard } from "@/components/ritual/DailyRitualCard";
import { getFrontPageData } from "@/lib/data/bundle";
import { redirect } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 120;

/**
 * /brief — same daily ritual as Agora (bookmark-friendly).
 */
export default async function BriefPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const data = await getFrontPageData().catch(() => null);
  if (!data) {
    redirect({ href: "/", locale });
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-6">
      <DailyRitualCard ritual={data.ritual} />
    </div>
  );
}
