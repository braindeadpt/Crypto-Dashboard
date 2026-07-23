"use client";

import { BITCOIN_TIMELINE } from "@/lib/content/timeline";
import { formatPct } from "@/lib/format";
import type { CycleSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

export function CycleDesk({ cycle }: { cycle: CycleSnapshot }) {
  const t = useTranslations("cycle");
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 enter">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </header>

      <section className="card mt-8 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("storyline")}
        </p>
        <h2 className="mt-2 text-3xl font-semibold md:text-4xl">
          {locale === "pt" ? cycle.phaseLabelPt : cycle.phaseLabelEn}
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          {locale === "pt" ? cycle.narrativePt : cycle.narrativeEn}
        </p>

        <div className="mt-8">
          <div className="flex justify-between text-xs text-faint">
            <span>{cycle.halving.lastHalving}</span>
            <span>{Math.round(cycle.cycleProgressPct)}%</span>
            <span>{cycle.halving.nextEstimate}</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${cycle.cycleProgressPct}%` }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div>
            <p className="text-sm text-muted">{t("halving")}</p>
            <p className="mt-1 text-2xl font-semibold">{cycle.halving.daysLeft}</p>
            <p className="text-xs text-faint">{t("daysLeft")}</p>
          </div>
          <div>
            <p className="text-sm text-muted">{t("phase")}</p>
            <p className="mt-1 text-2xl font-semibold">
              {locale === "pt" ? cycle.phaseLabelPt : cycle.phaseLabelEn}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted">ATH (1a)</p>
            <p className="mt-1 font-mono text-2xl tabular-nums">
              {cycle.athDistancePct != null
                ? formatPct(cycle.athDistancePct)
                : "—"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{t("timeline")}</h2>
        <ol className="relative ml-1 mt-6 border-l border-line">
          {BITCOIN_TIMELINE.map((ev) => (
            <li key={ev.id} className="relative mb-8 ml-6">
              <span
                className={`absolute -left-[1.66rem] top-1.5 h-2 w-2 rounded-full ${
                  ev.importance === "high" ? "bg-accent" : "bg-line-strong"
                }`}
              />
              <p className="font-mono text-xs text-faint">{ev.date}</p>
              <h3 className="text-xl font-semibold">
                {locale === "pt" ? ev.titlePt : ev.titleEn}
                {ev.priceHint && (
                  <span className="ml-2 text-sm font-normal text-muted">
                    {ev.priceHint}
                  </span>
                )}
              </h3>
              <p className="mt-1 max-w-xl text-sm text-muted">
                {locale === "pt" ? ev.bodyPt : ev.bodyEn}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
