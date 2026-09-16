"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { treemapBinary } from "@/lib/viz/squarify";
import {
  fundingForAsset,
  medianTurnover,
  turnoverRatio,
  type MapLayers,
} from "@/lib/data/mapLayers";
import type { AssetQuote } from "@/lib/types";
import { cn, formatPct, formatUsd } from "@/lib/format";

/**
 * Mapa do mercado — treemap dos maiores activos.
 * Tamanho = market cap. A cor é alternável (R4): variação de preço
 * (1h/24h/7d), funding anualizado dos perpétuos, volume relativo à
 * mediana do grupo, e rotação de sector (Δ quota temática 7d).
 * Tiles são divs posicionadas: a geometria transiciona em CSS quando os
 * dados mudam. Lacunas ficam neutras e declaradas — nunca estimadas.
 */

const MAX_TILES = 40;
const CHANGE_CLAMP = 8;
const FUNDING_CLAMP = 60;
const SECTOR_CLAMP = 2;

type Window = "1h" | "24h" | "7d";
type ColorLayer = "price" | "funding" | "volume" | "sector";

function windowChange(a: AssetQuote, w: Window): number {
  if (w === "1h") return a.change1h ?? 0;
  if (w === "7d") return a.change7d ?? 0;
  return a.change24h;
}

function divergingBg(value: number, clamp: number): string {
  const v = Math.max(-clamp, Math.min(clamp, value));
  const strength = Math.min(90, 10 + (Math.abs(v) / clamp) * 80);
  const dir = v >= 0 ? "var(--up)" : "var(--down)";
  return `color-mix(in oklab, ${dir} ${strength}%, var(--surface))`;
}

/** Volume: uma só cor, intensidade = quão acima da mediana do grupo. */
function volumeBg(ratio: number): string {
  const heat = Math.max(0, Math.log2(ratio));
  const strength = Math.min(85, 12 + heat * 36);
  return `color-mix(in oklab, var(--accent) ${strength}%, var(--surface))`;
}

function tileForeground(bg: "strong" | "weak"): string {
  return bg === "strong" ? "var(--bg)" : "var(--fg)";
}

