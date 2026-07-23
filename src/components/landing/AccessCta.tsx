"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function AccessCta() {
  const t = useTranslations("landing.access");

  const tiers = ["open", "pro", "desk"] as const;

  return (
    <section id="access" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl section-pad">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
        </div>

        <div className="mt-10 grid gap-3 lg:grid-cols-3">
          {tiers.map((id) => {
            const featured = id === "pro";
            return (
              <div
                key={id}
                className={`flex flex-col border p-6 ${
                  featured
                    ? "border-accent/40 bg-accent-dim/40 shadow-[0_0_40px_rgba(61,255,168,0.06)]"
                    : "border-line bg-surface"
                }`}
              >
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-faint">
                  {t(`${id}.label`)}
                </p>
                <h3 className="mt-2 text-xl font-semibold">{t(`${id}.name`)}</h3>
                <p className="mt-1 font-mono text-2xl font-medium text-accent">
                  {t(`${id}.price`)}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                  {t(`${id}.body`)}
                </p>
                <ul className="mt-4 space-y-2 font-mono text-[0.72rem] text-muted">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-accent">▸</span>
                      {t(`${id}.features.${i}`)}
                    </li>
                  ))}
                </ul>
                {id === "desk" ? (
                  <a
                    href="mailto:acesso@clareza.crypto?subject=CLAREZA%20Desk"
                    className="mt-6 inline-flex justify-center border border-line bg-bg px-4 py-2.5 text-sm font-semibold transition hover:border-accent/40 hover:text-accent"
                  >
                    {t(`${id}.cta`)}
                  </a>
                ) : (
                  <Link
                    href="/mercado"
                    className={`mt-6 inline-flex justify-center px-4 py-2.5 text-sm font-semibold transition ${
                      featured
                        ? "border border-accent/40 bg-accent text-bg hover:bg-accent/90"
                        : "border border-line bg-bg hover:border-accent/40 hover:text-accent"
                    }`}
                  >
                    {t(`${id}.cta`)}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
