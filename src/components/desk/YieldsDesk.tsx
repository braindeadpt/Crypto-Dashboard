"use client";

import { formatUsd } from "@/lib/format";
import { useTranslations } from "next-intl";

type YieldPool = {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  stablecoin: boolean;
};

export function YieldsDesk({ pools }: { pools: YieldPool[] }) {
  const t = useTranslations("yields");

  return (
    <div className="mx-auto max-w-[1400px] section-pad pb-20 pt-6 enter">
      <header className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        <p className="mt-3 font-mono text-[0.7rem] text-accent">{t("sortNote")}</p>
        <p className="mt-1 font-mono text-[0.7rem] text-faint">{t("filtersNote")}</p>
        <p className="mt-3 font-mono text-[0.7rem] text-warn">{t("disclaimer")}</p>
      </header>

      <div className="mt-6 overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[0.65rem] uppercase tracking-wider text-faint">
              <th className="px-3 py-2">{t("project")}</th>
              <th className="px-3 py-2">{t("symbol")}</th>
              <th className="px-3 py-2">{t("chain")}</th>
              <th className="px-3 py-2">TVL</th>
              <th className="px-3 py-2">APY</th>
              <th className="px-3 py-2">{t("apyBase")}</th>
              <th className="px-3 py-2">{t("apyReward")}</th>
              <th className="px-3 py-2">{t("type")}</th>
            </tr>
          </thead>
          <tbody>
            {pools.map((p) => (
              <tr
                key={p.pool}
                className="border-b border-line/80"
              >
                <td className="px-3 py-2.5 font-medium">{p.project}</td>
                <td className="px-3 py-2.5 font-mono">{p.symbol}</td>
                <td className="px-3 py-2.5 text-muted">{p.chain}</td>
                <td className="px-3 py-2.5 font-mono tabular-nums">
                  {formatUsd(p.tvlUsd, true)}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums text-accent">
                  {p.apy.toFixed(2)}%
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums text-muted">
                  {p.apyBase != null ? `${p.apyBase.toFixed(2)}%` : "—"}
                </td>
                <td className="px-3 py-2.5 font-mono tabular-nums text-warn">
                  {p.apyReward != null && p.apyReward > 0
                    ? `${p.apyReward.toFixed(2)}%`
                    : "—"}
                </td>
                <td className="px-3 py-2.5 font-mono text-[0.7rem] text-faint">
                  {p.stablecoin ? "stable" : "volatile"}
                  {p.apyReward != null && p.apyReward > 0
                    ? ` · ${t("rewardTag")}`
                    : ""}
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
