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
      <Link href="/" className="text-sm font-semibold text-accent">
        ← {t("back")}
      </Link>

      <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-faint">
        {t("title")}
      </p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">
        {caseFile.symbol}
      </h1>
      <p className={`mt-1 font-mono ${deltaClass(caseFile.change24h)}`}>
        {formatPct(caseFile.change24h)} · {formatUsd(caseFile.price)}
      </p>

      <section className="card mt-8 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("observation")}
        </h2>
        <p className="mt-2 text-xl font-medium leading-snug">
          {locale === "pt" ? caseFile.observationPt : caseFile.observationEn}
        </p>
      </section>

      <section className="mt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("hypotheses")}
        </h2>
        <ol className="mt-3 space-y-3">
          {caseFile.hypotheses.map((h, i) => (
            <li key={i} className="card p-4">
              <div className="flex justify-between gap-3 text-sm">
                <span>{locale === "pt" ? h.labelPt : h.labelEn}</span>
                <span className="shrink-0 font-mono text-muted">
                  {t("rank")} {Math.round(h.confidence * 100)}%
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${h.confidence * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="card mt-4 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("evidence")}
        </h2>
        <ul className="mt-3 divide-y divide-line">
          {caseFile.evidence.map((e) => (
            <li key={e.id} className="flex justify-between py-2 text-sm">
              <span className="text-muted">
                {locale === "pt" ? e.label : e.labelEn}
              </span>
              <span className="font-mono">{e.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card mt-4 border-accent/30 bg-accent-dim/30 p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("conclusion")}
        </h2>
        <p className="mt-2 text-muted">
          {locale === "pt" ? caseFile.conclusionPt : caseFile.conclusionEn}
        </p>
      </section>

      {quiz && options && (
        <section className="card mt-6 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-faint">
            {t("quiz")}
          </h2>
          <p className="mt-2 text-lg font-medium">
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
                    className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm transition ${
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
