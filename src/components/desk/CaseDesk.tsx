"use client";

import { CaseEffectStage } from "@/components/cases/CaseEffectStage";
import { Link } from "@/i18n/navigation";
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

      <CaseEffectStage caseFile={caseFile} className="mt-6" showOpenLink={false} />

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
