"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { deltaClass, formatPct, formatUsd } from "@/lib/format";
import gsap from "gsap";
import { useLayoutEffect, useMemo, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

/**
 * ANEL DE PROTOCOLOS — os órgãos do sistema em arcos concêntricos.
 *
 * Cada anel é um protocolo; o comprimento do arco é a sua quota no conjunto
 * mostrado; a cor segue o Δ1d real. Ao reordenar (quota ↔ movimento) os
 * anéis trocam de raio fisicamente — o atributo `d` faz tween entre a
 * geometria antiga e a nova, à cadência do Maestro.
 */

const CX = 160;
const CY = 160;
const R0 = 138;
const STEP = 13;
const ARC_W = 9;
const MAX_RINGS = 10;

type Proto = {
  slug: string;
  name: string;
  tvl: number;
  change1d: number | null;
  category: string;
};

function arcPath(r: number, frac: number): string {
  const f = Math.max(0.004, Math.min(1, frac));
  const a0 = -Math.PI / 2;
  const a1 = a0 + f * Math.PI * 2;
  const large = f > 0.5 ? 1 : 0;
  return `M ${CX + r * Math.cos(a0)} ${CY + r * Math.sin(a0)} ` +
    `A ${r} ${r} 0 ${large} 1 ${CX + r * Math.cos(a1)} ${CY + r * Math.sin(a1)}`;
}

export function ProtocolRing({
  protocols,
  sort,
}: {
  protocols: Proto[];
  sort: "tvl" | "move";
}) {
  const t = useTranslations("defi");
  const locale = useLocale();
  const isPt = locale === "pt";
  const motion = useMotion();

  const shown = useMemo(() => protocols.slice(0, MAX_RINGS), [protocols]);
  const sum = useMemo(
    () => shown.reduce((s, p) => s + p.tvl, 0),
    [shown],
  );

  /* Geometria por slug: raio = rank actual, arco = quota no conjunto. */
  const geo = useMemo(() => {
    const m = new Map<string, { r: number; d: string; frac: number }>();
    shown.forEach((p, i) => {
      const r = R0 - i * STEP;
      const frac = sum > 0 ? p.tvl / sum : 0;
      m.set(p.slug, { r, d: arcPath(r, frac), frac });
    });
    return m;
  }, [shown, sum]);

  /* Ao reordenar, cada anel desliza do raio antigo para o novo — tween do
     atributo `d` (mesma estrutura de comandos → interpolação contínua).
     Subdued: aplica o estado final directo. */
  const prevGeo = useRef(geo);
  const pathEls = useRef(new Map<string, SVGPathElement>());
  useLayoutEffect(() => {
    const prev = prevGeo.current;
    prevGeo.current = geo;
    const anims: gsap.core.Tween[] = [];
    for (const [slug, g] of geo) {
      const el = pathEls.current.get(slug);
      const p = prev.get(slug);
      if (!el || !p || p.d === g.d) continue;
      if (motion.subdued) {
        el.setAttribute("d", g.d);
        continue;
      }
      // Restaura a geometria antiga antes do paint — o React já escreveu a
      // nova; sem isto o anel salta em vez de deslizar.
      el.setAttribute("d", p.d);
      const proxy = { el, from: p.d, to: g.d };
      anims.push(
        gsap.to(
          { t: 0 },
          {
            t: 1,
            duration: 0.7 * motion.cadence,
            ease: "power2.inOut",
            onUpdate: function () {
              const k = this.targets()[0].t as number;
              // Interpolação geométrica: blend de raio e fracção.
              const r = p.r + (g.r - p.r) * k;
              const f = p.frac + (g.frac - p.frac) * k;
              proxy.el.setAttribute("d", arcPath(r, f));
            },
          },
        ),
      );
    }
    return () => anims.forEach((a) => a.kill());
  }, [geo, motion.subdued, motion.cadence]);

  const fmt = (n: number) =>
    new Intl.NumberFormat(isPt ? "pt-PT" : "en-US", {
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <figure className="m-0">
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,320px)_1fr]">
        <svg
          viewBox="0 0 320 320"
          className="h-auto w-full max-w-80"
          role="img"
          aria-label={t("ringAria")}
        >
          {/* discos-guia */}
          {shown.map((p, i) => (
            <circle
              key={`track-${p.slug}`}
              cx={CX}
              cy={CY}
              r={R0 - i * STEP}
              fill="none"
              stroke="var(--line)"
              strokeWidth={1}
              opacity={0.35}
            />
          ))}
          {shown.map((p) => {
            const g = geo.get(p.slug);
            if (!g) return null;
            const dir =
              p.change1d == null
                ? "var(--accent)"
                : p.change1d >= 0
                  ? "var(--up)"
                  : "var(--down)";
            return (
              <path
                key={p.slug}
                ref={(el) => {
                  if (el) pathEls.current.set(p.slug, el);
                  else pathEls.current.delete(p.slug);
                }}
                d={g.d}
                fill="none"
                stroke={dir}
                strokeWidth={ARC_W}
                strokeLinecap="butt"
                opacity={0.92}
              />
            );
          })}
          <text
            x={CX}
            y={CY - 4}
            textAnchor="middle"
            fill="var(--ink)"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            {formatUsd(sum, true)}
          </text>
          <text
            x={CX}
            y={CY + 12}
            textAnchor="middle"
            fill="var(--faint)"
            style={{ fontFamily: "var(--font-mono)", fontSize: 8.5 }}
          >
            {t("ringCenter", { n: shown.length })}
          </text>
        </svg>

        {/* Legenda ordenada — a posição do anel (exterior→interior) segue
            esta lista; a mesma ordem governa as duas metades da peça. */}
        <ol className="min-w-0 space-y-1">
          {shown.map((p, i) => {
            const share = sum > 0 ? (p.tvl / sum) * 100 : 0;
            return (
              <li
                key={p.slug}
                className="flex items-baseline gap-2 text-meta"
              >
                <span className="w-4 shrink-0 font-mono text-micro text-faint tabular-nums">
                  {i + 1}
                </span>
                <span
                  className="inline-block h-2 w-2 shrink-0 translate-y-[-1px]"
                  style={{
                    backgroundColor:
                      p.change1d == null
                        ? "var(--accent)"
                        : p.change1d >= 0
                          ? "var(--up)"
                          : "var(--down)",
                  }}
                  aria-hidden
                />
                <span className="min-w-0 truncate text-ink">{p.name}</span>
                <span className="ml-auto shrink-0 font-mono text-label tabular-nums text-muted">
                  {fmt(share)}%
                </span>
                <span
                  className={`w-14 shrink-0 text-right font-mono text-label tabular-nums ${
                    p.change1d == null ? "text-faint" : deltaClass(p.change1d)
                  }`}
                >
                  {p.change1d == null ? "—" : formatPct(p.change1d)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className="mt-2 text-meta text-faint">
        {t("ringNote", { n: shown.length })}
        {sort === "move" ? ` ${t("ringMoveNote")}` : ""}
      </figcaption>
    </figure>
  );
}
