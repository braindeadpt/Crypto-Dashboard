"use client";

import { useEffect, useRef } from "react";

const COUNT = 42;
const LINK_DIST = 92;

/**
 * Ambient data-field behind the hero — the controlled "wow".
 *
 * Purely decorative: drifting particles + faint links, tinted with the
 * accent tokens so it follows Dia/Noite. Renders one static frame under
 * prefers-reduced-motion; never intercepts input; hidden from AT.
 */
export function AmbientField({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const styles = getComputedStyle(canvas);
    const accent = styles.getPropertyValue("--accent").trim() || "#9b6cff";
    const accent2 = styles.getPropertyValue("--accent-2").trim() || "#22e6ff";

    const rgba = (hex: string, a: number) => {
      const m = hex.replace("#", "");
      const n = parseInt(m.length === 3 ? m.replace(/./g, "$&$&") : m, 16);
      return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    };
    const dotColor = rgba(accent, 0.55);
    const dotColor2 = rgba(accent2, 0.45);
    const lineColor = rgba(accent2, 0.09);

    let w = 0;
    let h = 0;
    let raf = 0;
    const parts = Array.from({ length: COUNT }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00035,
      r: Math.random() * 1.5 + 0.7,
      alt: i % 3 === 0,
    }));

    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = box.width;
      h = box.height;
      canvas.width = Math.max(1, w * dpr);
      canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < parts.length; i++) {
        for (let j = i + 1; j < parts.length; j++) {
          const dx = (parts[i].x - parts[j].x) * w;
          const dy = (parts[i].y - parts[j].y) * h;
          const d = Math.hypot(dx, dy);
          if (d < LINK_DIST) {
            ctx.globalAlpha = 1 - d / LINK_DIST;
            ctx.strokeStyle = lineColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(parts[i].x * w, parts[i].y * h);
            ctx.lineTo(parts[j].x * w, parts[j].y * h);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      for (const p of parts) {
        ctx.fillStyle = p.alt ? dotColor2 : dotColor;
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -0.02) p.x = 1.02;
        else if (p.x > 1.02) p.x = -0.02;
        if (p.y < -0.02) p.y = 1.02;
        else if (p.y > 1.02) p.y = -0.02;
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    if (reduced) draw();
    else raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={`field-fade pointer-events-none absolute inset-0 h-full w-full ${className}`}
    />
  );
}
