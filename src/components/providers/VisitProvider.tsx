"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const KEY = "clareza-last-visit";
const SNAP_KEY = "clareza-last-snap";

type VisitSnap = {
  btcPrice: number;
  btcChange: number;
  posture: string;
  fng: number;
  at: string;
};

type VisitStore = {
  lastVisit: string | null;
  previousSnap: VisitSnap | null;
};

const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function readStore(): VisitStore {
  if (typeof window === "undefined") {
    return { lastVisit: null, previousSnap: null };
  }
  let previousSnap: VisitSnap | null = null;
  const raw = localStorage.getItem(SNAP_KEY);
  if (raw) {
    try {
      previousSnap = JSON.parse(raw) as VisitSnap;
    } catch {
      previousSnap = null;
    }
  }
  return {
    lastVisit: localStorage.getItem(KEY),
    previousSnap,
  };
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

const VisitContext = createContext<{
  lastVisit: string | null;
  previousSnap: VisitSnap | null;
  recordVisit: (snap: VisitSnap) => void;
  deltaSentence: (locale: string, current: VisitSnap) => string;
} | null>(null);

export function VisitProvider({ children }: { children: ReactNode }) {
  const store = useSyncExternalStore(subscribe, readStore, () => ({
    lastVisit: null,
    previousSnap: null,
  }));

  const recordVisit = useCallback((snap: VisitSnap) => {
    const at = new Date().toISOString();
    localStorage.setItem(KEY, at);
    localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
    emit();
  }, []);

  const value = useMemo(
    () => ({
      lastVisit: store.lastVisit,
      previousSnap: store.previousSnap,
      recordVisit,
      deltaSentence(locale: string, current: VisitSnap) {
        const previousSnap = store.previousSnap;
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
          if (postureChanged)
            bits.push(`postura ${previousSnap.posture} → ${current.posture}`);
          if (Math.abs(fngDelta) >= 5)
            bits.push(`Medo & Ganância ${fngDelta >= 0 ? "+" : ""}${fngDelta}`);
          return bits.join(" · ");
        }
        const bits = [
          `BTC ${priceDelta >= 0 ? "+" : ""}${priceDelta.toFixed(2)}% since last visit`,
        ];
        if (postureChanged)
          bits.push(`posture ${previousSnap.posture} → ${current.posture}`);
        if (Math.abs(fngDelta) >= 5)
          bits.push(`Fear & Greed ${fngDelta >= 0 ? "+" : ""}${fngDelta}`);
        return bits.join(" · ");
      },
    }),
    [store.lastVisit, store.previousSnap, recordVisit],
  );

  return <VisitContext.Provider value={value}>{children}</VisitContext.Provider>;
}

export function useVisit() {
  const ctx = useContext(VisitContext);
  if (!ctx) throw new Error("useVisit outside provider");
  return ctx;
}
