"use client";

import { HypothesisForceViz } from "@/components/cases/HypothesisForceViz";
import { MoveHorizonViz } from "@/components/cases/MoveHorizonViz";
import { SignalStrip } from "@/components/cases/SignalStrip";
import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { Link } from "@/i18n/navigation";
import type { SectorRow } from "@/lib/data/sectors";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { CaseFile } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  caseFile: CaseFile;
  /** Sectors that list this asset — contextual link, not cause */
  relatedSectors?: SectorRow[];
  onSelectSector?: (id: string) => void;
  /** Compact when stacking many on /mundo */
  featured?: boolean;
  /** Hide deep-link when already on /caso/[id] */
  showOpenLink?: boolean;
  className?: string;
};

/**
 * Full Case & Effect board — observation, horizon, signals, hypotheses for/against.
 * Language stays correlational ("consistent with"), never causal.
 */
export function CaseEffectStage({
  caseFile,
  relatedSectors = [],
  onSelectSector,
  featured = true,
  showOpenLink = true,
  className = "",
}: Props) {
  const t = useTranslations("case");
  const locale = useLocale();
  const up = caseFile.change24h >= 0;

  return (
    <article
      id={caseFile.id}
      className={`panel-hero lum-panel scroll-mt-24 ${featured ? "p-4 md:p-6" : "p-4"} ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-label text-faint">{t("title")}</p>
          <h3 className="mt-1 font-display text-display text-ink">
            {caseFile.symbol}
          </h3>
          <p className={`mt-1 text-data ${deltaClass(caseFile.change24h)}`}>
            <span className={up ? "lum-up" : "lum-down"}>
              {up ? "▲" : "▼"} {formatPct(caseFile.change24h)}
            </span>
            <span className="ml-2 text-muted">{formatUsd(caseFile.price)}</span>
          </p>
        </div>
        {showOpenLink && (
          <Link
            href={`/caso/${caseFile.id}`}
            className="shrink-0 text-label text-accent hover:underline"
          >
            {t("openFull")} →
          </Link>
        )}
      </header>

      <p className="mt-2 text-meta text-faint">{t("correlationNote")}</p>

      <section className="mt-5 border border-line bg-bg-elevated p-4">
        <h4 className="text-label text-faint">{t("observation")}</h4>
        <p className="mt-2 font-display text-title text-ink text-balance">
          {locale === "pt" ? caseFile.observationPt : caseFile.observationEn}
        </p>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <MoveHorizonViz caseFile={caseFile} />
        <SignalStrip evidence={caseFile.evidence} />
      </div>

      {caseFile.unclear ? (
        <section className="mt-4 border border-warn/40 bg-bg-elevated p-4">
          <h4 className="text-label text-warn">{t("unclear")}</h4>
          <p className="mt-2 text-body text-muted">{t("unclearHint")}</p>
        </section>
      ) : (
        <>
          <HypothesisForceViz
            hypotheses={caseFile.hypotheses}
            className="mt-5"
          />

          <section className="mt-5">
            <h4 className="text-label text-faint">{t("hypotheses")}</h4>
            <ol className="mt-3 space-y-3">
              {caseFile.hypotheses.map((h) => {
                const fors = locale === "pt" ? h.forPt : h.forEn;
                const againsts = locale === "pt" ? h.againstPt : h.againstEn;
                return (
                  <li key={h.id} className="panel-secondary p-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-body font-medium text-ink">
                        {locale === "pt" ? h.labelPt : h.labelEn}
                      </span>
                      <span className="text-meta text-muted">
                        {t("rank")} {Math.round(h.confidence * 100)}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-label text-up">{t("for")}</p>
                        {fors.length === 0 ? (
                          <p className="mt-1 text-meta text-faint">—</p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {fors.map((line, i) => (
                              <li key={i} className="text-meta text-muted">
                                · {line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <p className="text-label text-down">{t("against")}</p>
                        {againsts.length === 0 ? (
                          <p className="mt-1 text-meta text-faint">—</p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {againsts.map((line, i) => (
                              <li key={i} className="text-meta text-muted">
                                · {line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                    <ExpertiseGate section="methodSources">
                      {h.sources.length > 0 && (
                        <p className="mt-3 text-meta text-faint">
                          {t("sources")}:{" "}
                          {h.sources.map((s, i) => (
                            <span key={s.url}>
                              {i > 0 ? " · " : ""}
                              <a
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-accent hover:underline"
                              >
                                {s.title}
                              </a>
                            </span>
                          ))}
                        </p>
                      )}
                    </ExpertiseGate>
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}

      <section className="mt-4 border border-accent/25 bg-accent-dim/30 p-4">
        <h4 className="text-label text-faint">{t("conclusion")}</h4>
        <p className="mt-2 text-body text-ink text-balance">
          {locale === "pt" ? caseFile.conclusionPt : caseFile.conclusionEn}
        </p>
      </section>

      {relatedSectors.length > 0 && (
        <section className="mt-4">
          <h4 className="text-label text-faint">{t("sectorLinkTitle")}</h4>
          <p className="mt-0.5 text-meta text-faint">{t("sectorLinkHint")}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {relatedSectors.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => onSelectSector?.(s.id)}
                  className="border border-line px-2.5 py-1.5 text-meta text-muted transition hover:border-accent hover:text-accent"
                >
                  {s.name}{" "}
                  <span className={deltaClass(s.change24h)}>
                    {formatPct(s.change24h)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
