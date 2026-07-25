"use client";

import type { LiquiditySnapshot } from "@/lib/data/liquidity";
import { formatPct, formatUsd, formatUsdMillions } from "@/lib/format";

type Props = {
  data: LiquiditySnapshot;
  locale: "pt" | "en";
};

type Channel = {
  id: string;
  label: string;
  /** Signed magnitude for divergent bar (−1…1 after normalize) */
  signed: number | null;
  valueLabel: string;
  detail: string;
  available: boolean;
};

/**
 * Three liquidity origins as divergent bars — not a fake stacked dollar composite.
 * Spot (ETF $), on-chain fuel (stable Δ7d $), leverage (funding / OI — state, not $ flow).
 */
export function LiquiditySources({ data, locale }: Props) {
  const channels: Channel[] = [
    {
      id: "spot",
      label: locale === "pt" ? "Spot institucional" : "Institutional spot",
      signed:
        data.spot.available && data.spot.etfCombined1dUsdM != null
          ? data.spot.etfCombined1dUsdM
          : null,
      valueLabel:
        data.spot.etfCombined1dUsdM != null
          ? formatUsdMillions(data.spot.etfCombined1dUsdM, 0)
          : "—",
      detail:
        locale === "pt"
          ? `ETF BTC+ETH · 5d ${
              data.spot.etfSum5dUsdM != null
                ? formatUsdMillions(data.spot.etfSum5dUsdM, 0)
                : "—"
            }`
          : `BTC+ETH ETF · 5d ${
              data.spot.etfSum5dUsdM != null
                ? formatUsdMillions(data.spot.etfSum5dUsdM, 0)
                : "—"
            }`,
      available: data.spot.available,
    },
    {
      id: "stables",
      label: locale === "pt" ? "Stablecoins (on-chain)" : "Stablecoins (on-chain)",
      signed: data.stables.change7dUsd,
      valueLabel:
        data.stables.change7dUsd != null
          ? `${data.stables.change7dUsd >= 0 ? "+" : "−"}${formatUsd(Math.abs(data.stables.change7dUsd), true)}`
          : "—",
      detail:
        locale === "pt"
          ? `Δ7d ${
              data.stables.change7dPct != null
                ? formatPct(data.stables.change7dPct)
                : "—"
            } · nível ${formatUsd(data.stables.totalUsd, true)}`
          : `7d Δ ${
              data.stables.change7dPct != null
                ? formatPct(data.stables.change7dPct)
                : "—"
            } · level ${formatUsd(data.stables.totalUsd, true)}`,
      available: true,
    },
    {
      id: "leverage",
      label: locale === "pt" ? "Alavancagem" : "Leverage",
      // Use funding bps as signed pressure (not dollars — honest)
      signed: data.leverage.fundingBps,
      valueLabel:
        data.leverage.fundingBtc != null
          ? `${(data.leverage.fundingBtc * 100).toFixed(4)}%`
          : "—",
      detail:
        locale === "pt"
          ? `Funding BTC · OI Δ ${
              data.leverage.oiChange24hPct != null
                ? formatPct(data.leverage.oiChange24hPct)
                : "—"
            }`
          : `BTC funding · OI Δ ${
              data.leverage.oiChange24hPct != null
                ? formatPct(data.leverage.oiChange24hPct)
                : "—"
            }`,
      available: data.leverage.available,
    },
  ];

  const maxAbs = Math.max(
    0.01,
    ...channels
      .filter((c) => c.signed != null)
      .map((c) => Math.abs(c.signed!)),
  );

  const w = 640;
  const rowH = 56;
  const h = 24 + channels.length * rowH;
  const mid = 300;
  const barMax = 180;

  const aria =
    locale === "pt"
      ? "Origens de liquidez: spot ETF, variação de oferta de stablecoins, e estado de alavancagem."
      : "Liquidity origins: ETF spot, stablecoin supply change, and leverage state.";

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full border border-line bg-surface"
        role="img"
        aria-label={aria}
      >
        <title>{aria}</title>
        <line
          x1={mid}
          x2={mid}
          y1={8}
          y2={h - 8}
          stroke="var(--line-strong)"
          strokeWidth="1"
        />
        <text
          x={mid - 8}
          y={14}
          textAnchor="end"
          fill="var(--faint)"
          style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
        >
          {locale === "pt" ? "saída / curto" : "out / short"}
        </text>
        <text
          x={mid + 8}
          y={14}
          textAnchor="start"
          fill="var(--faint)"
          style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
        >
          {locale === "pt" ? "entrada / longo" : "in / long"}
        </text>

        {channels.map((ch, i) => {
          const y = 28 + i * rowH;
          const signed = ch.signed;
          const barW =
            signed != null ? (Math.abs(signed) / maxAbs) * barMax : 0;
          const up = (signed ?? 0) >= 0;
          return (
            <g key={ch.id}>
              <text
                x={12}
                y={y + 14}
                fill="var(--ink)"
                style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 500 }}
              >
                {ch.label}
              </text>
              <text
                x={12}
                y={y + 30}
                fill="var(--faint)"
                style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
              >
                {ch.detail}
              </text>
              {!ch.available || signed == null ? (
                <text
                  x={mid + 12}
                  y={y + 22}
                  fill="var(--muted)"
                  style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                >
                  —
                </text>
              ) : (
                <>
                  <rect
                    x={up ? mid : mid - barW}
                    y={y + 8}
                    width={barW}
                    height={16}
                    fill={
                      up
                        ? "color-mix(in srgb, var(--up) 50%, transparent)"
                        : "color-mix(in srgb, var(--down) 50%, transparent)"
                    }
                    stroke="var(--line)"
                    strokeWidth="0.5"
                  />
                  <text
                    x={up ? mid + barW + 8 : mid - barW - 8}
                    y={y + 20}
                    textAnchor={up ? "start" : "end"}
                    fill="var(--ink)"
                    style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}
                  >
                    {(up ? "▲ " : "▼ ") + ch.valueLabel}
                  </text>
                </>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-meta text-faint">
        {locale === "pt"
          ? "Barras não são comparáveis em dólares entre canais: alavancagem é estado (funding/OI), não fluxo monetário."
          : "Bars are not dollar-comparable across channels: leverage is state (funding/OI), not a cash flow."}
      </p>
    </div>
  );
}
