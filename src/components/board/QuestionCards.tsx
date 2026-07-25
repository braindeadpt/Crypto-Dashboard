"use client";

import { Link } from "@/i18n/navigation";
import type { ReadingSet } from "@/lib/reading";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * Nível 2 — a evidência.
 *
 * Um sinal por cartão, e o título é sempre uma PERGUNTA do leitor, nunca o nome
 * de uma métrica. A entrada responde em duas linhas e faz ponte para o destino
 * onde vive a profundidade — não tenta ser esse destino.
 */

function QuestionCard({
  question,
  answer,
  detail,
  href,
  cta,
}: {
  question: string;
  answer: string;
  detail?: string;
  href?: "/mundo" | "/fluxos" | "/instrumento" | "/contexto";
  cta?: string;
}) {
  const body: ReactNode = (
    <>
      <h3 className="text-body font-medium leading-snug text-ink">{question}</h3>
      <p className="mt-2 text-body leading-snug text-muted">{answer}</p>
      {detail && <p className="mt-1.5 text-meta text-faint">{detail}</p>}
      {href && cta && (
        <span className="mt-3 inline-block text-label text-accent">
          {cta} →
        </span>
      )}
    </>
  );

  const cls = "panel-secondary block min-w-0 p-4 transition";
  return href ? (
    <Link href={href} className={`${cls} hover:border-accent/40`}>
      {body}
    </Link>
  ) : (
    <section className={cls}>{body}</section>
  );
}

export function QuestionCards({ readings }: { readings: ReadingSet }) {
  const t = useTranslations("questions");
  const locale = useLocale();
  const isPt = locale === "pt";
  const { direction, risk, money } = readings;

  const pick = (id: string, r: typeof direction) =>
    r.contributors.find((c) => c.id === id);

  const breadth = pick("breadth", direction);
  const stables = pick("stables", money);
  const oi = pick("oi", risk);

  return (
    <div className="board-act">
      <div className="act-head">
        <h2 className="act-head__title">{t("actTitle")}</h2>
        <span className="act-head__note">{t("actNote")}</span>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <QuestionCard
          question={t("money.q")}
          answer={isPt ? money.sentencePt : money.sentenceEn}
          detail={
            stables
              ? `${isPt ? stables.labelPt : stables.labelEn}: ${isPt ? stables.detailPt : stables.detailEn}`
              : t("noSignal")
          }
          href="/fluxos"
          cta={t("money.cta")}
        />

        <QuestionCard
          question={t("risk.q")}
          answer={isPt ? risk.sentencePt : risk.sentenceEn}
          detail={
            oi
              ? `${isPt ? oi.labelPt : oi.labelEn}: ${isPt ? oi.detailPt : oi.detailEn}`
              : t("noSignal")
          }
          href="/instrumento"
          cta={t("risk.cta")}
        />

        <QuestionCard
          question={t("breadth.q")}
          answer={isPt ? direction.sentencePt : direction.sentenceEn}
          detail={
            breadth
              ? isPt
                ? breadth.detailPt
                : breadth.detailEn
              : t("noSignal")
          }
        />

        <QuestionCard
          question={t("why.q")}
          answer={t("why.a")}
          href="/mundo"
          cta={t("why.cta")}
        />

        <QuestionCard
          question={t("rotation.q")}
          answer={t("rotation.a")}
          href="/mundo"
          cta={t("rotation.cta")}
        />

        <QuestionCard
          question={t("broken.q")}
          answer={t("broken.a")}
          href="/fluxos"
          cta={t("broken.cta")}
        />
      </div>
    </div>
  );
}
