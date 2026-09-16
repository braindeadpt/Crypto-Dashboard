"use client";

import { DataAge } from "@/components/explain/DataAge";
import type { RegimeDay } from "@/lib/regime/history";
import type { MarketPosture } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

/**
 * R2 — o regime com passado. Uma barra por dia (stress 0–100), cor = postura.
 * Dias com poucos sinais ficam translúcidos — a cobertura declara-se,
 * não se esconde.
 */
export function RegimeHistory({
  days,
  updatedAt,
}: {
  days: RegimeDay[];
  updatedAt: string | null;
}) {
  const t = useTranslations("regimeHistory");
  const tp = useTranslations("pulso");
  const locale = useLocale();
  const isPt = locale === "pt";

  if (days.length < 2) return null;

  const last = days[days.length - 1];
  const partial = days.filter((d) => d.coverage < 1).length;
  const postures = [
    ...new Set(days.map((d) => d.posture)),
  ] as MarketPosture[];

  const aria = isPt
    ? `Stress do regime nos últimos ${days.length} dias. Hoje: ${last.score}, ${tp(`posture.${last.posture}`)}.`
    : `Regime stress over the last ${days.length} days. Today: ${last.score}, ${tp(`posture.${last.posture}`)}.`;

  return (
    <div className="mt-6 border-t border-line pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-label text-faint">{t("title")}</p>
        <p className="flex items-center gap-2 text-meta text-faint">
          {t("window", { days: days.length })}
          {updatedAt && <DataAge at={updatedAt} />}
        </p>
      </div>

      <div
        className="mt-2 flex h-14 items-end gap-px"
        role="img"
        aria-label={aria}
      >
        {days.map((d) => (
          <div
            key={d.t}
            title={`${d.t} · ${d.score} · ${tp(`posture.${d.posture}`)}`}
            className="min-w-0 flex-1"
            style={{
              height: `${Math.max(6, d.score)}%`,
              backgroundColor: `var(--${d.posture})`,
              opacity: d.coverage < 0.5 ? 0.35 : d.coverage < 1 ? 0.65 : 1,
            }}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {postures.map((p) => (
          <span
            key={p}
            className="flex items-center gap-1 text-meta text-faint"
          >
            <span
              className="inline-block h-2 w-2"
              style={{ backgroundColor: `var(--${p})` }}
            />
            {tp(`posture.${p}`)}
          </span>
        ))}
        {partial > 0 && (
          <span className="ml-auto text-meta text-faint">
            {t("partial", { n: partial })}
          </span>
        )}
      </div>
    </div>
  );
}
