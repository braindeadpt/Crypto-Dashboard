"use client";

import type { SectorRow } from "@/lib/data/sectors";
import { squarify } from "@/lib/viz/squarify";
import { formatPct, formatUsd } from "@/lib/format";
import { useId, useMemo } from "react";

type Props = {
  sectors: SectorRow[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  locale: "pt" | "en";
  width?: number;
  height?: number;
};

/**
 * Sector capital map — area = market cap, fill + glyph = 24h direction.
 * Custom SVG treemap (no chart library).
 */
export function SectorTreemap({
  sectors,
  selectedId,
  onSelect,
  locale,
  width = 720,
  height = 380,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const rects = useMemo(() => {
    const items = sectors.map((s) => ({ id: s.id, value: s.marketCap }));
    const layout = squarify(items, width, height);
    const byId = new Map(sectors.map((s) => [s.id, s]));
    return layout.map((r) => ({ ...r, sector: byId.get(r.id)! }));
  }, [sectors, width, height]);

  const aria =
    locale === "pt"
      ? "Mapa de sectores: área proporcional à capitalização; cor e seta indicam variação a 24 horas."
      : "Sector map: area proportional to market cap; colour and arrow show 24h change.";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto w-full border border-line bg-surface"
      role="img"
      aria-label={aria}
    >
      <title>{aria}</title>
      <defs>
        <pattern
          id={`sec-down-${uid}`}
          width="5"
          height="5"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="5"
            stroke="var(--down)"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      {rects.map(({ id, x, y, w, h, sector }) => {
        if (!sector || w < 2 || h < 2) return null;
        const up = sector.change24h >= 0;
        const selected = selectedId === id;
        const showLabel = w > 56 && h > 36;
        const showMini = w > 40 && h > 24;
        return (
          <g
            key={id}
            className="cursor-pointer"
            onClick={() => onSelect(selected ? null : id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(selected ? null : id);
              }
            }}
            aria-pressed={selected}
            aria-label={`${sector.name}: ${formatUsd(sector.marketCap, true)}, ${formatPct(sector.change24h)}`}
          >
            <rect
              x={x + 0.5}
              y={y + 0.5}
              width={Math.max(0, w - 1)}
              height={Math.max(0, h - 1)}
              fill={
                up
                  ? "color-mix(in srgb, var(--up) 18%, var(--surface))"
                  : `url(#sec-down-${uid})`
              }
              stroke={selected ? "var(--accent)" : "var(--line-strong)"}
              strokeWidth={selected ? 2 : 1}
            />
            {!up && (
              <rect
                x={x + 0.5}
                y={y + 0.5}
                width={Math.max(0, w - 1)}
                height={Math.max(0, h - 1)}
                fill="color-mix(in srgb, var(--down) 12%, transparent)"
                pointerEvents="none"
              />
            )}
            {showMini && (
              <text
                x={x + 6}
                y={y + 16}
                fill="var(--ink)"
                style={{
                  fontSize: showLabel ? 11 : 9,
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                }}
                className="pointer-events-none"
              >
                {(up ? "▲ " : "▼ ") +
                  (showLabel
                    ? sector.name.length > 18
                      ? sector.name.slice(0, 16) + "…"
                      : sector.name
                    : sector.name.slice(0, 8))}
              </text>
            )}
            {showLabel && (
              <text
                x={x + 6}
                y={y + 32}
                fill="var(--muted)"
                style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                className="pointer-events-none"
              >
                {formatUsd(sector.marketCap, true)} · {formatPct(sector.change24h)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
