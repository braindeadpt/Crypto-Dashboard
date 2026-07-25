"use client";

import { ExpertiseGate } from "@/components/expertise/ExpertiseGate";
import { Regua } from "@/components/instrument/Regua";
import { LiquiditySources } from "@/components/liquidity/LiquiditySources";
import { StableSupplyChart } from "@/components/liquidity/StableSupplyChart";
import type { LiquiditySnapshot } from "@/lib/data/liquidity";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  initial: LiquiditySnapshot;
  /** When true, skip page-level H1 (used inside /fluxos). */
  embedded?: boolean;
};

export function LiquidityDesk({ initial, embedded = false }: Props) {
  const t = useTranslations("liquidity");
  const locale = useLocale();
  const loc = locale === "pt" ? "pt" : "en";
  const reading = loc === "pt" ? initial.readingPt : initial.readingEn;
  const s = initial.stables;

  return (
    <div className={`mx-auto w-full max-w-[1400px] section-pad pb-16 ${embedded ? "pt-4" : "pt-6"} enter`}>
      {!embedded && (
        <header className="max-w-3xl">
          <p className="text-label text-faint">{t("eyebrow")}</p>
          <h1 className="mt-1 font-display text-display text-ink">{t("title")}</h1>
          <ExpertiseGate section="readings">
            <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
          </ExpertiseGate>
        </header>
      )}
      {embedded && (
        <h2 className="font-display text-title text-ink">{t("title")}</h2>
      )}

      <ExpertiseGate section="readings">
        <section className="panel-hero mt-5 p-4 md:p-5" aria-live="polite">
          <p className="text-label text-faint">{t("readingLabel")}</p>
          <p className="mt-2 max-w-3xl text-body text-ink text-balance">{reading}</p>
          {initial.stale && (
            <p className="mt-2 text-meta text-warn">{t("stale")}</p>
          )}
        </section>
      </ExpertiseGate>

      {/* Stablecoin supply hero metrics */}
      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label={t("totalSupply")}
          value={formatUsd(s.totalUsd, true)}
          hint={t("totalHint")}
        />
        <MetricCard
          label={t("peggedUsd")}
          value={formatUsd(s.peggedUsd, true)}
          hint={t("peggedHint")}
        />
        <MetricCard
          label={t("change7d")}
          value={
            s.change7dPct != null ? formatPct(s.change7dPct) : "—"
          }
          change={s.change7dPct}
          hint={
            s.change7dUsd != null
              ? `${s.change7dUsd >= 0 ? "+" : "−"}${formatUsd(Math.abs(s.change7dUsd), true)}`
              : undefined
          }
        />
        <MetricCard
          label={t("change30d")}
          value={
            s.change30dPct != null ? formatPct(s.change30dPct) : "—"
          }
          change={s.change30dPct}
          hint={
            s.change30dUsd != null
              ? `${s.change30dUsd >= 0 ? "+" : "−"}${formatUsd(Math.abs(s.change30dUsd), true)}`
              : undefined
          }
        />
      </section>

      <section className="mt-5">
        <h2 className="text-label text-faint">{t("supplyTitle")}</h2>
        <p className="mb-2 text-meta text-muted">{t("supplyHint")}</p>
        <StableSupplyChart series={s.series} locale={loc} />
        <div className="mt-3 max-w-xl">
          <p className="text-label text-faint">{t("reguaLabel")}</p>
          <Regua
            context={s.context}
            variant="expanded"
            locale={loc}
            className="mt-2"
          />
        </div>
        <p className="mt-2 text-meta text-faint">{t("sourceStables")}</p>
      </section>

      {/* Consolidated origins */}
      <section className="mt-8">
        <h2 className="text-label text-faint">{t("originsTitle")}</h2>
        <p className="mb-2 text-meta text-muted">{t("originsHint")}</p>
        <LiquiditySources data={initial} locale={loc} />
      </section>

      {/* Top stables */}
      <ExpertiseGate section="liquidityTop">
      {s.top.length > 0 && (
        <section className="mt-8">
          <h2 className="text-label text-faint">{t("topTitle")}</h2>
          <ul className="mt-2 divide-y divide-line border border-line">
            {s.top.map((row) => (
              <li
                key={row.symbol}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span>
                  <span className="font-medium">{row.symbol}</span>
                  <span className="ml-2 text-faint">{row.name}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {formatUsd(row.circulatingUsd, true)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      </ExpertiseGate>

      {/* Omitted exchange flows */}
      <section className="panel-secondary mt-8 p-4">
        <h2 className="text-label text-faint">{t("omittedTitle")}</h2>
        <p className="mt-2 max-w-2xl text-meta text-muted">
          {loc === "pt"
            ? initial.exchangeFlowsNotePt
            : initial.exchangeFlowsNoteEn}
        </p>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  hint,
  change,
}: {
  label: string;
  value: string;
  hint?: string;
  change?: number | null;
}) {
  return (
    <div className="border border-line bg-surface p-3">
      <p className="text-label text-faint">{label}</p>
      <p
        className={`mt-1 text-data font-medium tabular-nums ${
          change != null ? deltaClass(change) : "text-ink"
        }`}
      >
        {change != null && change !== 0
          ? `${change >= 0 ? "▲ " : "▼ "}${value}`
          : value}
      </p>
      {hint && <p className="mt-1 text-meta text-faint">{hint}</p>}
    </div>
  );
}
