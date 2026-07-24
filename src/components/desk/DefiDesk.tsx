"use client";

import { ExplainThisNumber } from "@/components/explain/ExplainThisNumber";
import { Link } from "@/i18n/navigation";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { DefiSnapshot } from "@/lib/types";
import { useLocale, useTranslations } from "next-intl";

export function DefiDesk({ data }: { data: DefiSnapshot }) {
  const t = useTranslations("defi");
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-6 md:px-6 enter">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </header>

      <div className="card mt-8 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">
          {t("tvl")}
        </p>
        <ExplainThisNumber
          value={
            <span className="text-4xl font-semibold">
              {formatUsd(data.totalTvl, true)}
            </span>
          }
          meaning={
            locale === "pt"
              ? "Soma aproximada do valor bloqueado nos protocolos rastreados pelo DefiLlama."
              : "Approximate sum of value locked across DefiLlama-tracked protocols."
          }
          method="Sum of protocol TVL from api.llama.fi/protocols"
          source="DefiLlama"
          updatedAt={data.updatedAt}
        />
        {data.change1d != null && (
          <p className={`mt-1 font-mono text-sm ${deltaClass(data.change1d)}`}>
            {formatPct(data.change1d)} {t("change1d")}
          </p>
        )}
        {data.fees24h != null && (
          <p className="mt-3 font-mono text-sm text-muted">
            Fees 24h:{" "}
            <span className="text-ink">{formatUsd(data.fees24h, true)}</span>
            {data.feesChange1d != null && (
              <span className={`ml-2 ${deltaClass(data.feesChange1d)}`}>
                {formatPct(data.feesChange1d)}
              </span>
            )}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-lg font-semibold">{t("protocols")}</h2>
          <ul className="mt-4 divide-y divide-line">
            {data.protocols.map((p) => (
              <li
                key={p.slug}
                className="flex items-baseline justify-between gap-3 py-2.5"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-faint">{p.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{formatUsd(p.tvl, true)}</p>
                  {p.change1d != null && (
                    <p className={`font-mono text-xs ${deltaClass(p.change1d)}`}>
                      {formatPct(p.change1d)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="card p-5">
            <h2 className="text-lg font-semibold">{t("chains")}</h2>
            <ul className="mt-4 divide-y divide-line">
              {data.chains.map((c) => (
                <li key={c.name} className="flex justify-between py-2.5 text-sm">
                  <span>{c.name}</span>
                  <span className="font-mono">{formatUsd(c.tvl, true)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="text-lg font-semibold">{t("stablecoins")}</h2>
            <ul className="mt-4 divide-y divide-line">
              {data.stablecoins.map((s) => (
                <li
                  key={s.symbol}
                  className="flex justify-between py-2.5 text-sm"
                >
                  <span>
                    {s.symbol}{" "}
                    <span className="text-faint">{s.name}</span>
                  </span>
                  <span className="font-mono">
                    {formatUsd(s.circulating, true)}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/atlas/stablecoins"
              className="mt-3 inline-block text-sm font-semibold text-accent"
            >
              Atlas: stablecoins →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
