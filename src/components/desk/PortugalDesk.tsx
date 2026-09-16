"use client";

import { PORTUGAL_CONTENT } from "@/lib/content/portugal";
import { useLocale, useTranslations } from "next-intl";

export function PortugalDesk() {
  const t = useTranslations("portugal");
  const locale = useLocale();
  const c = PORTUGAL_CONTENT;
  const pt = locale === "pt";

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:px-6 enter">
      <header>
        <h2 className="text-display">
          {t("title")}
        </h2>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
        <p className="mt-3 border border-line bg-surface p-3 text-meta text-muted">
          {pt ? c.disclaimerPt : c.disclaimerEn}
        </p>
        <p className="mt-2 font-mono text-xs text-faint">
          {t("reviewedAt", { date: c.reviewedAt })}
        </p>
      </header>

      <section className="mt-6 border border-accent/40 bg-accent-dim p-5">
        <h3 className="text-label text-accent">
          {t("sixtyTitle")}
        </h3>
        <ul className="mt-3 space-y-2">
          {(pt ? c.sixtySecondsPt : c.sixtySecondsEn).map((line) => (
            <li key={line} className="flex gap-2 text-sm text-ink">
              <span className="mt-0.5 shrink-0 font-mono text-accent">✓</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 space-y-6">
        {c.sections.map((s) => (
          <section key={s.id} className="border border-line bg-surface p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-title">{t(s.id)}</h3>
              <p className="font-mono text-xs text-faint">
                {t("asOf", { date: s.asOf })}
              </p>
            </div>
            <p className="mt-1 text-label text-faint">
              {t("orientationBadge")}
            </p>
            <p className="mt-3 leading-relaxed text-muted">
              {pt ? s.bodyPt : s.bodyEn}
            </p>

            <h4 className="mt-5 text-label text-faint">
              {t("howTo")}
            </h4>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-muted">
              {(pt ? s.howToPt : s.howToEn).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            {s.examples.length > 0 && (
              <>
                <h4 className="mt-5 text-label text-faint">
                  {t("examples")}
                </h4>
                <ul className="mt-2 space-y-3">
                  {s.examples.map((ex) => (
                    <li
                      key={ex.titleEn}
                      className="border border-line bg-bg p-3 text-sm"
                    >
                      <p className="font-medium text-ink">
                        {pt ? ex.titlePt : ex.titleEn}
                      </p>
                      <p className="mt-1 text-muted">
                        {pt ? ex.bodyPt : ex.bodyEn}
                      </p>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {(s.uncertaintyPt || s.uncertaintyEn) && (
              <p className="mt-4 border-l-2 border-accent/40 pl-3 text-sm text-muted">
                <span className="font-semibold text-ink">{t("uncertainty")}: </span>
                {pt ? s.uncertaintyPt : s.uncertaintyEn}
              </p>
            )}

            <h4 className="mt-5 text-label text-faint">
              {t("sources")}
            </h4>
            <ul className="mt-2 space-y-1">
              {s.sources.map((src) => (
                <li key={src.url + src.labelEn}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-accent hover:underline"
                  >
                    {pt ? src.labelPt : src.labelEn}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <section className="mt-8">
        <h3 className="text-label text-faint">
          {t("faq")}
        </h3>
        <div className="mt-3 space-y-2">
          {c.faq.map((f) => (
            <details
              key={f.qEn}
              className="group border border-line bg-surface px-4 py-3 open:border-accent/50"
            >
              <summary className="cursor-pointer list-none text-sm font-medium text-ink transition group-open:text-accent">
                {pt ? f.qPt : f.qEn}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {pt ? f.aPt : f.aEn}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-label text-faint">
          {t("links")}
        </h3>
        <ul className="mt-4 space-y-2">
          {c.links.map((l) => (
            <li key={l.url}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:underline"
              >
                {pt ? l.labelPt : l.labelEn}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
