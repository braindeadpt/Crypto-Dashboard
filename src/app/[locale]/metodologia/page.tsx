import {
  READING_BANDS,
  READING_METHOD_ANCHOR,
  READING_SPECS,
} from "@/lib/reading";
import type { ReadingBand, ReadingId } from "@/lib/reading/types";
import {
  REGIME_POSTURE,
  REGIME_SIGNALS,
  REGIME_WEIRD_RULES,
} from "@/lib/regime/engine";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const dynamic = "force-dynamic";

/**
 * /metodologia — a fonte publicada das contas (R9).
 *
 * Nada aqui é uma cópia: a página renderiza REGIME_SIGNALS, REGIME_WEIRD_RULES,
 * REGIME_POSTURE, READING_SPECS e READING_BANDS — os mesmos objectos que o
 * motor executa. Mudar uma regra no código muda a documentação.
 */

const BAND_LABEL: Record<ReadingBand, string> = {
  "muito-negativo": "bandVeryNeg",
  negativo: "bandNeg",
  neutro: "bandNeutral",
  positivo: "bandPos",
  "muito-positivo": "bandVeryPos",
};

const READING_INTRO: Record<ReadingId, string> = {
  direction: "directionIntro",
  risk: "riskIntro",
  money: "moneyIntro",
};

