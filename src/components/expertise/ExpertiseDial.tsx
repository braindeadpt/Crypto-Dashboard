"use client";

import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { EXPERTISE_LEVELS, type ExpertiseLevel } from "@/lib/expertise";
import { useTranslations } from "next-intl";

/**
 * Expertise dial — changes real density across the product (not cosmetic).
 */
export function ExpertiseDial({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("expertise");
  const { level, setLevel } = useExpertise();

  const short: Record<ExpertiseLevel, string> = {
    citizen: "E",
    operator: "O",
    analyst: "A",
  };

  return (
    <div
      className="flex items-center gap-0.5 border border-line bg-surface p-0.5 sm:gap-1"
      role="radiogroup"
      aria-label={t("label")}
      title={t("hint")}
    >
      {EXPERTISE_LEVELS.map((id) => {
        const active = level === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={t(`levels.${id}`)}
            onClick={() => setLevel(id as ExpertiseLevel)}
            className={`px-1.5 py-1 text-label transition sm:px-2 ${
              active
                ? "bg-accent-dim text-accent"
                : "text-faint hover:text-muted"
            }`}
          >
            {compact ? (
              <>
                <span className="sm:hidden" aria-hidden>
                  {short[id]}
                </span>
                <span className="site-chrome__dial-label">{t(`levels.${id}`)}</span>
              </>
            ) : (
              t(`levels.${id}`)
            )}
          </button>
        );
      })}
    </div>
  );
}
