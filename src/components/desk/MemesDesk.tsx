"use client";

import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import type { AssetQuote } from "@/lib/types";
import { useTranslations } from "next-intl";

export function MemesDesk({
  memes,
  frenzyNote,
}: {
  memes: AssetQuote[];
  frenzyNote: string;
}) {
  const t = useTranslations("memes");

  return (
    <div className="mx-auto max-w-[1400px] section-pad pb-20 pt-6 enter">
      <header className="max-w-2xl">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        <p className="mt-3 border border-accent/25 bg-accent-dim px-3 py-2 font-mono text-[0.72rem] text-accent">
          {frenzyNote}
        </p>
      </header>

      <div className="mt-6 overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[0.65rem] uppercase tracking-wider text-faint">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">{t("asset")}</th>
              <th className="px-3 py-2">{t("price")}</th>
              <th className="px-3 py-2">24h</th>
              <th className="px-3 py-2">{t("volume")}</th>
              <th className="px-3 py-2">{t("mcap")}</th>
            </tr>
          </thead>
          <tbody>
            {memes.map((m, i) => (
              <tr key={m.id} className="border-b border-line/80">
                <td className="px-3 py-2.5 font-mono text-faint">{i + 1}</td>
                <td className="px-3 py-2.5">
                  <span className="font-medium">{m.symbol}</span>
                  <span className="ml-2 text-faint">{m.name}</span>
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums">
                  {formatUsd(m.price)}
                </td>
                <td
                  className={`px-3 py-2.5 font-mono tabular-nums ${deltaClass(m.change24h)}`}
                >
                  {formatPct(m.change24h)}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums text-muted">
                  {formatUsd(m.volume24h, true)}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums text-muted">
                  {formatUsd(m.marketCap, true)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[0.65rem] text-faint">{t("source")}</p>
    </div>
  );
}
