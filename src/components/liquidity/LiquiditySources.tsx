"use client";

import type { LiquiditySnapshot } from "@/lib/data/liquidity";
import { formatPct, formatUsd, formatUsdMillions } from "@/lib/format";
import { useTranslations } from "next-intl";

type Props = {
  data: LiquiditySnapshot;
  locale: "pt" | "en";
};

type Channel = {
  id: string;
  label: string;
  signed: number | null;
  valueLabel: string;
  detail: string;
  available: boolean;
};

/**
 * Three liquidity origins as divergent bars — not a fake stacked dollar composite.
 * Spot (ETF $), on-chain fuel (stable Δ7d $), leverage (funding / OI — state, not $ flow).
 * Labels use jargon twins — no bare ETF / Funding / OI.
 */
export function LiquiditySources({ data, locale }: Props) {
  const t = useTranslations("jargon");
  const tLiq = useTranslations("liquidity");

  const etfVal =
    data.spot.etfCombined1dUsdM != null
      ? formatUsdMillions(data.spot.etfCombined1dUsdM, 0)
      : "—";
  const etf5 =
    data.spot.etfSum5dUsdM != null
      ? formatUsdMillions(data.spot.etfSum5dUsdM, 0)
      : "—";
  const oiDelta =
    data.leverage.oiChange24hPct != null
      ? formatPct(data.leverage.oiChange24hPct)
      : "—";
  const fundVal =
    data.leverage.fundingBtc != null
      ? `${(data.leverage.fundingBtc * 100).toFixed(4)}%`
      : "—";

  const channels: Channel[] = [
    {
      id: "spot",
      label: t("spot.plain"),
      signed:
        data.spot.available && data.spot.etfCombined1dUsdM != null
          ? data.spot.etfCombined1dUsdM
          : null,
      valueLabel: etfVal,
      detail: t("etf.line", { value: `5d ${etf5}` }),
      available: data.spot.available,
    },
    {
      id: "stables",
      label: tLiq("stablecoinsLabel"),
      signed: data.stables.change7dUsd,
      valueLabel:
        data.stables.change7dUsd != null
          ? `${data.stables.change7dUsd >= 0 ? "+" : "−"}${formatUsd(Math.abs(data.stables.change7dUsd), true)}`
          : "—",
      detail: tLiq("stableDetail", {
        delta:
          data.stables.change7dPct != null
            ? formatPct(data.stables.change7dPct)
            : "—",
        level: formatUsd(data.stables.totalUsd, true),
      }),
      available: true,
    },
    {
      id: "leverage",
      label: t("leverage.plain"),
      signed: data.leverage.fundingBps,
      valueLabel: fundVal,
      detail: `${t("funding.plain")}: ${fundVal} · ${t("oi.plain")} Δ ${oiDelta}`,
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

  const aria = tLiq("sourcesAria");

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
                style={{
                  fontSize: 12,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                }}
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
      <p className="mt-2 text-meta text-faint">{tLiq("sourcesFootnote")}</p>
    </div>
  );
}
