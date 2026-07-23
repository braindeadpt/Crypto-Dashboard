"use client";

import { PORTUGAL_CONTENT } from "@/lib/content/portugal";
import { useLocale, useTranslations } from "next-intl";

export function PortugalDesk() {
  const t = useTranslations("portugal");
  const locale = useLocale();
  const c = PORTUGAL_CONTENT;

  const sections = [
    { key: "mica" as const, data: c.mica },
    { key: "cmvm" as const, data: c.cmvm },
    { key: "custody" as const, data: c.custody },
    { key: "tax" as const, data: c.tax },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:px-6 enter">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-8 space-y-4">
        {sections.map((s) => (
          <section key={s.key} className="card p-5">
            <h2 className="text-xl font-semibold">{t(s.key)}</h2>
            <p className="mt-3 leading-relaxed text-muted">
              {locale === "pt" ? s.data.bodyPt : s.data.bodyEn}
            </p>
          </section>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("links")}
        </h2>
        <ul className="mt-4 space-y-2">
          {c.links.map((l) => (
            <li key={l.url}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:underline"
              >
                {locale === "pt" ? l.labelPt : l.labelEn}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
