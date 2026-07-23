"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import type { MarketSnapshot, RegimeResult, SentimentSnapshot } from "@/lib/types";
import { DashboardPreview } from "./DashboardPreview";

type Props = {
  market: MarketSnapshot;
  sentiment: SentimentSnapshot;
  regime: RegimeResult;
};

export function HeroCommand({ market, sentiment, regime }: Props) {
  const t = useTranslations("landing.hero");

  return (
    <section className="relative overflow-hidden border-b border-line">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          background:
            "radial-gradient(900px 420px at 70% 10%, rgba(61,255,168,0.07), transparent 55%), radial-gradient(600px 300px at 10% 80%, rgba(122,162,255,0.05), transparent 50%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 section-pad py-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12 lg:py-16">
        <div className="flex flex-col justify-center enter">
          <p className="eyebrow text-accent">{t("eyebrow")}</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/mercado"
              className="inline-flex items-center border border-accent/40 bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition hover:bg-accent/90"
            >
              {t("ctaPrimary")}
            </Link>
            <a
              href="#workflows"
              className="inline-flex items-center border border-line bg-surface px-5 py-2.5 text-sm font-medium text-ink transition hover:border-line-strong hover:bg-surface-2"
            >
              {t("ctaSecondary")}
            </a>
          </div>
          <p className="mt-6 font-mono text-[0.68rem] uppercase tracking-[0.1em] text-faint">
            {t("trust")}
          </p>
        </div>

        <div className="enter" style={{ animationDelay: "80ms" }}>
          <DashboardPreview
            market={market}
            sentiment={sentiment}
            regime={regime}
          />
        </div>
      </div>
    </section>
  );
}
