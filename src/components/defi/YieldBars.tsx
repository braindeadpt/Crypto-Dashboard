"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { formatPct, formatUsd } from "@/lib/format";
import type { YieldPool } from "@/lib/data/yields";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(Flip);

/**
 * YIELDS como barras ordenáveis — largura = métrica activa (APY ou TVL),
 * reordenar desloca as linhas fisicamente via GSAP Flip. ⚡ marca APY com
 * recompensa de token (mais volátil — declarado na legenda existente).
 */

type Sort = "apy" | "tvl";
const MAX_ROWS = 12;

export function YieldBars({ pools }: { pools: YieldPool[] }) {
  const t = useTranslations("defi");
  const motion = useMotion();
  const [sort, setSort] = useState<Sort>("apy");

  const rows = useMemo(
    () =>
      [...pools]
        .sort((a, b) => (sort === "apy" ? b.apy - a.apy : b.tvlUsd - a.tvlUsd))
        .slice(0, MAX_ROWS),
    [pools, sort],
  );
  const max = useMemo(
    () =>
      Math.max(
        1,
        ...rows.map((p) => (sort === "apy" ? p.apy : p.tvlUsd)),
      ),
    [rows, sort],
  );

  const rowEls = useRef(new Map<string, HTMLLIElement>());
  const pendingFlip = useRef<Flip.FlipState | null>(null);

  function switchSort(s: Sort) {
    if (s === sort) return;
    if (!motion.subdued) {
      const els = rows
        .map((p) => rowEls.current.get(p.pool))
        .filter((el): el is HTMLLIElement => !!el);
      if (els.length) pendingFlip.current = Flip.getState(els);
    }
    setSort(s);
  }

  useLayoutEffect(() => {
    const pending = pendingFlip.current;
    pendingFlip.current = null;
    if (!pending || motion.subdued) return;
    const tween = Flip.from(pending, {
      duration: 0.55 * motion.cadence,
      ease: "power2.inOut",
      stagger: { each: 0.02, from: "start" },
      absolute: true,
    });
    return () => {
      tween.kill();
    };
  }, [rows, motion.cadence, motion.subdued]);

  return (
    <div>
      <div
        className="flex gap-1 font-mono text-[0.62rem] uppercase tracking-wider"
        role="group"
        aria-label={t("yieldSortLabel")}
      >
        {(["apy", "tvl"] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={sort === s}
            onClick={() => switchSort(s)}
            className={`border px-2 py-1 ${
              sort === s
                ? "border-accent/50 text-accent"
                : "border-line text-faint hover:text-muted"
            }`}
          >
            {s === "apy" ? "APY" : "TVL"}
          </button>
        ))}
      </div>
      <ul className="mt-4 space-y-1.5">
        {rows.map((p) => {
          const w = ((sort === "apy" ? p.apy : p.tvlUsd) / max) * 100;
          return (
            <li
              key={p.pool}
              ref={(el) => {
                if (el) rowEls.current.set(p.pool, el);
                else rowEls.current.delete(p.pool);
              }}
              className="group"
            >
              <div className="flex items-baseline justify-between gap-2 text-meta">
                <span className="min-w-0 truncate">
                  <span className="font-medium text-ink">{p.project}</span>{" "}
                  <span className="text-muted">{p.symbol}</span>
                  {p.apyReward != null && p.apyReward > 0 && (
                    <span className="ml-1 text-[10px] text-faint">⚡</span>
                  )}
                  <span className="ml-2 text-micro text-faint">{p.chain}</span>
                </span>
                <span className="shrink-0 font-mono tabular-nums">
                  <span
                    className={
                      sort === "apy" ? "delta-up" : "text-faint"
                    }
                  >
                    {formatPct(p.apy)}
                  </span>
                  <span
                    className={`ml-3 ${
                      sort === "tvl" ? "text-ink" : "text-faint"
                    }`}
                  >
                    {formatUsd(p.tvlUsd, true)}
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full bg-surface-3">
                <div
                  className="h-full bg-accent transition-[width] duration-500 ease-out"
                  style={{ width: `${w.toFixed(1)}%` }}
                  aria-hidden
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
