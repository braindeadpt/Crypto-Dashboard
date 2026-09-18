"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ReadingSet } from "@/lib/reading";
import {
  conduct,
  MOTION_REST,
  type MotionState,
} from "@/lib/motion/conductor";

const MotionCtx = createContext<MotionState>(MOTION_REST);

/**
 * O Maestro em React: um provider por página, derivado das leituras reais.
 *
 * - prefers-reduced-motion vence sempre (MOTION_REST).
 * - Página oculta → repouso (pausa honesta, não "ao vivo" falso).
 * - Confiança fraca nas leituras → repouso (ver conduct()).
 *
 * Componentes subscrevem com useMotion() e NUNCA inventam durações próprias.
 */
export function MotionProvider({
  readings,
  realizedVolPct = null,
  children,
}: {
  readings: ReadingSet | null;
  realizedVolPct?: number | null;
  children: ReactNode;
}) {
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => mq.removeEventListener("change", onMq);
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    onVis();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const state = useMemo(
    () =>
      conduct(readings, {
        reduced: reduced || hidden,
        realizedVolPct,
      }),
    [readings, realizedVolPct, reduced, hidden],
  );

  return <MotionCtx.Provider value={state}>{children}</MotionCtx.Provider>;
}

/** Estado de movimento global. Fora de um provider devolve repouso. */
export function useMotion(): MotionState {
  return useContext(MotionCtx);
}
