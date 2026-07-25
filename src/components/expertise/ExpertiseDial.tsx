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

  /**
   * No telemóvel o dial mostra densidade, não iniciais: mais barras = mais
   * detalhe. "E / O / A" não diz nada a quem chega pela primeira vez.
   */
  const bars: Record<ExpertiseLevel, number> = {
    citizen: 1,
    operator: 2,
    analyst: 3,
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
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLevel(id as ExpertiseLevel);
              }
            }}
            className={`px-1.5 py-1 text-label transition sm:px-2 ${
              active
                ? "bg-accent-dim text-accent"
                : "text-faint hover:text-muted"
            }`}
          >
            {compact ? (
              <>
                <span className="sm:hidden" aria-hidden>
                  <svg viewBox="0 0 14 12" className="h-3 w-3.5">
                    {[0, 1, 2].map((i) => (
                      <rect
                        key={i}
                        x={i * 5}
                        y={10 - (i + 1) * 3}
                        width="3.4"
                        height={(i + 1) * 3}
                        rx="0.6"
                        fill="currentColor"
                        opacity={i < bars[id] ? 1 : 0.22}
                      />
                    ))}
                  </svg>
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
