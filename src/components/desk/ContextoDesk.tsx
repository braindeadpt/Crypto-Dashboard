"use client";

import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { useExpertise } from "@/components/expertise/ExpertiseProvider";
import { AtlasIndex } from "@/components/desk/AtlasIndex";
import { CycleDesk } from "@/components/desk/CycleDesk";
import { PortugalDesk } from "@/components/desk/PortugalDesk";
import { Link } from "@/i18n/navigation";
import { ATLAS } from "@/lib/content/atlas";
import type { CycleSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  cycle: CycleSnapshot | null;
};

/**
 * CONTEXTO — cycle, learning atlas, Portugal/regulation.
 * Educational bridge toward future Carteira (portfolio) — not built yet.
 */
export function ContextoDesk({ cycle }: Props) {
  const t = useTranslations("contexto");
  const locale = useLocale();
  const { show } = useExpertise();

  return (
    <div className="enter">
      <div className="mx-auto w-full max-w-[1400px] section-pad pt-6">
        <header className="max-w-3xl">
          <p className="text-label text-faint">{t("eyebrow")}</p>
          <h1 className="mt-1 font-display text-display text-ink">{t("title")}</h1>
          <ExpertiseGate section="readings">
            <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
          </ExpertiseGate>
        </header>

        <ExpertiseGate section="readings">
          <p className="mt-4 max-w-2xl border border-line bg-surface p-3 text-meta text-muted">
            {t("walletBridge")}
          </p>
        </ExpertiseGate>
      </div>

      {cycle ? (
        <CycleDesk cycle={cycle} />
      ) : (
        <p className="section-pad pb-8 text-muted">{t("noCycle")}</p>
      )}

      <div className="border-t border-line">
        {show("atlasFull") ? (
          <AtlasIndex />
        ) : (
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 md:px-6">
            <h2 className="font-display text-title text-ink">{t("atlasTitle")}</h2>
            <ExpertiseGate section="readings">
              <p className="mt-1 text-meta text-muted">{t("atlasHint")}</p>
            </ExpertiseGate>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {ATLAS.filter((c) => c.level === "beginner")
                .slice(0, 6)
                .map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/atlas/${c.slug}`}
                      className="block border border-line bg-surface p-3 hover:border-accent/40"
                    >
                      <span className="font-medium">
                        {locale === "pt" ? c.titlePt : c.titleEn}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      <ExpertiseGate section="contextoPortugal">
        <div className="border-t border-line">
          <PortugalDesk />
        </div>
      </ExpertiseGate>
    </div>
  );
}
