"use client";

import { MarketMap } from "@/components/board/MarketMap";
import { Sparkline } from "@/components/board/Sparkline";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { AssetQuote, MarketSnapshot } from "@/lib/types";
import { useTranslations } from "next-intl";

/**
 * MERCADO — o mapa completo. O treemap é o protagonista; a tabela por baixo
 * dá o detalhe de quem quer ler números. Cada coluna responde a uma pergunta.
 */
export function MercadoDesk({ market }: { market: MarketSnapshot }) {
  const t = useTranslations("market");
  const { global: g } = market;

  return (
    <div className="mx-auto w-full max-w-[1400px] section-pad pb-16 pt-3 enter-sequence">
      <header className="max-w-2xl pt-2">
        <h1 className="font-display text-display text-ink">{t("title")}</h1>
        <p className="mt-2 text-body text-muted">{t("subtitle")}</p>
      </header>

      {/* Vitals — quatro números, uma linha */}
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-line bg-line sm:grid-cols-4">
        <Stat label={t("totalMcap")} value={formatUsd(g.totalMarketCap, true)} delta={g.marketCapChange24h} />
        <Stat label={t("volume")} value={formatUsd(g.totalVolume, true)} />
        <Stat label={t("dominance")} value={formatPct(g.btcDominance, 1)} />
        <Stat label={t("ethDominance")} value={formatPct(g.ethDominance, 1)} />
      </dl>

      <div className="mt-4">
        <MarketMap assets={market.top} />
      </div>

      {/* Movers — quem mais se mexeu, com contexto */}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        <MoverList title={t("gainers")} items={market.movers.gainers} />
        <MoverList title={t("losers")} items={market.movers.losers} />
      </div>

      {/* Tabela — o detalhe de quem lê números */}
      <section className="mt-6">
        <h2 className="act-head__title">{t("belowFold")}</h2>
        <div className="mt-3 overflow-x-auto rounded-[2px] border border-line">
          <table className="w-full min-w-[760px] border-collapse bg-surface text-meta">
            <thead>
              <tr className="border-b border-line text-left text-label text-faint">
                <th className="px-3 py-2 font-medium">{t("rank")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("price")}</th>
                <th className="px-3 py-2 text-right font-medium">1h</th>
                <th className="px-3 py-2 text-right font-medium">24h</th>
                <th className="px-3 py-2 text-right font-medium">7d</th>
                <th className="px-3 py-2 text-right font-medium">{t("marketCap")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("spark")}</th>
              </tr>
            </thead>
            <tbody>
              {market.top.map((a, i) => (
                <AssetRow key={a.id} asset={a} rank={i + 1} />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <div className="bg-surface px-4 py-3">
      <dt className="text-label text-faint">{label}</dt>
      <dd className="mt-1 font-mono text-data text-ink">
        {value}
        {delta != null && (
          <span className={`ml-2 text-label ${deltaClass(delta)}`}>
            {delta >= 0 ? "▲" : "▼"} {formatPct(delta)}
          </span>
        )}
      </dd>
    </div>
  );
}

function MoverList({
  title,
  items,
}: {
  title: string;
  items: AssetQuote[];
}) {
  return (
    <section className="border border-line bg-surface">
      <h2 className="border-b border-line px-4 py-2.5 text-label text-faint">
        {title}
      </h2>
      <ul>
        {items.map((m) => (
          <li
            key={m.id}
            className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-2 last:border-0"
          >
            <span className="min-w-0 truncate text-meta text-ink">
              <span className="font-mono font-semibold">
                {m.symbol.toUpperCase()}
              </span>{" "}
              <span className="text-muted">{m.name}</span>
            </span>
            <span className={`font-mono text-meta tabular-nums ${deltaClass(m.change24h)}`}>
              {m.change24h >= 0 ? "▲" : "▼"} {formatPct(m.change24h)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AssetRow({ asset, rank }: { asset: AssetQuote; rank: number }) {
  const cells: Array<[number | null | undefined, string]> = [
    [asset.change1h, ""],
    [asset.change24h, ""],
    [asset.change7d, ""],
  ];
  return (
    <tr className="border-b border-line last:border-0 hover:bg-surface-2">
      <td className="px-3 py-2">
        <span className="mr-2 font-mono text-faint tabular-nums">{rank}</span>
        <span className="font-mono font-semibold text-ink">
          {asset.symbol.toUpperCase()}
        </span>{" "}
        <span className="text-muted">{asset.name}</span>
      </td>
      <td className="px-3 py-2 text-right font-mono tabular-nums text-ink">
        {formatUsd(asset.price)}
      </td>
      {cells.map(([v], i) => (
        <td
          key={i}
          className={`px-3 py-2 text-right font-mono tabular-nums ${v == null ? "text-faint" : deltaClass(v)}`}
        >
          {v == null ? "—" : formatPct(v)}
        </td>
      ))}
      <td className="px-3 py-2 text-right font-mono tabular-nums text-muted">
        {formatUsd(asset.marketCap, true)}
      </td>
      <td className="px-3 py-2">
        {asset.sparkline7d && asset.sparkline7d.length > 1 ? (
          <Sparkline
            points={asset.sparkline7d}
            up={(asset.change7d ?? asset.change24h) >= 0}
            height={22}
            className="ml-auto block w-20"
          />
        ) : (
          <span className="block text-right text-faint">—</span>
        )}
      </td>
    </tr>
  );
}
