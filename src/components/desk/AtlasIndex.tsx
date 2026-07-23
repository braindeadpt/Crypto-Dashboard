"use client";

import { ATLAS } from "@/lib/content/atlas";
import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export function AtlasIndex() {
  const t = useTranslations("atlas");
  const locale = useLocale();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return ATLAS;
    return ATLAS.filter((c) => {
      const hay =
        `${c.slug} ${c.titlePt} ${c.titleEn} ${c.summaryPt} ${c.summaryEn}`.toLowerCase();
      return hay.includes(query);
    });
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 enter">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          className="mt-6 w-full max-w-md rounded-xl border border-line bg-surface px-4 py-2.5 text-sm outline-none placeholder:text-faint focus:border-accent"
        />
      </header>

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/atlas/${c.slug}`}
              className="card block h-full p-4 transition hover:border-accent/40 hover:bg-surface-2"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                {t(c.level)}
              </p>
              <h2 className="mt-1 text-lg font-semibold">
                {locale === "pt" ? c.titlePt : c.titleEn}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm text-muted">
                {locale === "pt" ? c.summaryPt : c.summaryEn}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
