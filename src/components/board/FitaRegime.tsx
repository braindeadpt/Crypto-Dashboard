"use client";

import type { RegimeDay } from "@/lib/regime/history";
import { useLocale, useTranslations } from "next-intl";

/**
 * FITA DE REGIME — a DURAÇÃO do estado, não só o estado.
 *
 * Todos os dashboards mostram o regime AGORA; esta fita fina mostra há
 * quantos dias seguidos o mercado vive nele. Uma célula por dia, cor =
 * postura, translúcido quando a cobertura de sinais foi parcial — a
 * lacuna declara-se, não se esconde.
 */
export function FitaRegime({ days }: { days: RegimeDay[] }) {
  const t = useTranslations("fitaRegime");
  const tp = useTranslations("pulso");
  const locale = useLocale();

  if (days.length < 2) return null;

  const last = days[days.length - 1];
  // Duração: dias consecutivos no fim com a mesma postura de hoje.
  let duration = 1;
  for (let i = days.length - 2; i >= 0; i--) {
    if (days[i].posture !== last.posture) break;
    duration++;
  }

  const aria =
    locale === "pt"
      ? `Regime dos últimos ${days.length} dias. Hoje ${tp(`posture.${last.posture}`)} há ${duration} dias.`
      : `Regime over the last ${days.length} days. ${tp(`posture.${last.posture}`)} for ${duration} days.`;

  return (
    <div className="mt-4" role="img" aria-label={aria}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-mono text-[0.62rem] uppercase tracking-wider text-faint">
          {t("title")}
        </p>
        <p className="font-mono text-[0.68rem] tabular-nums">
          <span
            className="mr-1.5 inline-block h-2 w-2 align-middle"
            style={{ backgroundColor: `var(--${last.posture})` }}
          />
          <span className="text-ink">{tp(`posture.${last.posture}`)}</span>{" "}
          <span className="text-faint">
            {t("forDays", { n: duration })}
          </span>
        </p>
      </div>
      <div className="mt-1.5 flex h-3.5 gap-px">
        {days.map((d) => (
          <div
            key={d.t}
            title={`${d.t} · ${tp(`posture.${d.posture}`)}${
              d.coverage < 1 ? ` · ${t("partial")}` : ""
            }`}
            className="min-w-0 flex-1"
            style={{
              backgroundColor: `var(--${d.posture})`,
              opacity: d.coverage < 0.5 ? 0.3 : d.coverage < 1 ? 0.6 : 1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
