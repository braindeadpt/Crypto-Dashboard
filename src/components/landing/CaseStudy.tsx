"use client";

import { AnimatedNumber } from "@/components/landing/AnimatedNumber";
import { useTranslations } from "next-intl";

export function CaseStudy() {
  const t = useTranslations("landing.case");

  const metrics = [
    { key: "tabs", value: 7, suffix: "→1" },
    { key: "time", value: 12, suffix: " min" },
    { key: "clarity", value: 94, suffix: "%" },
  ] as const;

  return (
    <section id="case" className="border-b border-line py-16 md:py-20">
      <div className="mx-auto max-w-7xl section-pad">
        <div className="border border-line bg-surface">
          <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-line p-6 md:p-8 lg:border-b-0 lg:border-r">
              <p className="eyebrow">{t("eyebrow")}</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                {t("title")}
              </h2>
              <p className="mt-4 max-w-xl text-muted leading-relaxed">
                {t("body")}
              </p>
              <blockquote className="mt-6 border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink">
                “{t("quote")}”
                <footer className="mt-2 font-mono text-[0.7rem] uppercase tracking-wider text-faint">
                  {t("attribution")}
                </footer>
              </blockquote>
            </div>

            <div className="grid grid-rows-3 divide-y divide-line">
              {metrics.map((m) => (
                <div key={m.key} className="flex flex-col justify-center p-6">
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-faint">
                    {t(`metrics.${m.key}.label`)}
                  </p>
                  <p className="mt-2 font-mono text-3xl font-medium text-accent">
                    {m.suffix === "→1" ? (
                      <>
                        <AnimatedNumber value={m.value} />
                        <span className="text-ink">→1</span>
                      </>
                    ) : (
                      <AnimatedNumber
                        value={m.value}
                        suffix={m.suffix}
                      />
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {t(`metrics.${m.key}.hint`)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
