"use client";

import { BitcoinTimelineViz } from "@/components/cycle/BitcoinTimelineViz";
import { CycleHistoryViz } from "@/components/cycle/CycleHistoryViz";
import { CyclePhaseViz } from "@/components/cycle/CyclePhaseViz";
import { formatPct } from "@/lib/format";
import type { CycleSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

export function CycleDesk({ cycle }: { cycle: CycleSnapshot }) {
  const t = useTranslations("cycle");
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 enter">
      <header className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </header>

      <section className="mt-8 border border-line bg-surface p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("storyline")}
        </p>
        <h3 className="mt-2 text-3xl font-semibold md:text-4xl">
          {locale === "pt" ? cycle.phaseLabelPt : cycle.phaseLabelEn}
        </h3>
        <p className="mt-4 max-w-2xl text-muted">
          {locale === "pt" ? cycle.narrativePt : cycle.narrativeEn}
        </p>

        <CyclePhaseViz cycle={cycle} className="mt-8" />

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

      <CycleHistoryViz cycle={cycle} className="mt-10" />

      <BitcoinTimelineViz className="mt-12" />
    </div>
  );
}
