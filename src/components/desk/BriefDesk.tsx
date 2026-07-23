"use client";

import type { BriefItem } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

export function BriefDesk({ brief }: { brief: BriefItem }) {
  const t = useTranslations("brief");
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:px-6 enter">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
        <p className="mt-2 text-xs text-faint">
          {t("generated")} · {new Date(brief.generatedAt).toLocaleString(locale)} ·{" "}
          {t("credibility")} {brief.credibilityTier}
        </p>
      </header>

      <article className="mt-8 space-y-4">
        <div className="card p-5">
          <Block label={t("fact")} body={brief.fact} lead />
        </div>
        <div className="card p-5">
          <Block
            label={t("why")}
            body={locale === "pt" ? brief.whyItMattersPt : brief.whyItMattersEn}
          />
        </div>
        <div className="card p-5">
          <Block label={t("uncertainty")} body={brief.uncertainty} />
        </div>
        <div className="card p-5">
          <Block label={t("watch")} body={brief.watchNext} />
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("sources")}
        </h2>
        <ul className="mt-3 space-y-2">
          {brief.sources.map((s) => (
            <li key={s.url}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-accent hover:underline"
              >
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Block({
  label,
  body,
  lead,
}: {
  label: string;
  body: string;
  lead?: boolean;
}) {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-wide text-faint">
        {label}
      </p>
      <p
        className={
          lead
            ? "mt-2 text-2xl font-semibold leading-snug text-ink"
            : "mt-2 leading-relaxed text-muted"
        }
      >
        {body}
      </p>
    </section>
  );
}
