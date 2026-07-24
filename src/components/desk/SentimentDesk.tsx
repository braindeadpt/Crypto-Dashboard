"use client";

import { LiveLiquidations } from "@/components/board/LiveLiquidations";
import { ExplainThisNumber } from "@/components/explain/ExplainThisNumber";
import { formatUsd } from "@/lib/format";
import type { SentimentSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

export function SentimentDesk({ data }: { data: SentimentSnapshot }) {
  const t = useTranslations("sentiment");
  const locale = useLocale();

  const fngColor =
    data.fearGreed.value <= 30
      ? "text-storm"
      : data.fearGreed.value >= 70
        ? "text-warn"
        : "text-calm";

  return (
    <div className="mx-auto max-w-[1400px] section-pad pb-20 pt-6 enter">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
            {t("fearGreed")}
          </p>
          <ExplainThisNumber
            value={
              <span className={`text-5xl font-semibold ${fngColor}`}>
                {data.fearGreed.value}
              </span>
            }
            meaning={
              locale === "pt"
                ? `Classificação: ${data.fearGreed.classification}. Indicador composto — coincidente, não preditivo.`
                : `Classification: ${data.fearGreed.classification}. Composite gauge — coincident, not predictive.`
            }
            method="Alternative.me composite"
            source="api.alternative.me/fng"
            updatedAt={data.fearGreed.timestamp}
          />
          <p className="mt-2 text-sm text-muted">{data.fearGreed.classification}</p>
        </div>

        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
            {t("funding")}
          </p>
          <ExplainThisNumber
            value={`${(data.funding.rate * 100).toFixed(4)}%`}
            meaning={
              locale === "pt"
                ? `Viés: ${data.funding.bias}. Positivo = longs pagam shorts.`
                : `Bias: ${data.funding.bias}. Positive = longs pay shorts.`
            }
            method="Binance BTCUSDT lastFundingRate"
            source="fapi.binance.com"
            updatedAt={data.updatedAt}
          />
          <p className="mt-2 font-mono text-xs text-muted">
            ~{data.funding.annualized.toFixed(1)}%{" "}
            {locale === "pt" ? "anualizado" : "annualised"}
          </p>
        </div>

        <div className="border border-line bg-surface p-5">
          <p className="font-mono text-[0.65rem] uppercase tracking-wider text-faint">
            {t("openInterest")}
          </p>
          <ExplainThisNumber
            value={formatUsd(data.openInterest.value, true)}
            meaning={
              locale === "pt"
                ? "Estimativa de nocional aberto em perpetuais BTCUSDT."
                : "Estimated open notional on BTCUSDT perpetuals."
            }
            method="Binance openInterest × mark"
            source="fapi.binance.com"
            updatedAt={data.updatedAt}
          />
        </div>
      </div>

      <div className="mt-6">
        <LiveLiquidations href={null} />
      </div>
    </div>
  );
}
