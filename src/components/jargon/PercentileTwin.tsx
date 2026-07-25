"use client";

import { percentileMessageValues } from "@/lib/jargon";
import type { MetricContextApi } from "@/lib/history/context";
import type { MetricContext } from "@/lib/stats";
import { useTranslations } from "next-intl";

type Ctx = MetricContextApi | MetricContext;

/**
 * Visible percentile twin — plain by default, technical abbreviation optional.
 */
export function PercentileTwin({
  context,
  technical = false,
  className = "",
}: {
  context: Ctx | null | undefined;
  technical?: boolean;
  className?: string;
}) {
  const t = useTranslations("jargon.percentile");
  const vals = percentileMessageValues(context);

  if (!vals) {
    return (
      <span className={`text-meta text-faint ${className}`}>{t("lineNone")}</span>
    );
  }

  if (vals.insufficient) {
    return (
      <span className={`text-meta text-faint ${className}`}>
        {vals.days > 0 ? t("lineShort", { days: vals.days }) : t("lineNone")}
      </span>
    );
  }

  if (technical) {
    return (
      <span
        className={`text-meta tabular-nums text-faint ${className}`}
        title={t("line", { p: vals.p, days: vals.days })}
      >
        {t("tech", { p: vals.p, days: vals.days })}
      </span>
    );
  }

  return (
    <span className={`text-meta text-muted ${className}`}>
      {t("line", { p: vals.p, days: vals.days })}
    </span>
  );
}
