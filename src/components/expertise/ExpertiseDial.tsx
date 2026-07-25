"use client";

import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { usePathname, useRouter } from "@/i18n/navigation";
import { EXPERTISE_LEVELS, type ExpertiseLevel } from "@/lib/expertise";
import { useTranslations } from "next-intl";

/**
 * Expertise dial — changes real density across the product (not cosmetic).
 * Analista: atalho directo ao /instrumento (não redireccionamos todas as
 * visitas a Agora — o ritual e o E3 N1+N2 vivem lá).
 */
export function ExpertiseDial({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("expertise");
  const { level, setLevel } = useExpertise();
  const router = useRouter();
  const pathname = usePathname();

  const bars: Record<ExpertiseLevel, number> = {
    citizen: 1,
    operator: 2,
    analyst: 3,
  };

  function choose(id: ExpertiseLevel) {
    setLevel(id);
    if (id === "analyst" && pathname !== "/instrumento") {
      router.push("/instrumento");
    }
  }

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
            onClick={() => choose(id as ExpertiseLevel)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                choose(id as ExpertiseLevel);
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
