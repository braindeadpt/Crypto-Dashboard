"use client";

import { getConcept } from "@/lib/content/atlas";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { notFound } from "next/navigation";

export function AtlasArticle({ slug }: { slug: string }) {
  const t = useTranslations("atlas");
  const locale = useLocale();
  const concept = getConcept(slug);
  if (!concept) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:px-6 enter">
      <Link href="/atlas" className="text-sm font-semibold text-accent">
        ← {t("title")}
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-faint">
        {t("level")}: {t(concept.level)}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        {locale === "pt" ? concept.titlePt : concept.titleEn}
      </h1>
      <p className="mt-3 text-lg text-muted">
        {locale === "pt" ? concept.summaryPt : concept.summaryEn}
      </p>
      <div className="card mt-8 p-6 leading-relaxed text-ink">
        {locale === "pt" ? concept.bodyPt : concept.bodyEn}
      </div>

      {concept.relatedSlugs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t("related")}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {concept.relatedSlugs.map((s) => (
              <li key={s}>
                <Link
                  href={`/atlas/${s}`}
                  className="chip hover:border-accent"
                >
                  {s}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
