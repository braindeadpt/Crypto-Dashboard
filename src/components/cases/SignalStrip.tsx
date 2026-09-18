"use client";

import { useMotion } from "@/lib/motion/useMotion";
import type { EvidenceChip } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

/**
 * Signals that coincide with the move — chips, not a causal claim.
 */
export function SignalStrip({
  evidence,
  className = "",
}: {
  evidence: EvidenceChip[];
  className?: string;
}) {
  const t = useTranslations("case");
  const locale = useLocale();
  const motion = useMotion();
  if (!evidence.length) return null;

  return (
    <div className={className}>
      <p className="text-label text-faint">{t("signalsTitle")}</p>
      <p className="mt-0.5 text-meta text-faint">{t("signalsHint")}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {evidence.map((e, i) => {
          const tone =
            e.tone === "up"
              ? "border-up/40 text-up"
              : e.tone === "down"
                ? "border-down/40 text-down"
                : e.tone === "warn"
                  ? "border-warn/40 text-warn"
                  : "border-line text-muted";
          return (
            <li
              key={e.id}
              className={`border bg-bg-elevated px-2.5 py-1.5 ${tone} ${
                motion.subdued ? "" : "signal-chip"
              }`}
              style={
                motion.subdued
                  ? undefined
                  : {
                      animationDuration: `${0.35 * motion.cadence}s`,
                      animationDelay: `${i * 0.09 * motion.cadence}s`,
                    }
              }
            >
              <span className="block text-label">
                {locale === "pt" ? e.label : e.labelEn}
              </span>
              <span className="font-mono text-data tabular-nums">{e.value}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
