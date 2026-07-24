"use client";

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

      <section className="mt-6 border border-warn/35 bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-semibold">{t("liquidationWeather")}</h2>
          <span className="chip text-warn border-warn/40">{t("estimated")}</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-muted">{t("estimatedNote")}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="border border-line bg-bg-elevated p-4">
            <p className="font-mono text-[0.62rem] uppercase text-faint">Bias</p>
            <p className="mt-1 text-xl font-semibold">
              {data.liquidationWeather.bias === "long"
                ? t("longBias")
                : data.liquidationWeather.bias === "short"
                  ? t("shortBias")
                  : t("neutral")}
            </p>
          </div>
          <div className="border border-line bg-bg-elevated p-4">
            <p className="font-mono text-[0.62rem] uppercase text-faint">
              Intensity
            </p>
            <p className="mt-1 font-mono text-xl">
              {data.liquidationWeather.intensity}/100
            </p>
          </div>
          <div className="border border-line bg-bg-elevated p-4">
            <p className="font-mono text-[0.62rem] uppercase text-faint">
              Force notional
            </p>
            <p className="mt-1 font-mono text-xl">
              {formatUsd(data.liquidationWeather.recentForceNotional, true)}
            </p>
          </div>
        </div>

        <LiquidationChart zones={data.liquidationWeather.zones} />
      </section>
    </div>
  );
}

function LiquidationChart({
  zones,
}: {
  zones: SentimentSnapshot["liquidationWeather"]["zones"];
}) {
  const sample = zones.filter((_, i) => i % 2 === 0).slice(0, 32);
  const maxD = Math.max(...sample.map((z) => z.density), 0.01);

  return (
    <div className="mt-4 border border-line bg-bg-elevated p-4">
      <p className="mb-4 font-mono text-[0.62rem] uppercase tracking-wider text-faint">
        Zonas de alavancagem estimadas (modelo)
      </p>
      <div className="flex h-40 items-end gap-1">
        {sample.map((z, i) => (
          <div
            key={`${z.price}-${i}`}
            className="flex-1"
            title={`$${z.price.toFixed(0)} · ${z.side}`}
          >
            <div
              className={z.side === "long" ? "bg-down/70" : "bg-up/70"}
              style={{ height: `${(z.density / maxD) * 100}%`, minHeight: 4 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] text-faint">
        <span>${sample[0]?.price.toFixed(0)}</span>
        <span>${sample[sample.length - 1]?.price.toFixed(0)}</span>
      </div>
    </div>
  );
}
