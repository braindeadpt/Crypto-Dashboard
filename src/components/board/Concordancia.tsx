"use client";

import type { Concordancia as ConcordanciaData } from "@/lib/history/concordancia";
import { DataAge } from "@/components/explain/DataAge";
import { useLocale, useTranslations } from "next-intl";

/**
 * CONCORDÂNCIA — quantos sinais se moveram no mesmo sentido do preço.
 *
 * Uma coluna por dia: altura = fracção de sinais concordantes (0–1),
 * cor = direcção do preço nesse dia. O olho procura a divergência:
 * preço a subir com a faixa a cair é um movimento sem apoio. Dias sem
 * sinais computáveis ficam como marca curta — lacuna declarada, nunca
 * interpolada.
 *
 * Linguagem obrigatória: "consistente com" — concordância é acordo
 * temporal entre sinais, jamais causa.
 */
export function Concordancia({
  data,
}: {
  data: ConcordanciaData;
}) {
  const t = useTranslations("concordancia");
  const locale = useLocale();

  if (!data.days.length) {
    return <p className="text-meta text-faint">{t("empty")}</p>;
  }

  const last = data.days[data.days.length - 1];
  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

  const aria =
    locale === "pt"
      ? `Concordância dos últimos ${data.days.length} dias: quantos sinais se moveram no mesmo sentido do preço. Hoje ${last.agreed} de ${last.total}.`
      : `Agreement over the last ${data.days.length} days: how many signals moved with price. Today ${last.agreed} of ${last.total}.`;

  return (
    <div className="mt-3" role="img" aria-label={aria}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[0.62rem] uppercase tracking-wider text-faint">
          {t("title")}
        </p>
        <p className="font-mono text-[0.68rem] tabular-nums text-faint">
          {t("today", { agreed: last.agreed, total: last.total })}
          {data.updatedAt && (
            <>
              {" · "}
              <DataAge at={data.updatedAt} className="text-[0.68rem]" />
            </>
          )}
        </p>
      </div>

      <div className="mt-1.5 flex h-10 items-end gap-px">
        {data.days.map((d) => {
          const frac = d.total > 0 ? d.agreed / d.total : 0;
          const up = d.priceDeltaPct >= 0;
          return (
            <div
              key={d.t}
              title={
                d.total > 0
                  ? `${d.t} · ${d.agreed}/${d.total} ${t("signals")} · BTC ${fmtPct(d.priceDeltaPct)}`
                  : `${d.t} · ${t("noSignals")} · BTC ${fmtPct(d.priceDeltaPct)}`
              }
              className="min-w-0 flex-1"
              style={{
                height:
                  d.total === 0
                    ? "8%"
                    : `${Math.max(8, Math.round(frac * 100))}%`,
                backgroundColor:
                  d.total === 0
                    ? "var(--faint)"
                    : up
                      ? "var(--accent)"
                      : "var(--down)",
                opacity: d.total === 0 ? 0.35 : 0.4 + 0.6 * frac,
              }}
            />
          );
        })}
      </div>

      <p className="mt-1.5 font-mono text-[0.58rem] text-faint">
        {t("note")}
      </p>
    </div>
  );
}
