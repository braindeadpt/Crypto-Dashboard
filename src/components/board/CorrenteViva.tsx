"use client";

import { useMotion } from "@/lib/motion/useMotion";
import {
  useForceLiquidations,
  type ForceLiqEvent,
} from "@/lib/hooks/useForceLiquidations";
import type { LiveTickerState } from "@/lib/hooks/useLiveTicker";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef } from "react";

/**
 * A CORRENTE VIVA — o mercado desenhado em tempo real, não um gráfico parado.
 *
 * Porque existe: as visualizações do produto eram SVG estático com animação de
 * entrada — faziam wipe uma vez e congelavam. Esta não pára: a onda avança a
 * cada frame, cada tick real empurra uma amostra nova, e cada liquidação real
 * bate no campo. O ecrã está vivo porque o mercado está vivo.
 *
 * Honestidade (Regra nº1): a onda só avança com ticks REAIS. Sem ligação, o
 * campo congela e di-lo — nunca inventa movimento para parecer ocupado.
 */

type Sample = { t: number; v: number };
type Impact = { t: number; y: number; side: "long" | "short"; mag: number };

const WINDOW_MS = 90_000; // 90s de história visível
const MAX_SAMPLES = 900;

export function CorrenteViva({
  live,
  className = "",
}: {
  live: LiveTickerState;
  className?: string;
}) {
  const t = useTranslations("corrente");
  const locale = useLocale();
  const isPt = locale === "pt";
  const motion = useMotion();
  const liq = useForceLiquidations();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const samples = useRef<Sample[]>([]);
  const impacts = useRef<Impact[]>([]);
  const seenLiq = useRef<Set<string>>(new Set());
  // O loop de desenho lê o Maestro por ref para não se re-montar a cada
  // mudança de estado — sincronizado em efeito, nunca durante o render.
  const motionRef = useRef(motion);
  useEffect(() => {
    motionRef.current = motion;
  }, [motion]);

  const quote = live.quotes.BTCUSDT;
  const connected = live.connection === "live";

  // Cada tick real empurra uma amostra. Sem tick, nada entra — a onda não
  // inventa pontos para continuar a andar.
  useEffect(() => {
    if (!quote) return;
    const arr = samples.current;
    const last = arr[arr.length - 1];
    if (last && last.t === quote.lastUpdate) return;
    arr.push({ t: quote.lastUpdate || Date.now(), v: quote.price });
    if (arr.length > MAX_SAMPLES) arr.splice(0, arr.length - MAX_SAMPLES);
  }, [quote]);

  // Cada liquidação real vira um impacto no campo.
  useEffect(() => {
    for (const e of liq.events) {
      const id = e.id;
      if (seenLiq.current.has(id)) continue;
      seenLiq.current.add(id);
      impacts.current.push({
        t: Date.now(),
        y: Math.random(),
        side: e.side,
        mag: Math.min(1, e.notional / 250_000),
      });
    }
    if (seenLiq.current.size > 400) seenLiq.current = new Set();
  }, [liq.events]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let running = true;
    let phase = 0;

    const css = getComputedStyle(document.documentElement);
    const read = (n: string, f: string) =>
      css.getPropertyValue(n).trim() || f;
    const cUp = read("--up", "#00f0a8");
    const cDown = read("--down", "#ff4d7d");
    const cAccent = read("--accent", "#9b6cff");
    const cAccent2 = read("--accent-2", "#22e6ff");

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      if (!running || !canvas || !ctx) return;
      const m = motionRef.current;
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      ctx.clearRect(0, 0, W, H);

      const now = Date.now();
      const arr = samples.current;

      // A onda avança sempre — a cadência do Maestro define a velocidade.
      if (!reduced) phase += 0.012 / Math.max(0.4, m.cadence);

      // Escala vertical a partir da janela real de preços.
      const win = arr.filter((s) => now - s.t <= WINDOW_MS);
      const vals = win.map((s) => s.v);
      const lo = vals.length ? Math.min(...vals) : 0;
      const hi = vals.length ? Math.max(...vals) : 1;
      const span = hi - lo || 1;

      // Campo: bandas que ondulam com amplitude = agitação.
      const amp = 6 + m.agitation * 26;
      const bands = 3;
      for (let b = 0; b < bands; b++) {
        const depth = (b + 1) / bands;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) {
          const k = x / W;
          const wobble =
            Math.sin(k * 7 + phase * (1 + b * 0.4)) * amp * depth +
            Math.sin(k * 17 - phase * 1.7) * amp * 0.35 * depth;
          // O preço real deforma a banda de base.
          let py = H * 0.5;
          if (win.length > 1) {
            const idx = Math.min(
              win.length - 1,
              Math.floor(k * (win.length - 1)),
            );
            py = H - ((win[idx]!.v - lo) / span) * (H * 0.72) - H * 0.14;
          }
          const y = py + wobble;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        const g = ctx.createLinearGradient(0, 0, 0, H);
        const hot = m.temperature >= 0 ? cUp : cDown;
        g.addColorStop(0, withAlpha(hot, 0.16 * depth));
        g.addColorStop(1, withAlpha(cAccent, 0.02));
        ctx.fillStyle = g;
        ctx.fill();
      }

      // A linha do preço real, por cima.
      if (win.length > 1) {
        ctx.beginPath();
        win.forEach((s, i) => {
          const x = (i / (win.length - 1)) * W;
          const y = H - ((s.v - lo) / span) * (H * 0.72) - H * 0.14;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = withAlpha(cAccent2, 0.9);
        ctx.lineWidth = 2;
        ctx.stroke();

        // Cabeça viva — pulsa ao ritmo, marca o agora.
        const lastS = win[win.length - 1]!;
        const hx = W;
        const hy = H - ((lastS.v - lo) / span) * (H * 0.72) - H * 0.14;
        const pr = 3 + (reduced ? 0 : Math.sin(phase * 4) * 1.5 + 1.5);
        ctx.beginPath();
        ctx.arc(hx - 2, hy, pr, 0, Math.PI * 2);
        ctx.fillStyle = cAccent2;
        ctx.fill();
      }

      // Impactos reais de liquidação — anéis que expandem e desvanecem.
      impacts.current = impacts.current.filter((im) => now - im.t < 1800);
      for (const im of impacts.current) {
        const age = (now - im.t) / 1800;
        const rad = 6 + age * (40 + im.mag * 90);
        ctx.beginPath();
        ctx.arc(W * (0.72 + im.y * 0.26), H * (0.2 + im.y * 0.6), rad, 0, Math.PI * 2);
        ctx.strokeStyle = withAlpha(
          im.side === "long" ? cDown : cUp,
          (1 - age) * 0.75,
        );
        ctx.lineWidth = 1 + im.mag * 2.5;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    }

    draw();

    function onVis() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        draw();
      }
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <figure className={`relative ${className}`} aria-label={t("aria")}>
      <canvas
        ref={canvasRef}
        className="block h-[clamp(200px,28vw,380px)] w-full"
        aria-hidden
      />
      <figcaption className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
        <span className="text-tag text-faint">{t("label")}</span>
        <span
          className={`text-tag ${connected ? "text-accent-2" : "text-warn"}`}
        >
          {connected
            ? t("live")
            : live.connection === "offline"
              ? t("offline")
              : t("connecting")}
        </span>
      </figcaption>
      {/* Estado honesto: sem ligação a onda não avança, e o ecrã di-lo. */}
      {!connected && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 text-center text-meta text-warn">
          {isPt
            ? "Sem ligação ao vivo — a corrente está parada."
            : "No live connection — the current is frozen."}
        </p>
      )}
    </figure>
  );
}

/** Aceita #rrggbb ou rgb(...) e devolve com alfa. */
function withAlpha(color: string, a: number): string {
  const c = color.trim();
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1]!.split(",").map((n) => parseFloat(n));
    return `rgba(${r},${g},${b},${a})`;
  }
  return c;
}

export type { ForceLiqEvent };
