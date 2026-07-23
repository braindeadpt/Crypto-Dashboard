"use client";

import { useTranslations } from "next-intl";

export function Security() {
  const t = useTranslations("landing.security");

  const pillars = ["readonly", "sources", "estimates", "privacy"] as const;

  return (
    <section id="security" className="border-b border-line py-16 md:py-20">
      <div className="mx-auto grid max-w-7xl gap-10 section-pad lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <div>
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {pillars.map((id) => (
            <li key={id} className="border border-line bg-surface p-5">
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-accent">
                {t(`${id}.label`)}
              </p>
              <h3 className="mt-2 text-base font-semibold">{t(`${id}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {t(`${id}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
