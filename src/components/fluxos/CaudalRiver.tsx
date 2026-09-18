"use client";

import { useMotion } from "@/lib/motion/useMotion";
import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

/**
 * O CAUDAL — o dinheiro como rio animado.
 *
 * Duas faixas reais: fluxo diário de ETF spot (USD M, Farside) e variação
 * diária da oferta de stablecoins (USD, DefiLlama). A largura da faixa num
 * dia é |magnitude| desse dia; as partículas correm no sentido do sinal —
 * entrada para a direita, saída para a esquerda. Velocidade = cadência do
 * Maestro; subdued → frame estático honesto.
 */

const DAYS = 30;
const MAX_PARTICLES = 140;

type DayFlow = { t: string; v: number }; // v > 0 entrada, < 0 saída

function toDaily(points: { t: string; v: number }[]): DayFlow[] {
  return points
    .filter((p) => Number.isFinite(p.v))
    .slice()
    .sort((a, b) => Date.parse(a.t) - Date.parse(b.t))
    .slice(-DAYS);
}

function toDailyDelta(points: { t: string; v: number }[]): DayFlow[] {
  const sorted = points
    .filter((p) => Number.isFinite(p.v))
    .slice()
    .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  const out: DayFlow[] = [];
  for (let i = 1; i < sorted.length; i++) {
    out.push({ t: sorted[i]!.t, v: sorted[i]!.v - sorted[i - 1]!.v });
  }
  return out.slice(-DAYS);
}

