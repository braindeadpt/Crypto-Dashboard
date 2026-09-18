"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import gsap from "gsap";
import { treemapBinary } from "@/lib/viz/squarify";
import {
  fundingForAsset,
  medianTurnover,
  sparklineVolatility,
  turnoverRatio,
  type MapLayers,
} from "@/lib/data/mapLayers";
import { useMotion } from "@/lib/motion/useMotion";
import type { AssetQuote } from "@/lib/types";
import { cn, formatPct, formatUsd } from "@/lib/format";

/**
 * Mapa do mercado — treemap dos maiores activos, agora vivo.
 *
 * Área = capitalização · Cor = camada activa · MOVIMENTO = volatilidade
 * própria de cada activo (sparkline 7d), modulada pela Agitação do Maestro.
 * Um canto agitado do mercado vibra visivelmente; activos sem série ficam
 * estáticos e assinalados — nunca animados a fingir.
 *
 * Transições físicas via GSAP (FLIP manual em transform): as células
 * deslocam-se entre estados em vez de re-renderizarem — a continuidade
 * espacial deixa o olho seguir o mesmo activo de camada para camada.
 */

const MAX_TILES = 40;
const CHANGE_CLAMP = 8;
const FUNDING_CLAMP = 60;
const SECTOR_CLAMP = 2;
/** Quantas células vibram em simultâneo (as maiores com série). */
const MAX_VIBRANT = 18;

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
  return bg === "strong" ? "var(--bg)" : "var(--ink)";
}

