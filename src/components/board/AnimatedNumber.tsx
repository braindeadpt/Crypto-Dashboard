"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * Número vivo: faz tween entre valores sem re-render — o tween escreve
 * directamente no textContent. Sob prefers-reduced-motion aplica já.
 */
export function AnimatedNumber({
  value,
  format,
  className,
}: {
  value: number | null | undefined;
  format: (n: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const last = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (el == null || value == null || !Number.isFinite(value)) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const from = last.current;
    if (reduced || from == null || from === value) {
      el.textContent = format(value);
      last.current = value;
      return;
    }
    const obj = { v: from };
    const tween = gsap.to(obj, {
      v: value,
      duration: 0.7,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = format(obj.v);
      },
    });
    last.current = value;
    return () => {
      tween.kill();
    };
  }, [value, format]);

  return (
    <span ref={ref} className={className}>
      {value != null && Number.isFinite(value) ? format(value) : "—"}
    </span>
  );
}
