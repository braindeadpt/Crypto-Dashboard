import { Link } from "@/i18n/navigation";
import { getFrontPageData } from "@/lib/data/bundle";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function CasoIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("case");

  let cases: Awaited<ReturnType<typeof getFrontPageData>>["cases"] = [];
  try {
    const data = await getFrontPageData();
    cases = data.cases;
  } catch {
    cases = [];
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:px-6 enter">
      <p className="text-label text-faint">{t("title")}</p>
      <h1 className="mt-2 text-title text-ink">{t("indexTitle")}</h1>
      <p className="mt-2 max-w-xl text-body text-muted">{t("indexSubtitle")}</p>
      <p className="mt-2 text-meta text-faint">{t("correlationNote")}</p>

      {cases.length === 0 ? (
        <p className="mt-10 text-muted">{t("empty")}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {cases.map((c) => (
            <li key={c.id}>
              <Link
                href={`/caso/${c.id}`}
                className="panel-secondary flex items-center justify-between gap-4 p-4 transition hover:border-accent/40"
              >
                <div>
                  <p className="text-title">{c.symbol}</p>
                  <p className="mt-1 text-meta text-muted">
                    {locale === "pt"
                      ? c.unclear
                        ? t("unclear")
                        : c.hypotheses[0]?.labelPt
                      : c.unclear
                        ? t("unclear")
                        : c.hypotheses[0]?.labelEn}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-data ${deltaClass(c.change24h)}`}>
                    {c.change24h >= 0 ? "▲" : "▼"} {formatPct(c.change24h)}
                  </p>
                  <p className="text-meta text-faint">{formatUsd(c.price)}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
