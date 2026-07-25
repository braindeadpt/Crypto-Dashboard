"use client";

import type { SectorRotation } from "@/lib/data/sectors";
import { useMemo } from "react";

type Props = {
  rotation: SectorRotation[];
  /** 7 or 30 */
  window: 7 | 30;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  locale: "pt" | "en";
};

/**
 * Rotation view — relative share change vs prior period.
 * Answers "where is capital moving" without inventing causality.
 */
export function SectorRotationChart({
  rotation,
  window,
  selectedId,
  onSelect,
  locale,
}: Props) {
  const rows = useMemo(() => {
    const key = window === 7 ? "shareDelta7d" : "shareDelta30d";
    return [...rotation]
      .filter((r) => r[key] != null)
      .sort((a, b) => Math.abs(b[key]!) - Math.abs(a[key]!))
      .slice(0, 14)
      .sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
  }, [rotation, window]);

  const maxAbs = Math.max(
    0.01,
    ...rows.map((r) =>
      Math.abs((window === 7 ? r.shareDelta7d : r.shareDelta30d) ?? 0),
    ),
  );

  const sampleDays = rows[0]?.sampleDays ?? 0;
  const incomplete =
    (window === 7 && sampleDays < 7) || (window === 30 && sampleDays < 25);

  const w = 640;
  const rowH = 22;
  const h = Math.max(120, rows.length * rowH + 28);
  const mid = 280;
  const barMax = 200;

  const aria =
    locale === "pt"
      ? `Rotação de sectores a ${window} dias: barras = variação da quota relativa no mapa temático.`
      : `Sector rotation over ${window} days: bars = change in relative share on the thematic map.`;

  if (!rows.length) {
    return (
      <p className="border border-line bg-surface p-4 text-meta text-muted">
        {locale === "pt"
          ? incomplete
            ? `Ainda só ${sampleDays} dias de histórico — a rotação a ${window}d fica em espera até a série crescer.`
            : "Sem pontos de rotação calculáveis neste momento."
          : incomplete
            ? `Only ${sampleDays} days of history — ${window}d rotation waits until the series grows.`
            : "No rotation points computable right now."}
      </p>
    );
  }

  return (
    <div>
      {incomplete && (
        <p className="mb-2 text-meta text-warn">
          {locale === "pt"
            ? `Amostra ${sampleDays}d — leitura a ${window}d parcial.`
            : `${sampleDays}d sample — ${window}d reading is partial.`}
        </p>
      )}
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
          {locale === "pt" ? "perde quota" : "losing share"}
        </text>
        <text
          x={mid + 8}
          y={14}
          textAnchor="start"
          fill="var(--faint)"
          style={{ fontSize: 9, fontFamily: "var(--font-mono)" }}
        >
          {locale === "pt" ? "ganha quota" : "gaining share"}
        </text>
        {rows.map((r, i) => {
          const delta =
            (window === 7 ? r.shareDelta7d : r.shareDelta30d) ?? 0;
          const barW = (Math.abs(delta) / maxAbs) * barMax;
          const y = 22 + i * rowH;
          const up = delta >= 0;
          const selected = selectedId === r.id;
          return (
            <g
              key={r.id}
              className="cursor-pointer"
              onClick={() => onSelect(selected ? null : r.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(selected ? null : r.id);
                }
              }}
              aria-label={`${r.name}: ${delta >= 0 ? "+" : ""}${delta.toFixed(2)} pp`}
            >
              <text
                x={8}
                y={y + 12}
                fill={selected ? "var(--accent)" : "var(--muted)"}
                style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              >
                {r.name.length > 22 ? r.name.slice(0, 20) + "…" : r.name}
              </text>
              <rect
                x={up ? mid : mid - barW}
                y={y + 3}
                width={barW}
                height={12}
                fill={
                  up
                    ? "color-mix(in srgb, var(--up) 55%, transparent)"
                    : "color-mix(in srgb, var(--down) 55%, transparent)"
                }
                stroke={selected ? "var(--accent)" : "var(--line)"}
                strokeWidth={selected ? 1.5 : 0.5}
              />
              <text
                x={up ? mid + barW + 6 : mid - barW - 6}
                y={y + 12}
                textAnchor={up ? "start" : "end"}
                fill="var(--ink)"
                style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
              >
                {(up ? "▲ +" : "▼ ") + delta.toFixed(2)} pp
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
