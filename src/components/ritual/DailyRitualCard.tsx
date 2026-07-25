"use client";

import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { Link } from "@/i18n/navigation";
import type { DailyRitual } from "@/lib/editorial/ritual";
import type { DayDelta } from "@/lib/history/deltas";
import { deltaClass } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  ritual: DailyRitual;
  className?: string;
};

function formatDelta(d: DayDelta): string {
  const sign = d.absChange >= 0 ? "+" : "";
  if (d.unit === "rate") {
    return `${sign}${(d.absChange * 100).toFixed(4)} pp`;
  }
  if (d.unit === "usd_m") {
    return `${sign}${d.absChange.toFixed(0)}M`;
  }
  if (d.unit === "index") {
    return `${sign}${d.absChange.toFixed(0)}`;
  }
  if (d.unit === "pct") {
    return `${sign}${d.absChange.toFixed(1)} pp`;
  }
  if (d.pctChange != null) {
    return `${sign}${d.pctChange.toFixed(1)}%`;
  }
  return `${sign}${d.absChange.toFixed(2)}`;
}

/**
 * Fixed ~5-minute daily ritual — always the same five slots.
 */
export function DailyRitualCard({ ritual, className = "" }: Props) {
  const t = useTranslations("ritual");
  const locale = useLocale();
  const loc = locale === "pt" ? "pt" : "en";
  const headline = loc === "pt" ? ritual.headlinePt : ritual.headlineEn;
  const why =
    loc === "pt" ? ritual.whyItMattersPt : ritual.whyItMattersEn;
  const lessonTitle =
    loc === "pt" ? ritual.lesson.titlePt : ritual.lesson.titleEn;
  const lessonBody =
    loc === "pt" ? ritual.lesson.summaryPt : ritual.lesson.summaryEn;
  const dont = loc === "pt" ? ritual.dont.pt : ritual.dont.en;

  return (
    <section
      id="ritual"
      className={`border border-line bg-bg-elevated p-4 md:p-5 ${className}`}
      aria-label={t("title")}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-label text-faint">{t("eyebrow")}</p>
          <h2 className="mt-0.5 font-display text-title text-ink">
            {t("title")}
          </h2>
        </div>
        <p className="text-meta text-faint tabular-nums">{ritual.date}</p>
      </header>

      {/* 1. Postura */}
      <div className="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
        <Slot n={1} label={t("posture")}>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`chip chip-${ritual.posture}`}>
              {t(`postureLabels.${ritual.posture}`)}
            </span>
            <span className="text-data text-muted">
              {t("stress", { score: ritual.score })}
            </span>
          </div>
          <p className="mt-2 font-display text-body text-ink text-balance">
            {headline}
          </p>
          <ExpertiseGate section="readings">
            <p className="mt-1 text-meta text-muted">{why}</p>
          </ExpertiseGate>
        </Slot>

        {/* 2. O que mudou */}
        <Slot n={2} label={t("changed")}>
          {ritual.quietDay ? (
            <p className="text-body text-muted">{t("quiet")}</p>
          ) : (
            <ul className="space-y-1.5">
              {ritual.notableDeltas.map((d) => (
                <li
                  key={d.metricId}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="text-muted">
                    {loc === "pt" ? d.labelPt : d.labelEn}
                  </span>
                  <span
                    className={`text-data tabular-nums ${deltaClass(d.absChange)}`}
                  >
                    {formatDelta(d)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {ritual.notableDeltas[0] && (
            <p className="mt-2 text-meta text-faint">
              {t("vs", {
                from: ritual.notableDeltas[0].prevDay,
                to: ritual.notableDeltas[0].currDay,
              })}
            </p>
          )}
        </Slot>
      </div>

      <div className="mt-3 grid gap-3 sm:mt-4 sm:gap-4 md:grid-cols-3">
        {/* 3. Movimento */}
        <Slot n={3} label={t("move")}>
          {ritual.mover ? (
            <>
              <p className="text-data text-ink">
                {ritual.mover.symbol}{" "}
                <span className={deltaClass(ritual.mover.change24h)}>
                  {ritual.mover.change24h >= 0 ? "+" : ""}
                  {ritual.mover.change24h.toFixed(1)}%
                </span>
              </p>
              <ExpertiseGate section="readings">
                <p className="mt-1 text-meta text-muted">
                  {loc === "pt" ? ritual.mover.causePt : ritual.mover.causeEn}
                </p>
              </ExpertiseGate>
              {ritual.mover.caseId && (
                <Link
                  href={`/caso/${ritual.mover.caseId}`}
                  className="mt-2 inline-block text-label text-accent"
                >
                  {t("caseLink")} →
                </Link>
              )}
            </>
          ) : (
            <p className="text-meta text-muted">{t("noMove")}</p>
          )}
        </Slot>

        {/* 4. Lição */}
        <Slot n={4} label={t("lesson")}>
          <p className="font-medium text-ink">{lessonTitle}</p>
          <p className="mt-1 text-meta text-muted">{lessonBody}</p>
          <Link
            href={`/atlas/${ritual.lesson.slug}`}
            className="mt-2 inline-block text-label text-accent"
          >
            {t("learnMore")} →
          </Link>
        </Slot>

        {/* 5. Anti-hype */}
        <Slot n={5} label={t("dont")}>
          <p className="text-body text-ink">{dont}</p>
        </Slot>
      </div>

      <p className="mt-4 text-meta text-faint">
        {t("mode", { mode: ritual.mode === "llm" ? t("modeLlm") : t("modeDet") })}
      </p>
    </section>
  );
}

function Slot({
  n,
  label,
  children,
}: {
  n: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-line bg-surface p-3">
      <p className="text-label text-faint">
        <span className="tabular-nums text-accent">{n}.</span> {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
