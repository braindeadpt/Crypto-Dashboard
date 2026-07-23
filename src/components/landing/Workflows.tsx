"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const WORKFLOWS = [
  { id: "orient", href: "/" as const },
  { id: "explain", href: "/mercado" as const },
  { id: "risk", href: "/sentimento" as const },
  { id: "learn", href: "/atlas" as const },
] as const;

export function Workflows() {
  const t = useTranslations("landing.workflows");

  return (
    <section id="workflows" className="border-b border-line py-16 md:py-20">
      <div className="mx-auto max-w-7xl section-pad">
        <div className="max-w-2xl">
          <p className="eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-3 text-muted">{t("subtitle")}</p>
        </div>

        <ol className="mt-10 grid gap-3 md:grid-cols-2">
          {WORKFLOWS.map((w, i) => (
            <li key={w.id}>
              <Link
                href={w.href === "/" ? "/brief" : w.href}
                className="flex h-full flex-col border border-line bg-surface p-5 transition hover:border-accent/35 hover:bg-surface-2"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-mono text-[0.7rem] text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
                    {t(`${w.id}.tag`)}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold tracking-tight">
                  {t(`${w.id}.title`)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {t(`${w.id}.body`)}
                </p>
                <span className="mt-4 font-mono text-[0.7rem] uppercase tracking-wider text-accent">
                  {t("open")} →
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