export function CaudalRiver({
  etfFlows,
  stableSupply,
  updatedAt,
}: {
  /** USD M por dia (ETF spot, todos os activos somados pela fonte). */
  etfFlows: { t: string; v: number }[];
  /** Oferta total de stablecoins por dia (USD) — usamos o delta diário. */
  stableSupply: { t: string; v: number }[];
  updatedAt: string | null;
}) {
  const t = useTranslations("fluxos");
  const locale = useLocale();
  const isPt = locale === "pt";
  const motion = useMotion();
  const motionRef = useRef(motion);
  useEffect(() => {
    motionRef.current = motion;
  }, [motion]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dataRef = useRef<{ etf: DayFlow[]; stables: DayFlow[] } | null>(null);
  useEffect(() => {
    dataRef.current = {
      etf: toDaily(etfFlows),
      stables: toDailyDelta(stableSupply),
    };
  }, [etfFlows, stableSupply]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    // O poço é sempre escuro (#04060c) — a palete do rio é a da Noite,
    // fixa, independentemente do tema da folha em redor.
    const cUp = "#00f0a8";
    const cDown = "#ff4d7d";
    const cAccent = "#9b6cff";
    const cLine = "rgba(226,230,244,0.35)";

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function resize() {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(r.width * dpr));
      canvas.height = Math.max(1, Math.floor(r.height * dpr));
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    type Particle = {
      lane: 0 | 1;
      x: number; // 0..1
      off: number; // -1..1 dentro da faixa
      sp: number;
      size: number;
    };
    const particles: Particle[] = [];
    for (let i = 0; i < MAX_PARTICLES; i++) {
      particles.push({
        lane: i % 2 === 0 ? 0 : 1,
        x: Math.random(),
        off: Math.random() * 2 - 1,
        sp: 0.5 + Math.random(),
        size: 0.7 + Math.random() * 1.6,
      });
    }

    let running = true;
    let raf = 0;
    let last = performance.now();

    /** Geometria de uma faixa: largura local ∝ |v| interpolado entre dias. */
    function laneAt(days: DayFlow[], xFrac: number, laneY: number) {
      if (!days.length) return { h: 0, dir: 0 };
      const max = Math.max(...days.map((d) => Math.abs(d.v)), 1);
      // xFrac pode passar de 1 antes do wrap da partícula — clampa.
      const pos = Math.min(Math.max(xFrac, 0), 1) * (days.length - 1);
      const i0 = Math.floor(pos);
      const i1 = Math.min(days.length - 1, i0 + 1);
      const k = pos - i0;
      const v0 = days[i0]!.v;
      const v1 = days[i1]!.v;
      const v = v0 + (v1 - v0) * k;
      const h = 6 + (Math.abs(v) / max) * laneY * 0.72;
      return { h, dir: Math.sign(v) };
    }

    function draw(dt: number) {
      if (!canvas || !ctx) return;
      const r = canvas.getBoundingClientRect();
      const W = r.width;
      const H = r.height;
      ctx.clearRect(0, 0, W, H);

      const data = dataRef.current;
      const laneY = H / 2 - 6;
      const lanes: { days: DayFlow[]; cy: number; label: string }[] = [
        { days: data?.etf ?? [], cy: laneY / 2 + 4, label: "ETF" },
        { days: data?.stables ?? [], cy: laneY + laneY / 2 + 8, label: "STABLES" },
      ];

      // Separador central + etiquetas de faixa.
      ctx.strokeStyle = cLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, H / 2);
      ctx.lineTo(W, H / 2);
      ctx.stroke();

      for (const lane of lanes) {
        const laneH = laneY;

        // A banda do rio: largura local = magnitude interpolada.
        if (lane.days.length > 1) {
          ctx.beginPath();
          for (let px = 0; px <= W; px += 4) {
            const { h } = laneAt(lane.days, px / W, laneH);
            const y = lane.cy - h / 2;
            if (px === 0) ctx.moveTo(px, y);
            else ctx.lineTo(px, y);
          }
          for (let px = W; px >= 0; px -= 4) {
            const { h } = laneAt(lane.days, px / W, laneH);
            ctx.lineTo(px, lane.cy + h / 2);
          }
          ctx.closePath();
          ctx.fillStyle = withAlpha(cAccent, 0.08);
          ctx.fill();
          ctx.strokeStyle = withAlpha(cAccent, 0.35);
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Etiqueta da faixa.
        ctx.fillStyle = withAlpha(cLine, 0.9);
        ctx.font = "9px var(--font-mono), monospace";
        ctx.fillText(lane.label, 6, lane.cy - laneH / 2 - 2);
      }

      // Partículas — direcção = sinal do dia sob a partícula.
      const m = motionRef.current;
      const speedBase = (0.03 + m.agitation * 0.05) / Math.max(0.4, m.cadence);
      for (const p of particles) {
        const lane = lanes[p.lane]!;
        const { h, dir } = laneAt(lane.days, p.x, laneY);
        if (dir === 0 || h === 0) continue;
        const flow = dir * speedBase * p.sp;
        p.x += flow * (dt / 16.7);
        if (p.x > 1.02) p.x = -0.02;
        if (p.x < -0.02) p.x = 1.02;
        // A partícula vive dentro da banda — afastamento proporcional.
        const y = lane.cy + p.off * (h / 2 - 2);
        ctx.beginPath();
        ctx.arc(p.x * W, y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(dir > 0 ? cUp : cDown, 0.75);
        ctx.fill();
      }
    }

    function frame(now: number) {
      const dt = Math.min(64, now - last);
      last = now;
      draw(dt);
      if (running && !motionRef.current.subdued)
        raf = requestAnimationFrame(frame);
    }

    draw(16.7); // primeiro frame — também é o frame estático em repouso
    if (!motionRef.current.subdued) raf = requestAnimationFrame(frame);

    function onVis() {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running && !motionRef.current.subdued) {
        running = true;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [isPt]);

  const nEtf = toDaily(etfFlows).length;
  const nSt = toDailyDelta(stableSupply).length;

  return (
    <figure className="m-0">
      {/* O rio corre sobre escuro mesmo em Papel — a luz em movimento
          precisa do poço, como a Corrente (V4 §2①). */}
      <div className="corrente-well px-2 py-3">
        <canvas
          ref={canvasRef}
          className="block h-44 w-full sm:h-52"
          aria-hidden
        />
      </div>
      <figcaption className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-meta text-faint">
        <span>{t("caudalNote", { days: Math.min(nEtf, nSt || nEtf) })}</span>
        <span className="font-mono text-micro">
          {isPt
            ? "partículas no sentido do sinal · direita = entrada"
            : "particles follow the sign · right = inflow"}
        </span>
        {updatedAt && (
          <span className="ml-auto font-mono text-micro">{updatedAt.slice(0, 10)}</span>
        )}
      </figcaption>
      {/* Texto alternativo para leitor de ecrã — o canvas é aria-hidden. */}
      <p className="sr-only">{t("caudalAria")}</p>
    </figure>
  );
}

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