export function MarketMap({
  assets,
  layers,
  tall = false,
  screen = false,
  showTitle = true,
  liveTicks,
}: {
  assets: AssetQuote[];
  /** Camadas de cor alternativas (R4). Sem layers → só a janela de preço. */
  layers?: MapLayers | null;
  /** Versão alta para a entrada — o mapa respira mais. */
  tall?: boolean;
  /** Ecrã inteiro — /mercado, onde o mapa é o protagonista da página. */
  screen?: boolean;
  /** false quando o pai já tem cabeçalho de acto — evita título duplicado. */
  showTitle?: boolean;
  /** Ticks ao vivo por símbolo de perp (BTCUSDT…) — flash na célula. */
  liveTicks?: Partial<
    Record<string, { price: number; lastUpdate: number }>
  >;
}) {
  const t = useTranslations("marketMap");
  const wrapRef = useRef<HTMLDivElement>(null);
  const motion = useMotion();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [active, setActive] = useState<AssetQuote | null>(null);
  const [win, setWin] = useState<Window>("24h");
  const [layer, setLayer] = useState<ColorLayer>("price");
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* A vibração pausa quando o mapa sai do ecrã — animar o que ninguém vê
     é custo sem informação. */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      setOnScreen(entry.isIntersecting);
    });
    io.observe(el);
    return () => io.disconnect();
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

  /** Volatilidade própria por activo, normalizada à coorte (0..1). */
  const volById = useMemo(() => {
    const raw = new Map<string, number>();
    let max = 0;
    for (const a of top) {
      const v = sparklineVolatility(a.sparkline7d);
      if (v != null) {
        raw.set(a.id, v);
        if (v > max) max = v;
      }
    }
    const norm = new Map<string, number>();
    if (max > 0) for (const [id, v] of raw) norm.set(id, Math.min(1, v / max));
    return norm;
  }, [top]);

  /** As células que vibram: as maiores com série, até ao limite. */
  const vibrantIds = useMemo(() => {
    if (motion.subdued || !onScreen) return new Set<string>();
    const eligible = tiles
      .filter(({ asset, rect }) => volById.has(asset.id) && rect.w * rect.h > 2600)
      .sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h)
      .slice(0, MAX_VIBRANT);
    return new Set(eligible.map(({ asset }) => asset.id));
  }, [tiles, volById, motion.subdued, onScreen]);

  /* FLIP manual — quando a geometria muda (resize, refresh de dados), as
     células deslocam-se fisicamente em transform, sem thrash de layout. */
  const prevRects = useRef<Map<string, { x: number; y: number; w: number; h: number }>>(
    new Map(),
  );
  const tileEls = useRef<Map<string, HTMLButtonElement>>(new Map());
  useLayoutEffect(() => {
    const prev = prevRects.current;
    const anims: gsap.core.Tween[] = [];
    for (const { asset, rect } of tiles) {
      const el = tileEls.current.get(asset.id);
      const p = prev.get(asset.id);
      if (!el || !p) continue;
      const dx = p.x - rect.x;
      const dy = p.y - rect.y;
      const sx = rect.w > 0 ? p.w / rect.w : 1;
      const sy = rect.h > 0 ? p.h / rect.h : 1;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) {
        continue;
      }
      anims.push(
        gsap.fromTo(
          el,
          { x: dx, y: dy, scaleX: sx, scaleY: sy, transformOrigin: "0 0" },
          {
            x: 0,
            y: 0,
            scaleX: 1,
            scaleY: 1,
            duration: 0.55 * motion.cadence,
            ease: "power2.out",
            overwrite: "auto",
          },
        ),
      );
    }
    prevRects.current = new Map(
      tiles.map(({ asset, rect }) => [asset.id, { ...rect }]),
    );
    return () => anims.forEach((a) => a.kill());
  }, [tiles, motion.cadence]);

  /* Sweep de camada — ao trocar a vista, um pulso varre o campo a partir
     do maior tile: a continuidade espacial deixa o olho seguir o activo. */
  const prevLayer = useRef<{ layer: ColorLayer; win: Window }>({ layer, win });
  useLayoutEffect(() => {
    const changed =
      prevLayer.current.layer !== layer || prevLayer.current.win !== win;
    prevLayer.current = { layer, win };
    if (!changed || motion.subdued) return;
    // pulso: cada célula mergulha brevemente em opacity, a partir do centro
    // do maior tile — o olho segue a onda e não perde o activo de vista
    const big = tiles.reduce(
      (m, { rect }) => (rect.w * rect.h > m.w * m.h ? rect : m),
      { x: 0, y: 0, w: 0, h: 0 },
    );
    const cx = big.x + big.w / 2;
    const cy = big.y + big.h / 2;
    const els = tiles
      .map(({ asset, rect }) => ({
        el: tileEls.current.get(asset.id),
        d: Math.hypot(rect.x + rect.w / 2 - cx, rect.y + rect.h / 2 - cy),
      }))
      .filter((r) => r.el)
      .sort((a, b) => a.d - b.d);
    if (!els.length) return;
    const tween = gsap.fromTo(
      els.map((r) => r.el!),
      { opacity: 0.55 },
      {
        opacity: 1,
        duration: 0.5 * motion.cadence,
        ease: "power1.out",
        stagger: { each: 0.012, from: "start" },
        overwrite: "auto",
      },
    );
    return () => {
      tween.kill();
    };
  }, [layer, win, tiles, motion.cadence, motion.subdued]);

  /* Flash de tick — evento real chega, a célula golpeia uma vez.
     Directo no DOM (classe + timeout): sem re-render por tick. */
  const lastTickAt = useRef<Record<string, number>>({});
  useEffect(() => {
    if (!liveTicks) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (const [sym, q] of Object.entries(liveTicks)) {
      if (!q?.lastUpdate) continue;
      const prev = lastTickAt.current[sym] ?? 0;
      if (q.lastUpdate <= prev) continue;
      lastTickAt.current[sym] = q.lastUpdate;
      const asset = top.find(
        (a) => `${a.symbol.toUpperCase()}USDT` === sym,
      );
      if (!asset) continue;
      const el = tileEls.current.get(asset.id);
      if (!el) continue;
      const cls = (q.price ?? 0) >= (asset.price ?? 0)
        ? "tape-flash-up"
        : "tape-flash-down";
      el.classList.remove("tape-flash-up", "tape-flash-down");
      void el.offsetWidth; // re-arm da animação
      el.classList.add(cls);
      timers.push(
        setTimeout(() => el.classList.remove(cls), 400),
      );
    }
    return () => timers.forEach(clearTimeout);
  }, [liveTicks, top]);

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
                      : "bg-surface text-faint hover:text-ink",
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
                      : "bg-surface text-faint hover:text-ink",
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
          "relative w-full overflow-hidden border-y border-line bg-bg",
          screen
            ? "h-[68vh] min-h-[420px]"
            : tall
              ? "h-[380px] sm:h-[560px]"
              : "h-[320px] sm:h-[420px]",
        )}
        role="img"
        aria-label={t(`aria.${layer}`)}
      >
        {tiles.map(({ asset, rect }) => {
          const { x, y, w, h } = rect;
          const look = tileLook(asset);
          const big = w > 190 && h > 140;
          const both = !big && w > 68 && h > 46;
          const symbolOnly = !big && !both && w > 30 && h > 24;
          const vol = volById.get(asset.id);
          const vibrates = vibrantIds.has(asset.id) && vol != null;
          const noVol = vol == null;
          return (
            <button
              key={asset.id}
              ref={(el) => {
                if (el) tileEls.current.set(asset.id, el);
                else tileEls.current.delete(asset.id);
              }}
              type="button"
              onMouseEnter={() => setActive(asset)}
              onFocus={() => setActive(asset)}
              onClick={() => setActive(asset)}
              aria-label={`${asset.name} ${look.text}`}
              className={cn(
                "absolute border border-bg/70 text-left outline-none transition-[background-color] duration-500 ease-out focus-visible:ring-2 focus-visible:ring-accent",
              )}
              style={{
                left: x,
                top: y,
                width: w,
                height: h,
                backgroundColor: look.bg,
                color: tileForeground(look.fg),
              }}
            >
              <span
                className={cn("block", vibrates && "map-tile-vibe")}
                style={
                  vibrates
                    ? ({
                        "--vib-amp": `${(0.6 + vol * 2.2 * motion.agitation).toFixed(2)}px`,
                        "--vib-dur": `${(2.8 - vol * 1.9).toFixed(2)}s`,
                      } as React.CSSProperties)
                    : undefined
                }
              >
              {big && (
                <span className="block px-3 py-2.5 leading-tight">
                  <span className="block font-mono text-[13px] font-semibold tracking-tight">
                    {asset.symbol.toUpperCase()}
                    {noVol && (
                      <span className="ml-1 opacity-40" title={t("noVol")}>·</span>
                    )}
                  </span>
                  <span className="mt-1 block font-mono text-sm font-medium tabular-nums opacity-90">
                    {look.text}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] tabular-nums opacity-70">
                    {formatUsd(asset.price)}
                  </span>
                </span>
              )}
              {both && (
                <span className="block px-1.5 py-1 leading-none">
                  <span className="block font-mono text-[11px] font-semibold tracking-tight">
                    {asset.symbol.toUpperCase()}
                    {noVol && <span className="ml-0.5 opacity-40">·</span>}
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
              </span>
            </button>
          );
        })}
      </div>
      <figcaption className="mt-2 flex min-h-6 flex-wrap items-center gap-x-4 gap-y-1 border-t border-line pt-2 font-mono text-[11px] text-faint">
        {shown ? (
          <>
            <span className="font-semibold text-ink">{shown.name}</span>
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
                    ? "text-ink"
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
