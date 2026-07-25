"use client";

import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import type { JargonTermId } from "@/lib/jargon";
import { cn } from "@/lib/format";
import { useTranslations } from "next-intl";
import { useId, useState, type ReactNode } from "react";

type Props = {
  value: ReactNode;
  meaning?: string;
  method?: string;
  source?: string;
  /** Prefer dictionary — one system with jargon, not a parallel explainer */
  term?: JargonTermId;
  updatedAt?: string;
  className?: string;
};

/**
 * Density-aware explanation:
 * - Essencial: meaning always visible
 * - Operador: click to expand
 * - Analista: value only (optional method behind methodSources)
 *
 * Pass `term` to pull meaning/method/source from the central jargon dictionary.
 */
export function ExplainThisNumber({
  value,
  meaning: meaningProp,
  method: methodProp,
  source: sourceProp,
  term,
  updatedAt,
  className,
}: Props) {
  const t = useTranslations("explain");
  const tj = useTranslations("jargon");
  const common = useTranslations("common");
  const { level, show } = useExpertise();
  const [open, setOpen] = useState(false);
  const id = useId();

  const meaning = term ? tj(`${term}.meaning`) : (meaningProp ?? "");
  const method = term ? tj(`${term}.method`) : (methodProp ?? "");
  const source = term ? tj(`${term}.source`) : (sourceProp ?? "");

  if (level === "analyst") {
    return (
      <div className={cn(className)}>
        <div className="font-mono text-3xl font-medium tracking-tight tabular-nums text-ink">
          {value}
        </div>
        {show("methodSources") && (
          <p className="mt-1 font-mono text-[0.65rem] text-faint">
            {source}
            {updatedAt ? ` · ${new Date(updatedAt).toLocaleString()}` : ""}
          </p>
        )}
      </div>
    );
  }

  if (level === "citizen") {
    return (
      <div className={cn(className)}>
        <div className="font-mono text-3xl font-medium tracking-tight tabular-nums text-ink">
          {value}
        </div>
        <p className="mt-2 max-w-sm text-meta text-muted">{meaning}</p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className="group text-left"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="font-mono text-3xl font-medium tracking-tight tabular-nums text-ink group-hover:text-accent">
          {value}
        </div>
        <span className="mt-1 block text-xs text-faint group-hover:text-accent">
          {t("learnMore")}
        </span>
      </button>
      {open && (
        <div
          id={id}
          className="absolute left-0 z-20 mt-3 w-72 border border-line bg-surface p-4 enter"
        >
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-faint">{t("meaning")}</dt>
              <dd className="mt-1 text-muted">{meaning}</dd>
            </div>
            <div>
              <dt className="text-faint">{t("method")}</dt>
              <dd className="mt-1 text-muted">{method}</dd>
            </div>
            <div>
              <dt className="text-faint">{t("raw")}</dt>
              <dd className="mt-1 font-mono text-xs text-ink">{source}</dd>
            </div>
            {updatedAt && (
              <div>
                <dt className="text-faint">{t("updated")}</dt>
                <dd className="mt-1 font-mono text-xs text-faint">
                  {new Date(updatedAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
          <button
            type="button"
            className="mt-4 text-xs text-accent"
            onClick={() => setOpen(false)}
          >
            {common("close")}
          </button>
        </div>
      )}
    </div>
  );
}