export default async function MetodologiaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isPt = locale === "pt";
  const t = await getTranslations("metodologia");
  const tr = await getTranslations("readings");
  const tb = await getTranslations("board");

  const postureRows = [
    {
      name: tb("posture.calm"),
      cond: t("postureCalmCond", {
        unsettledMin: REGIME_POSTURE.unsettledMin,
      }),
    },
    {
      name: tb("posture.unsettled"),
      cond: t("postureUnsettledCond", {
        unsettledMin: REGIME_POSTURE.unsettledMin,
        stormMin: REGIME_POSTURE.stormMin,
      }),
    },
    {
      name: tb("posture.storm"),
      cond: t("postureStormCond", { stormMin: REGIME_POSTURE.stormMin }),
    },
    {
      name: tb("posture.weird"),
      cond: t("postureWeirdCond", { weirdMin: REGIME_POSTURE.weirdMinStress }),
    },
  ];

  return (
    <div className="obs-shell section-pad pb-20 pt-8 enter">
      <header className="max-w-3xl border-b border-line pb-8">
        <p className="text-label text-faint">CLAREZA · {t("eyebrow")}</p>
        <h1 className="mt-3 text-display text-ink">{t("title")}</h1>
        <p className="mt-3 text-body text-muted">{t("subtitle")}</p>
      </header>

      {/* Princípios — as regras de honestidade antes das contas */}
      <section className="mt-12 max-w-3xl">
        <h2 className="text-title text-ink">{t("principlesTitle")}</h2>
        <ul className="mt-4 space-y-2">
          {(["p1", "p2", "p3"] as const).map((k) => (
            <li
              key={k}
              className="border-l-2 border-accent/40 pl-3 text-body text-muted"
            >
              {t(k)}
            </li>
          ))}
        </ul>
      </section>

      {/* Regime de stress — a tabela que o motor executa */}
      <section id="regime" className="mt-14 scroll-mt-28">
        <h2 className="text-title text-ink">{t("regimeTitle")}</h2>
        <p className="mt-1 max-w-3xl text-meta text-muted">
          {t("regimeIntro", { count: REGIME_SIGNALS.length })}
        </p>

        <h3 className="mt-6 text-label text-faint">{t("postureTitle")}</h3>
        <table className="mt-2 w-full max-w-2xl border border-line text-meta">
          <thead>
            <tr className="border-b border-line text-left text-label text-faint">
              <th className="px-3 py-2 font-normal">{t("colPosture")}</th>
              <th className="px-3 py-2 font-normal">{t("colCond")}</th>
            </tr>
          </thead>
          <tbody>
            {postureRows.map((r) => (
              <tr key={r.name} className="border-b border-line/60 last:border-0">
                <td className="px-3 py-1.5 text-ink">{r.name}</td>
                <td className="px-3 py-1.5 font-mono tabular-nums text-muted">
                  {r.cond}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 space-y-4">
          {REGIME_SIGNALS.map((sig) => (
            <div key={sig.id} className="border border-line">
              <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-3 py-2">
                <p className="text-body text-ink">
                  {isPt ? sig.labelPt : sig.labelEn}
                  <span className="ml-2 text-meta text-faint">
                    {isPt ? sig.measuresPt : sig.measuresEn}
                  </span>
                </p>
                <p className="text-meta text-faint">
                  {t("colSource")}: {sig.source}
                </p>
              </div>
              <ul>
                {sig.rungs.map((r) => (
                  <li
                    key={isPt ? r.condPt : r.condEn}
                    className="flex items-baseline justify-between gap-3 border-b border-line/60 px-3 py-1.5 text-meta last:border-0"
                  >
                    <span className="font-mono tabular-nums text-muted">
                      {isPt ? r.condPt : r.condEn}
                    </span>
                    <span className="shrink-0 font-mono tabular-nums text-warn">
                      +{r.points}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-label text-faint">{t("weirdTitle")}</h3>
        <p className="mt-1 max-w-3xl text-meta text-muted">
          {t("weirdIntro", { weirdMin: REGIME_POSTURE.weirdMinStress })}
        </p>
        <ul className="mt-3 max-w-2xl border border-line">
          {REGIME_WEIRD_RULES.map((r) => (
            <li
              key={isPt ? r.condPt : r.condEn}
              className="border-b border-line/60 px-3 py-1.5 font-mono text-meta tabular-nums text-muted last:border-0"
            >
              {isPt ? r.condPt : r.condEn}
            </li>
          ))}
        </ul>
      </section>

      {/* As três leituras — uma secção por leitura, âncora linkável */}
      {(Object.keys(READING_SPECS) as ReadingId[]).map((id) => {
        const spec = READING_SPECS[id];
        const bands = READING_BANDS[spec.signed ? "signed" : "unsigned"];
        return (
          <section
            key={id}
            id={READING_METHOD_ANCHOR[id]}
            className="mt-14 scroll-mt-28"
          >
            <h2 className="text-title text-ink">{tr(`${id}.label`)}</h2>
            <p className="mt-1 max-w-3xl text-meta text-muted">
              {t(READING_INTRO[id])} {t("gapNote")}
            </p>
            <table className="mt-4 w-full max-w-3xl border border-line text-meta">
              <thead>
                <tr className="border-b border-line text-left text-label text-faint">
                  <th className="px-3 py-2 font-normal">{t("colIngredient")}</th>
                  <th className="px-3 py-2 font-normal">{t("colWeight")}</th>
                  <th className="px-3 py-2 font-normal">{t("colScale")}</th>
                  <th className="px-3 py-2 font-normal">{t("colSource")}</th>
                </tr>
              </thead>
              <tbody>
                {spec.ingredients.map((ing) => (
                  <tr
                    key={ing.id}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-3 py-1.5 text-ink">
                      {isPt ? ing.labelPt : ing.labelEn}
                    </td>
                    <td className="px-3 py-1.5 font-mono tabular-nums text-muted">
                      {ing.weight}
                    </td>
                    <td className="px-3 py-1.5 text-muted">
                      {isPt ? ing.scalePt : ing.scaleEn}
                    </td>
                    <td className="px-3 py-1.5 text-faint">{ing.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3 className="mt-6 text-label text-faint">{t("bandsTitle")}</h3>
            <table className="mt-2 w-full max-w-2xl border border-line text-meta">
              <thead>
                <tr className="border-b border-line text-left text-label text-faint">
                  <th className="px-3 py-2 font-normal">{t("colCond")}</th>
                  <th className="px-3 py-2 font-normal">{t("colBand")}</th>
                </tr>
              </thead>
              <tbody>
                {bands.map((b) => (
                  <tr
                    key={b.band}
                    className="border-b border-line/60 last:border-0"
                  >
                    <td className="px-3 py-1.5 font-mono tabular-nums text-muted">
                      {isPt ? b.condPt : b.condEn}
                    </td>
                    <td className="px-3 py-1.5 text-ink">
                      {t(BAND_LABEL[b.band])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}