export function MarketMap({
  assets,
  layers,
  tall = false,
  showTitle = true,
}: {
  assets: AssetQuote[];
  /** Camadas de cor alternativas (R4). Sem layers → só a janela de preço. */
  layers?: MapLayers | null;
  /** Versão alta para a entrada — o mapa respira mais. */
  tall?: boolean;
  /** false quando o pai já tem cabeçalho de acto — evita título duplicado. */
  showTitle?: boolean;
}) {
  const t = useTranslations("marketMap");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<AssetQuote | null>(null);
  const [win, setWin] = useState<Window>("24h");
  const [layer, setLayer] = useState<ColorLayer>("price");

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const top = useMemo(
    () => assets.filter((a) => a.marketCap > 0).slice(0, MAX_TILES),
    [assets],
  );

  const tiles = useMemo(() => {
    const rects = treemapBinary(
      top.map((a) => ({ id: a.id, value: a.marketCap })),
      size.w,
      size.h,
    );
    return top.map((a, i) => ({ asset: a, rect: rects[i] })).filter((r) => r.rect);
  }, [top, size]);

  const median = useMemo(() => medianTurnover(top), [top]);

  /** Cobertura honesta por camada — quantos tiles têm dado real. */
  const coverage = useMemo(
    () => ({
      funding: layers
        ? top.filter((a) => fundingForAsset(a.symbol, layers.funding) != null)
            .length
        : 0,
      sector: layers ? top.filter((a) => layers.sector[a.id]).length : 0,
      total: top.length,
    }),
    [layers, top],
  );

  /** Valor + cor do tile conforme a camada activa. Null → neutro declarado. */
  function tileLook(a: AssetQuote): {
    text: string;
    bg: string;
    fg: "strong" | "weak";
    dir: number | null;
  } {
    if (layer === "funding") {
      const v = layers ? fundingForAsset(a.symbol, layers.funding) : null;
      if (v == null)
        return { text: "—", bg: "var(--surface)", fg: "weak", dir: null };
      return {
        text: formatPct(v, 1),
        bg: divergingBg(v, FUNDING_CLAMP),
        fg: Math.abs(v) >= FUNDING_CLAMP * 0.6 ? "strong" : "weak",
        dir: Math.sign(v),
      };
    }
    if (layer === "volume") {
      const r = turnoverRatio(a, median);
      if (r == null)
        return { text: "—", bg: "var(--surface)", fg: "weak", dir: null };
      return {
        text: `×${r >= 9.95 ? r.toFixed(0) : r.toFixed(1)}`,
        bg: volumeBg(r),
        fg: Math.log2(Math.max(r, 0.125)) >= 1.5 ? "strong" : "weak",
        dir: null,
      };
    }
    if (layer === "sector") {
      const s = layers?.sector[a.id];
      if (!s || s.shareDelta7d == null)
        return { text: "—", bg: "var(--surface)", fg: "weak", dir: null };
      const v = s.shareDelta7d;
      return {
        text: `${v >= 0 ? "+" : ""}${v.toFixed(2)}pp`,
        bg: divergingBg(v, SECTOR_CLAMP),
        fg: Math.abs(v) >= SECTOR_CLAMP * 0.6 ? "strong" : "weak",
        dir: Math.sign(v),
      };
    }
    const v = windowChange(a, win);
    return {
      text: formatPct(v),
      bg: divergingBg(v, CHANGE_CLAMP),
      fg: Math.abs(v) >= 3.5 ? "strong" : "weak",
      dir: Math.sign(v),
    };
  }

  const shown = active ?? assets.find((a) => a.id === "bitcoin") ?? null;
  const shownSector = shown ? layers?.sector[shown.id] : undefined;
  const layerNote =
    layer === "funding"
      ? t("noteFunding", { covered: coverage.funding, total: coverage.total })
      : layer === "volume"
        ? t("noteVolume")
        : layer === "sector"
          ? t("noteSector", {
              covered: coverage.sector,
              total: coverage.total,
            })
          : null;

  return (
    <figure className="m-0" style={{ viewTransitionName: "market-map" }}>
      <p className="mb-2 flex flex-wrap items-baseline justify-between gap-3 text-label text-faint">
        {showTitle ? <span>{t("title")}</span> : <span />}
        <span className="flex flex-wrap items-center gap-2">
          {layers && (
            <span
              className="flex overflow-hidden rounded-[2px] border border-line"
              role="group"
              aria-label={t("layerAria")}
            >
              {(["price", "funding", "volume", "sector"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLayer(l)}
                  aria-pressed={layer === l}
                  className={cn(
                    "px-2 py-0.5 font-mono text-[10px] transition",
                    layer === l
                      ? "bg-accent text-bg"
                      : "bg-surface text-faint hover:text-fg",
                  )}
                >
                  {t(`layer.${l}`)}
                </button>
              ))}
            </span>
          )}
          {layer === "price" && (
            <span className="hidden tabular-nums sm:inline">
              {t("hintShort")}
            </span>
          )}
          {layer === "price" && (
            <span
              className="flex overflow-hidden rounded-[2px] border border-line"
              role="group"
              aria-label={t("windowAria")}
            >
              {(["1h", "24h", "7d"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWin(w)}
                  aria-pressed={win === w}
                  className={cn(
                    "px-2 py-0.5 font-mono text-[10px] transition",
                    win === w
                      ? "bg-accent text-bg"
                      : "bg-surface text-faint hover:text-fg",
                  )}
                >
                  {w}
                </button>
              ))}
            </span>
          )}
        </span>
      </p>
      <div
        ref={wrapRef}
        className={cn(
          "relative w-full overflow-hidden border-y border-line bg-base",
          tall ? "h-[380px] sm:h-[560px]" : "h-[320px] sm:h-[420px]",
        )}
        role="img"
        aria-label={t(`aria.${layer}`)}
      >
        {tiles.map(({ asset, rect }) => {
          const { x, y, w, h } = rect;
          const look = tileLook(asset);
          const both = w > 68 && h > 46;
          const symbolOnly = !both && w > 30 && h > 24;
          return (
            <button
              key={asset.id}
              type="button"
              onMouseEnter={() => setActive(asset)}
              onFocus={() => setActive(asset)}
              onClick={() => setActive(asset)}
              aria-label={`${asset.name} ${look.text}`}
              className="absolute border border-bg/70 text-left outline-none transition-[left,top,width,height,background-color] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-accent"
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
                backgroundColor: look.bg,
                color: tileForeground(look.fg),
              }}
            >
              {both && (
                <span className="block px-1.5 py-1 leading-none">
                  <span className="block font-mono text-[11px] font-semibold tracking-tight">
                    {asset.symbol.toUpperCase()}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] tabular-nums opacity-90">
                    {look.text}
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
            {layer === "price" && (
              <span
                className={cn(
                  "tabular-nums",
                  windowChange(shown, win) >= 0 ? "delta-up" : "delta-down",
                )}
              >
                {windowChange(shown, win) >= 0 ? "▲" : "▼"}{" "}
                {formatPct(windowChange(shown, win))}
              </span>
            )}
            {layer !== "price" && (
              <span
                className={cn(
                  "tabular-nums",
                  tileLook(shown).dir == null
                    ? "text-fg"
                    : tileLook(shown).dir! >= 0
                      ? "delta-up"
                      : "delta-down",
                )}
              >
                {tileLook(shown).dir != null &&
                  (tileLook(shown).dir! >= 0 ? "▲ " : "▼ ")}
                {tileLook(shown).text}
              </span>
            )}
            {layer === "sector" && shownSector && (
              <span className="truncate">{shownSector.name}</span>
            )}
            <span className="tabular-nums">
              {t("cap")} {formatUsd(shown.marketCap, true)}
            </span>
            <span className="ml-auto hidden sm:inline">
              {layerNote ?? t("hint")}
            </span>
          </>
        ) : (
          <span>{layerNote ?? t("hint")}</span>
        )}
      </figcaption>
    </figure>
  );
}
