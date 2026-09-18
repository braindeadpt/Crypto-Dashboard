"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

/**
 * Construção pedagógica ao entrar no viewport — a excepção deliberada de
 * /aprender (PLANO-MOVIMENTO: aqui o movimento ensina, não lê o mercado).
 *
 * Corre a timeline UMA vez quando o topo do elemento passa os 80% do
 * viewport. `prefers-reduced-motion` não corre nada — o diagrama renderiza
 * completo. Durações/easings ficam a cargo do componente dentro dos tokens
 * do sistema (--dur-*, --ease-out).
 */
export function useViewportBuild<T extends HTMLElement>(
  build: (tl: gsap.core.Timeline) => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 80%", once: true },
      });
      build(tl);
    }, root);
    return () => ctx.revert();
    // build captura dados estáticos do mount — uma construção por diagrama.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return ref;
}
