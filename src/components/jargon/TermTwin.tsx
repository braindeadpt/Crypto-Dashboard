"use client";

import {
  breadthMessageValues,
  fundingBandKey,
  lsMessageValues,
  type FundingBandKey,
  type JargonTermId,
} from "@/lib/jargon";
import { cn } from "@/lib/format";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

type Props = {
  term: JargonTermId;
  /** Formatted technical value shown small (or primary for Analista) */
  value: ReactNode;
  /** Raw funding rate (not %) when term is funding — picks qualitative band */
  fundingRate?: number | null;
  /** L/S ratio when term is ls */
  lsRatio?: number | null;
  /** Breadth 0–100 when term is breadth/amplitude */
  breadthPct?: number | null;
  /** Interpolated {value} for oi / tvl / etf / fearGreed lines */
  lineValue?: string;
  className?: string;
  /** Instrument: technical first, plain as secondary */
  technicalFirst?: boolean;
};

/**
 * Plain-language twin on the line + technical number.
 * Citizen/Operator: sentence first, small number.
 * Analyst / technicalFirst: number first, plain as caption.
 */
export function TermTwin({
  term,
  value,
  fundingRate,
  lsRatio,
  breadthPct,
  lineValue,
  className,
  technicalFirst = false,
}: Props) {
  const t = useTranslations(`jargon.${term}`);
  const tFund = useTranslations("jargon.funding");
  const { level } = useExpertise();
  const techLead = technicalFirst || level === "analyst";

  let line: string;
  if (term === "funding") {
    const band = fundingBandKey(fundingRate);
    line = t("line", { band: tFund(`band.${band as FundingBandKey}`) });
  } else if (term === "ls") {
    if (lsRatio == null || !Number.isFinite(lsRatio)) {
      line = t("plain");
    } else {
      const v = lsMessageValues(lsRatio);
      if (v.side === "long") line = t("lineLong", { multiple: v.multiple });
      else if (v.side === "short")
        line = t("lineShort", { multiple: v.multiple });
      else line = t("lineFlat");
    }
  } else if (term === "breadth" || term === "amplitude") {
    line =
      breadthPct == null
        ? t("plain")
        : t("line", breadthMessageValues(breadthPct));
  } else {
    line = t("line", { value: lineValue ?? "—" });
  }

  if (techLead) {
    return (
      <div className={cn(className)}>
        <div className="text-data font-medium tabular-nums text-ink">{value}</div>
        <p className="mt-1 max-w-md text-meta text-muted">{line}</p>
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <p className="max-w-md text-body text-ink text-balance">{line}</p>
      <p className="mt-1 font-mono text-meta tabular-nums text-faint">{value}</p>
    </div>
  );
}
