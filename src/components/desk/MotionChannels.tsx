"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { AmbientField } from "@/components/ambient/AmbientField";
import { useTranslations } from "next-intl";

/**
 * O Maestro ao vivo — referência em /estilo.
 * Mostra os quatro canais derivados das leituras reais do dia, com o campo
 * ambiente a reagir à Agitação. Dados verdadeiros, nunca sintéticos.
 */
export function MotionChannels() {
  const t = useTranslations("style");
  const m = useMotion();

  const channels: { id: string; value: string; hint: string }[] = [
    {
      id: "cadence",
      value: m.cadence.toFixed(2),
      hint: t("maestro.cadenceHint"),
    },
    {
      id: "agitation",
      value: m.agitation.toFixed(2),
      hint: t("maestro.agitationHint"),
    },
    {
      id: "temperature",
      value: (m.temperature >= 0 ? "+" : "") + m.temperature.toFixed(2),
      hint: t("maestro.temperatureHint"),
    },
    {
      id: "subdued",
      value: m.subdued ? t("maestro.subduedOn") : t("maestro.subduedOff"),
      hint: t("maestro.subduedHint"),
    },
  ];

  return (
    <div className="border border-line bg-surface shadow-[var(--elev-1)]">
      <div className="grid gap-px border-b border-line bg-line sm:grid-cols-4">
        {channels.map((c) => (
          <div key={c.id} className="bg-surface p-4">
            <p className="text-label text-faint">{t(`maestro.${c.id}`)}</p>
            <p className="mt-1 font-mono text-data tabular-nums text-ink">
              {c.value}
            </p>
            <p className="mt-2 text-micro text-faint">{c.hint}</p>
          </div>
        ))}
      </div>
      <div className="relative h-28 overflow-hidden">
        <AmbientField />
        <p className="absolute bottom-2 left-3 text-micro text-faint">
          {t("maestro.fieldNote")}
        </p>
      </div>
    </div>
  );
}
