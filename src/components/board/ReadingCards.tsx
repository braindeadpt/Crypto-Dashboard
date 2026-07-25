"use client";

import type { Reading, ReadingSet } from "@/lib/reading";
import { LOW_CONFIDENCE } from "@/lib/reading";
import { useLocale, useTranslations } from "next-intl";

/**
 * Nível 1 — a resposta.
 *
 * Três leituras em vez de 105 percentagens. Cada uma mostra o valor, a frase em
 * português comum e, quando a confiança é baixa, diz o que lhe faltou — nunca
 * apresenta uma leitura incompleta como se fosse completa.
 */

function toneFor(r: Reading): string {
  if (r.id === "risk") {
    if (r.value >= 70) return "text-storm";
    if (r.value >= 45) return "text-warn";
    return "text-up";
  }
  if (r.band === "muito-positivo" || r.band === "positivo") return "text-up";
  if (r.band === "muito-negativo" || r.band === "negativo") return "text-down";
  return "text-ink";
}

function displayValue(r: Reading): string {
  if (r.confidence === 0) return "—";
  if (r.id === "risk") return String(r.value);
  return `${r.value > 0 ? "+" : ""}${r.value}`;
}

export function ReadingCard({ reading }: { reading: Reading }) {
  const t = useTranslations("readings");
  const locale = useLocale();
  const isPt = locale === "pt";
  const low = reading.confidence < LOW_CONFIDENCE;
  const sentence = isPt ? reading.sentencePt : reading.sentenceEn;

  return (
    <section className="panel-secondary flex min-w-0 flex-col p-4">
      <p className="text-label text-faint">{t(`${reading.id}.label`)}</p>

      <p
        className={`mt-1 font-display text-display leading-none ${toneFor(reading)}`}
      >
        {displayValue(reading)}
      </p>

      <p className="mt-2 text-body leading-snug text-ink">{sentence}</p>

      {/* Confiança e lacunas: a leitura nunca finge estar completa. */}
      {reading.confidence === 0 ? (
        <p className="mt-2 text-meta text-warn">{t("noData")}</p>
      ) : (
        low && (
          <p className="mt-2 text-meta text-warn">
            {t("partial", {
              missing: reading.gaps
                .map((g) => (isPt ? g.labelPt : g.labelEn))
                .join(", "),
            })}
          </p>
        )
      )}

      {/* O que mais pesou — mantém a síntese auditável. */}
      {reading.contributors[0] && (
        <p className="mt-auto pt-3 text-meta text-muted">
          <span className="text-faint">{t("driver")}: </span>
          {isPt
            ? reading.contributors[0].labelPt
            : reading.contributors[0].labelEn}
          {" — "}
          {isPt
            ? reading.contributors[0].detailPt
            : reading.contributors[0].detailEn}
        </p>
      )}
    </section>
  );
}

export function ReadingHeadline({ readings }: { readings: ReadingSet }) {
  const t = useTranslations("readings");
  const locale = useLocale();
  const isPt = locale === "pt";

  return (
    <section className="lum-hero panel-hero p-5 md:p-7">
      <p className="text-label text-faint">{t("todayEyebrow")}</p>
      <h1 className="mt-2 font-display text-title leading-tight text-ink md:text-display">
        {isPt ? readings.headlinePt : readings.headlineEn}
      </h1>
      <p className="mt-3 text-body text-muted">
        <span className="text-label text-accent-2">{t("watch")}: </span>
        {isPt ? readings.watchPt : readings.watchEn}
      </p>
    </section>
  );
}

export function ReadingTrio({ readings }: { readings: ReadingSet }) {
  return (
    <div className="mt-3 grid gap-3 md:grid-cols-3">
      <ReadingCard reading={readings.direction} />
      <ReadingCard reading={readings.risk} />
      <ReadingCard reading={readings.money} />
    </div>
  );
}
