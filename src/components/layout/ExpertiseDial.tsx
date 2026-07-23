"use client";

import { useExpertise } from "@/components/providers/ExpertiseProvider";
import { cn } from "@/lib/format";
import type { ExpertiseLevel } from "@/lib/types";
import { useTranslations } from "next-intl";

const LEVELS: ExpertiseLevel[] = ["citizen", "operator", "analyst"];

export function ExpertiseDial() {
  const t = useTranslations("expertise");
  const { level, setLevel } = useExpertise();

  return (
    <div
      className="inline-flex border border-line bg-surface p-0.5"
      role="group"
      aria-label={t("label")}
    >
      {LEVELS.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLevel(l)}
          title={t(`${l}Hint`)}
          className={cn(
            "px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-wider transition",
            level === l
              ? "bg-accent text-bg"
              : "text-faint hover:text-ink",
          )}
        >
          {t(l)}
        </button>
      ))}
    </div>
  );
}
