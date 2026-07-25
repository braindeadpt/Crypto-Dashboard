"use client";

import { Link } from "@/i18n/navigation";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { CaseFile } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

export function CaseDesk({ caseFile }: { caseFile: CaseFile }) {
  const t = useTranslations("case");
  const locale = useLocale();
  const [picked, setPicked] = useState<number | null>(null);

  const quiz = caseFile.quiz;
  const options = locale === "pt" ? quiz?.optionsPt : quiz?.optionsEn;

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 md:px-6 enter">
      <Link href="/mundo" className="text-meta text-accent">
        ← {t("back")}
      </Link>

      <p className="mt-6 text-label text-faint">{t("title")}</p>
      <h1 className="mt-2 text-hero text-ink">{caseFile.symbol}</h1>
      <p className={`mt-1 text-data ${deltaClass(caseFile.change24h)}`}>
        {caseFile.change24h >= 0 ? "▲" : "▼"} {formatPct(caseFile.change24h)} ·{" "}
        {formatUsd(caseFile.price)}
      </p>
      <p className="mt-2 text-meta text-faint">{t("correlationNote")}</p>

      <section className="panel-hero mt-8 p-5">
        <h2 className="text-label text-faint">{t("observation")}</h2>
        <p className="mt-2 text-title text-ink">
          {locale === "pt" ? caseFile.observationPt : caseFile.observationEn}
        </p>
      </section>

      {caseFile.unclear && (
        <section className="panel-secondary mt-4 border-warn/35 p-5">
          <h2 className="text-label text-warn">{t("unclear")}</h2>
          <p className="mt-2 text-body text-muted">{t("unclearHint")}</p>
        </section>
      )}

      <section className="mt-4">
        <h2 className="text-label text-faint">{t("hypotheses")}</h2>
        <ol className="mt-3 space-y-3">
          {caseFile.hypotheses.map((h) => {
            const fors = locale === "pt" ? h.forPt : h.forEn;
            const againsts = locale === "pt" ? h.againstPt : h.againstEn;
            return (
              <li key={h.id} className="panel-secondary p-4">
                <div className="flex justify-between gap-3">
                  <span className="text-body font-medium">
                    {locale === "pt" ? h.labelPt : h.labelEn}
                  </span>
                  <span className="shrink-0 text-meta text-muted">
                    {t("rank")} {Math.round(h.confidence * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden bg-bg">
                  <div
                    className="h-full bg-accent"
                    style={{ width: `${h.confidence * 100}%` }}
                  />
                </div>
                {fors.length > 0 && (
                  <div className="mt-3">
                    <p className="text-label text-up">{t("for")}</p>
                    <ul className="mt-1 space-y-1">
                      {fors.map((line, i) => (
                        <li key={i} className="text-meta text-muted">
                          · {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {againsts.length > 0 && (
                  <div className="mt-3">
                    <p className="text-label text-down">{t("against")}</p>
                    <ul className="mt-1 space-y-1">
                      {againsts.map((line, i) => (
                        <li key={i} className="text-meta text-muted">
                          · {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
              </li>
            );
          })}
        </ol>
      </section>

      <section className="panel-secondary mt-4 p-5">
        <h2 className="text-label text-faint">{t("evidence")}</h2>
        <ul className="mt-3 divide-y divide-line">
          {caseFile.evidence.map((e) => (
            <li key={e.id} className="flex justify-between py-2 text-data">
              <span className="text-muted">
                {locale === "pt" ? e.label : e.labelEn}
              </span>
              <span className="font-mono">{e.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel-hero mt-4 border-accent/30 p-5">
        <h2 className="text-label text-faint">{t("conclusion")}</h2>
        <p className="mt-2 text-body text-muted">
          {locale === "pt" ? caseFile.conclusionPt : caseFile.conclusionEn}
        </p>
      </section>

      {quiz && options && (
        <section className="panel-secondary mt-6 p-5">
          <h2 className="text-label text-faint">{t("quiz")}</h2>
          <p className="mt-2 text-title">
            {locale === "pt" ? quiz.questionPt : quiz.questionEn}
          </p>
          <ul className="mt-4 space-y-2">
            {options.map((opt, i) => {
              const correct = i === quiz.answerIndex;
              const show = picked !== null;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setPicked(i)}
                    className={`w-full border px-3 py-2.5 text-left text-body transition ${
                      show && correct
                        ? "border-calm bg-calm/10"
                        : show && picked === i
                          ? "border-storm bg-storm/10"
                          : "border-line hover:border-accent"
                    }`}
                  >
                    {opt}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
