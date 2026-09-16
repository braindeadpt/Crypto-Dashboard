import { DailyRitualCard } from "@/components/ritual/DailyRitualCard";
import { JournalCard } from "@/components/desk/JournalCard";
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
    <div className="obs-shell section-pad pb-16 pt-6">
      <div className="mx-auto max-w-3xl">
        <DailyRitualCard ritual={data.ritual} />
        <JournalCard />
      </div>
    </div>
  );
}
