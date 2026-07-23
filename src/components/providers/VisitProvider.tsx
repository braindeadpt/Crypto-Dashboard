"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const KEY = "clareza-last-visit";
const SNAP_KEY = "clareza-last-snap";

type VisitSnap = {
  btcPrice: number;
  btcChange: number;
  posture: string;
  fng: number;
  at: string;
};

const VisitContext = createContext<{
  lastVisit: string | null;
  previousSnap: VisitSnap | null;
  recordVisit: (snap: VisitSnap) => void;
  deltaSentence: (locale: string, current: VisitSnap) => string;
} | null>(null);

export function VisitProvider({ children }: { children: ReactNode }) {
  const [lastVisit, setLastVisit] = useState<string | null>(null);
  const [previousSnap, setPreviousSnap] = useState<VisitSnap | null>(null);

  useEffect(() => {
    setLastVisit(localStorage.getItem(KEY));
    const raw = localStorage.getItem(SNAP_KEY);
    if (raw) {
      try {
        setPreviousSnap(JSON.parse(raw) as VisitSnap);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      lastVisit,
      previousSnap,
      recordVisit(snap: VisitSnap) {
        localStorage.setItem(KEY, new Date().toISOString());
        localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
        setLastVisit(new Date().toISOString());
      },
      deltaSentence(locale: string, current: VisitSnap) {
        if (!previousSnap) {
          return locale === "pt"
            ? "Primeira visita — bem-vindo à mesa."
            : "First visit — welcome to the desk.";
        }
        const priceDelta =
          ((current.btcPrice - previousSnap.btcPrice) / previousSnap.btcPrice) *
          100;
        const postureChanged = current.posture !== previousSnap.posture;
        const fngDelta = current.fng - previousSnap.fng;
        if (locale === "pt") {
          const bits = [
            `BTC ${priceDelta >= 0 ? "+" : ""}${priceDelta.toFixed(2)}% desde a última visita`,
          ];
          if (postureChanged) bits.push(`postura ${previousSnap.posture} → ${current.posture}`);
          if (Math.abs(fngDelta) >= 5)
            bits.push(`Medo & Ganância ${fngDelta >= 0 ? "+" : ""}${fngDelta}`);
          return bits.join(" · ");
        }
        const bits = [
          `BTC ${priceDelta >= 0 ? "+" : ""}${priceDelta.toFixed(2)}% since last visit`,
        ];
        if (postureChanged) bits.push(`posture ${previousSnap.posture} → ${current.posture}`);
        if (Math.abs(fngDelta) >= 5)
          bits.push(`Fear & Greed ${fngDelta >= 0 ? "+" : ""}${fngDelta}`);
        return bits.join(" · ");
      },
    }),
    [lastVisit, previousSnap],
  );

  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error("useVisit outside provider");
  return ctx;
}
