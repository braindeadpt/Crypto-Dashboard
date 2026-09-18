import { DailyRitualCard } from "@/components/ritual/DailyRitualCard";
import { JournalCard } from "@/components/desk/JournalCard";
import { getFrontPageData } from "@/lib/data/bundle";
import { redirect } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";

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

  const t = await getTranslations({ locale, namespace: "brief" });

  return (
    <div className="obs-shell section-pad pb-16 pt-6">
      <div className="mx-auto max-w-3xl">
        {/* Capa como folha: masthead brutal — manchete colossal, a data em
            mono, a regra do formato por baixo. O cartão é a folha. */}
        <header className="mb-6 border-b-2 border-ink pb-4">
          <p className="text-tag text-faint">{t("masthead")}</p>
          <h1 className="mt-2 font-display text-colossal uppercase leading-[0.9] tracking-tight text-ink">
            {t("title")}
          </h1>
          <p className="mt-3 flex flex-wrap items-baseline justify-between gap-2 font-mono text-meta tabular-nums text-faint">
            <span>{data.ritual.date}</span>
            <span>{t("format")}</span>
          </p>
        </header>
        <DailyRitualCard ritual={data.ritual} />
        <JournalCard />
      </div>
    </div>
  );
}
