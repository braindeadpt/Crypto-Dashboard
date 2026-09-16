"use client";

import { SEGURANCA_CONTENT } from "@/lib/content/seguranca";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

/**
 * "Spot the scam" quiz — reuses the CaseDesk quiz pattern with a per-question
 * explanation. Content lives in SEGURANCA_CONTENT.quiz (bilingual).
 */
export function PhishingQuiz() {
  const t = useTranslations("seguranca");
  const locale = useLocale();
  const pt = locale === "pt";
  const [picked, setPicked] = useState<Record<string, number>>({});

  return (
    <section className="border border-line bg-surface p-5">
      <h3 className="text-title">{t("quizTitle")}</h3>
      <p className="mt-1 text-sm text-muted">{t("quizSubtitle")}</p>

      <div className="mt-5 space-y-6">
        {SEGURANCA_CONTENT.quiz.map((q, qi) => {
          const options = pt ? q.optionsPt : q.optionsEn;
          const answer = picked[q.id];
          return (
            <div key={q.id}>
              <p className="text-sm font-medium text-ink">
                <span className="font-mono text-xs text-faint">{qi + 1}.</span>{" "}
                {pt ? q.questionPt : q.questionEn}
              </p>
              <ul className="mt-2 space-y-2">
                {options.map((opt, i) => {
                  const correct = i === q.answerIndex;
                  const show = answer !== undefined;
                  return (
                    <li key={i}>
                      <button
                        type="button"
                        onClick={() => setPicked((p) => ({ ...p, [q.id]: i }))}
                        className={`w-full border px-3 py-2 text-left text-sm transition ${
                          show && correct
                            ? "border-calm bg-calm/10"
                            : show && answer === i
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
              {answer !== undefined && (
                <p className="mt-2 border-l-2 border-accent/40 pl-3 text-sm text-muted">
                  {pt ? q.explainPt : q.explainEn}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
