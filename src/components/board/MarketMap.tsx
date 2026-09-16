"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { treemapBinary } from "@/lib/viz/squarify";
import type { AssetQuote } from "@/lib/types";
import { cn, formatPct, formatUsd } from "@/lib/format";

/**
 * Mapa do mercado — treemap dos maiores activos.
 * Tamanho = market cap, cor = Δ24h (menta/coral com intensidade pelo
 * movimento). Tiles são divs posicionadas: a geometria transiciona em
 * CSS quando os dados mudam. Sem biblioteca de charts.
 */

const MAX_TILES = 40;
const CHANGE_CLAMP = 8;

function tileBackground(change: number): string {
  const chg = Math.max(-CHANGE_CLAMP, Math.min(CHANGE_CLAMP, change));
  const strength = Math.min(90, 10 + Math.abs(chg) * 10);
  const dir = chg >= 0 ? "var(--up)" : "var(--down)";
  return `color-mix(in oklab, ${dir} ${strength}%, var(--surface))`;
}

function tileForeground(change: number): string {
  return Math.abs(change) >= 3.5 ? "var(--bg)" : "var(--fg)";
}

export function MarketMap({ assets }: { assets: AssetQuote[] }) {
  const t = useTranslations("marketMap");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<AssetQuote | null>(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const tiles = useMemo(() => {
    const top = assets
      .filter((a) => a.marketCap > 0)
      .slice(0, MAX_TILES);
    const rects = treemapBinary(
      top.map((a) => ({ id: a.id, value: a.marketCap })),
      size.w,
      size.h,
    );
    return top.map((a, i) => ({ asset: a, rect: rects[i] })).filter((r) => r.rect);
  }, [assets, size]);

  const shown = active ?? assets.find((a) => a.id === "bitcoin") ?? null;

  return (
    <figure className="m-0">
      <p className="mb-2 flex items-baseline justify-between text-label text-faint">
        <span>{t("title")}</span>
        <span className="tabular-nums">{t("hintShort")}</span>
      </p>
      <div
        ref={wrapRef}
        className="relative h-[320px] w-full overflow-hidden rounded-[2px] border border-line bg-base sm:h-[420px]"
        role="img"
        aria-label={t("aria")}
      >
        {tiles.map(({ asset, rect }) => {
          const { x, y, w, h } = rect;
          const both = w > 68 && h > 46;
          const symbolOnly = !both && w > 30 && h > 24;
          return (
            <button
              key={asset.id}
              type="button"
              onMouseEnter={() => setActive(asset)}
              onFocus={() => setActive(asset)}
              onClick={() => setActive(asset)}
              aria-label={`${asset.name} ${formatPct(asset.change24h)}`}
              className="absolute border border-bg/70 text-left outline-none transition-[left,top,width,height,background-color] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
                backgroundColor: tileBackground(asset.change24h),
                color: tileForeground(asset.change24h),
              }}
            >
              {both && (
                <span className="block px-1.5 py-1 leading-none">
                  <span className="block font-mono text-[11px] font-semibold tracking-tight">
                    {asset.symbol.toUpperCase()}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] tabular-nums opacity-90">
                    {formatPct(asset.change24h)}
                  </span>
                </span>
              )}
              {symbolOnly && (
                <span className="block truncate px-1 pt-1 font-mono text-[9px] font-semibold leading-none">
                  {asset.symbol.toUpperCase()}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <figcaption className="mt-2 flex min-h-6 flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-[11px] text-faint">
        {shown ? (
          <>
            <span className="font-semibold text-fg">{shown.name}</span>
            <span className="tabular-nums">{formatUsd(shown.price)}</span>
            <span
              className={cn(
                "tabular-nums",
                shown.change24h >= 0 ? "delta-up" : "delta-down",
              )}
            >
              {shown.change24h >= 0 ? "▲" : "▼"} {formatPct(shown.change24h)}
            </span>
            <span className="tabular-nums">
              {t("cap")} {formatUsd(shown.marketCap, true)}
            </span>
            <span className="ml-auto hidden sm:inline">{t("hint")}</span>
          </>
        ) : (
          <span>{t("hint")}</span>
        )}
      </figcaption>
    </figure>
  );
}
