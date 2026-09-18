"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { formatUsd } from "@/lib/format";
import type { WalletView } from "@/lib/data/etherscan";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

/**
 * COMPOSIÇÃO — donut animado da carteira consultada.
 * Só entram posições com preço real (usdValue != null); o que não tem
 * preço não inventa fatia — fica declarado no rodapé.
 *
 * FLUXO DE TRANSACÇÕES — entradas e saídas como timeline real:
 * posição = tempo, lado = direcção, tamanho = montante relativo.
 */

const CX = 80;
const CY = 80;
const R = 56;
const THICK = 18;

function polar(r: number, a: number) {
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
}

function arcPath(frac0: number, frac1: number): string {
  const a0 = -Math.PI / 2 + frac0 * Math.PI * 2;
  const a1 = -Math.PI / 2 + frac1 * Math.PI * 2;
  const large = frac1 - frac0 > 0.5 ? 1 : 0;
  const p0 = polar(R, a0);
  const p1 = polar(R, a1);
  return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
}

export function WalletDonut({ view }: { view: WalletView }) {
  const t = useTranslations("carteira");
  const motion = useMotion();
  const svgRef = useRef<SVGSVGElement>(null);

  const slices = [
    ...(view.nativeUsd != null && view.nativeUsd > 0
      ? [{ label: view.nativeSymbol, usd: view.nativeUsd }]
      : []),
    ...view.tokens
      .filter((tok) => tok.usdValue != null && tok.usdValue > 0.01)
      .map((tok) => ({ label: tok.symbol, usd: tok.usdValue! })),
  ]
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 8);

  const total = slices.reduce((s, x) => s + x.usd, 0);
  const unpriced = view.tokens.filter(
    (tok) => tok.usdValue == null || tok.usdValue <= 0.01,
  ).length;

  const palette = [
    "var(--accent)",
    "var(--accent-2)",
    "var(--up)",
    "var(--down)",
    "var(--warn)",
    "var(--calm)",
    "var(--unsettled)",
    "var(--muted)",
  ];

  useEffect(() => {
    const root = svgRef.current;
    if (!root || motion.subdued) return;
    const arcs = root.querySelectorAll<SVGPathElement>("[data-slice]");
    const anims = [...arcs].map((el, i) =>
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.85, transformOrigin: `${CX}px ${CY}px` },
        {
          opacity: 1,
          scale: 1,
          duration: 0.5 * motion.cadence,
          delay: i * 0.05 * motion.cadence,
          ease: "power2.out",
        },
      ),
    );
    return () => anims.forEach((a) => a.kill());
  }, [view.address, view.chainId, motion.subdued, motion.cadence]);

  if (!slices.length || total <= 0) {
    return (
      <p className="mt-3 text-sm text-muted">{t("donutEmpty")}</p>
    );
  }

  const fracs = slices.reduce<[number, number][]>(
    (acc, s) => {
      const prev = acc.length ? acc[acc.length - 1]![1] : 0;
      acc.push([prev / total, (prev + s.usd) / total]);
      return acc;
    },
    [],
  );

  return (
    <figure className="m-0">
      <div className="grid items-center gap-4 sm:grid-cols-[160px_1fr]">
        <svg
          ref={svgRef}
          viewBox="0 0 160 160"
          className="h-auto w-40"
          role="img"
          aria-label={t("donutAria")}
        >
          {slices.map((s, i) => {
            const [f0, f1] = fracs[i]!;
            return (
              <path
                key={s.label}
                data-slice
                d={arcPath(f0, Math.max(f1, f0 + 0.002))}
                fill="none"
                stroke={palette[i % palette.length]}
                strokeWidth={THICK}
              />
            );
          })}
          <text
            x={CX}
            y={CY + 3}
            textAnchor="middle"
            fill="var(--ink)"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {formatUsd(total, true)}
          </text>
        </svg>
        <ul className="space-y-1">
          {slices.map((s, i) => (
            <li
              key={s.label}
              className="flex items-baseline gap-2 text-meta"
            >
              <span
                className="inline-block h-2 w-2 shrink-0"
                style={{ backgroundColor: palette[i % palette.length] }}
                aria-hidden
              />
              <span className="text-ink">{s.label}</span>
              <span className="ml-auto font-mono tabular-nums text-muted">
                {((s.usd / total) * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
      <figcaption className="mt-2 text-meta text-faint">
        {t("donutNote")}
        {unpriced > 0 ? ` ${t("donutUnpriced", { n: unpriced })}` : ""}
      </figcaption>
    </figure>
  );
}

export function TxTimeline({ view }: { view: WalletView }) {
  const t = useTranslations("carteira");
  const locale = useLocale();
  const isPt = locale === "pt";
  const motion = useMotion();
  const svgRef = useRef<SVGSVGElement>(null);

  const items = view.activity
    .map((a) => ({ ...a, ts: Date.parse(a.time) }))
    .filter((a) => Number.isFinite(a.ts))
    .sort((a, b) => a.ts - b.ts);

  useEffect(() => {
    const root = svgRef.current;
    if (!root || motion.subdued) return;
    const marks = root.querySelectorAll("[data-tx]");
    const anims = [...marks].map((el, i) =>
      gsap.fromTo(
        el,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3 * motion.cadence,
          delay: i * 0.06 * motion.cadence,
        },
      ),
    );
    return () => anims.forEach((a) => a.kill());
  }, [view.address, view.chainId, motion.subdued, motion.cadence]);

  if (items.length < 2) {
    return <p className="mt-3 text-sm text-muted">{t("timelineEmpty")}</p>;
  }

  const W = 640;
  const H = 110;
  const t0 = items[0]!.ts;
  const t1 = items[items.length - 1]!.ts;
  const span = Math.max(1, t1 - t0);
  const maxAmt = Math.max(...items.map((a) => a.amount), 0.0001);
  const x = (ts: number) => 14 + ((ts - t0) / span) * (W - 28);
  const cy = 52;

  return (
    <figure className="m-0">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        role="img"
        aria-label={t("timelineAria")}
      >
        <line
          x1={10}
          y1={cy}
          x2={W - 10}
          y2={cy}
          stroke="var(--line)"
          strokeWidth={1}
        />
        {items.map((a, i) => {
          const px = x(a.ts);
          const size = 3 + Math.sqrt(a.amount / maxAmt) * 10;
          const up = a.direction === "in";
          const down = a.direction === "out";
          const y = up ? cy - 14 - size / 2 : down ? cy + 14 + size / 2 : cy;
          return (
            <g key={`${a.hash}-${i}`} data-tx>
              {a.direction !== "self" && (
                <line
                  x1={px}
                  y1={cy}
                  x2={px}
                  y2={y}
                  stroke={up ? "var(--up)" : "var(--down)"}
                  strokeWidth={1}
                  opacity={0.5}
                />
              )}
              <circle
                cx={px}
                cy={y}
                r={size / 2}
                fill={
                  a.direction === "self"
                    ? "var(--muted)"
                    : up
                      ? "var(--up)"
                      : "var(--down)"
                }
                opacity={a.failed ? 0.35 : 0.9}
              >
                <title>
                  {`${new Date(a.ts).toLocaleDateString(isPt ? "pt-PT" : "en-US")} · ${a.direction} · ${a.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${a.symbol}${a.failed ? " · falhou" : ""}`}
                </title>
              </circle>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-meta text-faint">
        {t("timelineNote", { n: items.length })}
      </figcaption>
    </figure>
  );
}
