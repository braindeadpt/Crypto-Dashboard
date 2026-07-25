"use client";

import type { JargonTermId } from "@/lib/jargon";
import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";

type Props = {
  term: JargonTermId;
  /** Prefer abbreviation (Instrument / Analyst dense UI) */
  preferAbbr?: boolean;
  className?: string;
};

/**
 * Label with plain twin always available.
 * Default: plain language; optional abbr in parentheses for dense surfaces.
 */
export function TermLabel({ term, preferAbbr = false, className }: Props) {
  const t = useTranslations(`jargon.${term}`);
  const plain = t("plain");
  const abbr = t("abbr");

  if (preferAbbr) {
    return (
      <span className={cn("text-label text-faint", className)} title={plain}>
        {abbr}
        <span className="sr-only"> — {plain}</span>
      </span>
    );
  }

  return (
    <span className={cn("text-label text-faint", className)} title={abbr}>
      {plain}
      <span className="ml-1 font-mono text-[0.65em] text-faint/80" aria-hidden>
        ({abbr})
      </span>
    </span>
  );
}
