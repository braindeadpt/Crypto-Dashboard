"use client";

import { ExplainThisNumber } from "@/components/explain/ExplainThisNumber";
import { Link } from "@/i18n/navigation";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { MarketSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

export function MarketDesk({ market }: { market: MarketSnapshot }) {
  const t = useTranslations("market");
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 enter">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </header>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="card p-5">
          <HeroAsset
            title={t("btc")}
            price={market.btc.price}
            change={market.btc.change24h}
            meaning={
              locale === "pt"
                ? "Preço agregado USD do Bitcoin."
                : "Aggregated USD Bitcoin price."
            }
            updatedAt={market.updatedAt}
          />
        </div>
        <div className="card p-5">
          <HeroAsset
            title={t("eth")}
            price={market.eth.price}
            change={market.eth.change24h}
            meaning={
              locale === "pt"
                ? "Preço agregado USD do Ethereum."
                : "Aggregated USD Ethereum price."
            }
            updatedAt={market.updatedAt}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <Stat
            label={t("totalMcap")}
            value={formatUsd(market.global.totalMarketCap, true)}
            meaning={
              locale === "pt"
                ? "Soma das capitalizações dos activos rastreados."
                : "Sum of tracked asset market caps."
            }
            method="CoinGecko /global"
            updatedAt={market.updatedAt}
          />
        </div>
        <div className="card p-4">
          <Stat
            label={t("dominance")}
            value={`${market.global.btcDominance.toFixed(2)}%`}
            meaning={
              locale === "pt"
                ? "Peso do BTC na capitalização total."
                : "BTC share of total market cap."
            }
            method="market_cap_percentage.btc"
            updatedAt={market.updatedAt}
          />
        </div>
        <div className="card p-4">
          <Stat
            label={t("volume24h")}
            value={formatUsd(market.global.totalVolume, true)}
            meaning={
              locale === "pt"
                ? "Volume total reportado em 24h."
                : "Reported total 24h volume."
            }
            method="CoinGecko /global"
            updatedAt={market.updatedAt}
          />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">{t("movers")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card p-5">
            <MoverList
              title={t("gainers")}
              items={market.movers.gainers}
              locale={locale}
            />
          </div>
          <div className="card p-5">
            <MoverList
              title={t("losers")}
              items={market.movers.losers}
              locale={locale}
            />
          </div>
        </div>
      </section>

      <section className="card mt-6 overflow-hidden p-5">
        <h2 className="text-xl font-semibold">{t("belowFold")}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-faint">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">{t("rank")}</th>
                <th className="py-2 pr-2 font-medium">{t("price")}</th>
                <th className="py-2 pr-2 font-medium">{t("change24h")}</th>
                <th className="py-2 font-medium">{t("marketCap")}</th>
              </tr>
            </thead>
            <tbody>
              {market.top.map((row) => (
                <tr key={row.id} className="border-b border-line/80">
                  <td className="py-2.5 pr-2 text-faint">{row.rank}</td>
                  <td className="py-2.5 pr-2">
                    <span className="font-medium">{row.symbol}</span>
                    <span className="ml-2 text-faint">{row.name}</span>
                  </td>
                  <td className="py-2.5 pr-2 font-mono tabular-nums">
                    {formatUsd(row.price)}
                  </td>
                  <td
                    className={`py-2.5 pr-2 font-mono tabular-nums ${deltaClass(row.change24h)}`}
                  >
                    {formatPct(row.change24h)}
                  </td>
                  <td className="py-2.5 font-mono tabular-nums text-muted">
                    {formatUsd(row.marketCap, true)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function HeroAsset({
  title,
  price,
  change,
  meaning,
  updatedAt,
}: {
  title: string;
  price: number;
  change: number;
  meaning: string;
  updatedAt: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-faint">
        {title}
      </p>
      <ExplainThisNumber
        value={<span className="text-3xl font-semibold">{formatUsd(price)}</span>}
        meaning={meaning}
        method="CoinGecko /coins/markets"
        source="api.coingecko.com"
        updatedAt={updatedAt}
        className="mt-2"
      />
      <p className={`mt-2 font-mono text-sm tabular-nums ${deltaClass(change)}`}>
        {formatPct(change)} 24h
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  meaning,
  method,
  updatedAt,
}: {
  label: string;
  value: string;
  meaning: string;
  method: string;
  updatedAt: string;
}) {
  return (
    <div>
      <p className="text-sm text-muted">{label}</p>
      <ExplainThisNumber
        value={<span className="text-xl">{value}</span>}
        meaning={meaning}
        method={method}
        source="CoinGecko"
        updatedAt={updatedAt}
        className="mt-1"
      />
    </div>
  );
}

function MoverList({
  title,
  items,
  locale,
}: {
  title: string;
  items: MarketSnapshot["movers"]["gainers"];
  locale: string;
}) {
  const t = useTranslations("market");
  return (
    <div>
      <h3 className="text-sm text-muted">{title}</h3>
      <ul className="mt-2 divide-y divide-line">
        {items.map((m) => (
          <li key={m.id} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-2">
              <Link
                href={`/caso/${m.caseId}`}
                className="text-lg font-semibold hover:text-accent"
              >
                {m.symbol}
              </Link>
              <span className={`font-mono text-sm tabular-nums ${deltaClass(m.change24h)}`}>
                {formatPct(m.change24h)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted">
              <span className="text-faint">{t("withCause")}: </span>
              {locale === "pt" ? m.causePt : m.causeEn}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
