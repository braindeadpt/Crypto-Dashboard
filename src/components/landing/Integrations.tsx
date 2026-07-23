"use client";

import { useTranslations } from "next-intl";

const SOURCES = [
  { id: "coingecko", status: "ok" as const },
  { id: "binance", status: "ok" as const },
  { id: "defillama", status: "ok" as const },
  { id: "altme", status: "ok" as const },
  { id: "editorial", status: "ok" as const },
];

export function Integrations() {
  const t = useTranslations("landing.integrations");

  return (
    <section id="integrations" className="border-b border-line py-16 md:py-20">
      <div className="mx-auto max-w-7xl section-pad">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
        </div>

        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SOURCES.map((s) => (
            <li
              key={s.id}
              className="group border border-line bg-surface p-4 transition hover:border-accent/30 hover:bg-surface-2"
            >
              <div className="flex items-center justify-between">
                <span className="live-dot" />
                <span className="font-mono text-[0.6rem] uppercase tracking-wider text-accent">
                  {t("online")}
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold">{t(`${s.id}.name`)}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {t(`${s.id}.role`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
