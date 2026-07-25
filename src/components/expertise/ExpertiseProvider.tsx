"use client";

import {
  EXPERTISE_LEVELS,
  EXPERTISE_STORAGE_KEY,
  parseExpertise,
  showDensity,
  type DensitySection,
  type ExpertiseLevel,
} from "@/lib/expertise";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

type ExpertiseContextValue = {
  level: ExpertiseLevel;
  setLevel: (level: ExpertiseLevel) => void;
  show: (section: DensitySection) => boolean;
};

const ExpertiseContext = createContext<ExpertiseContextValue | null>(null);

let memoryLevel: ExpertiseLevel = "operator";
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): ExpertiseLevel {
  if (typeof window === "undefined") return memoryLevel;
  try {
    memoryLevel = parseExpertise(
      window.localStorage.getItem(EXPERTISE_STORAGE_KEY),
    );
  } catch {
    /* ignore */
  }
  return memoryLevel;
}

function getServerSnapshot(): ExpertiseLevel {
  return "operator";
}

function writeLevel(level: ExpertiseLevel) {
  memoryLevel = level;
  try {
    window.localStorage.setItem(EXPERTISE_STORAGE_KEY, level);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function ExpertiseProvider({ children }: { children: ReactNode }) {
  const level = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const setLevel = useCallback((next: ExpertiseLevel) => {
    if (!EXPERTISE_LEVELS.includes(next)) return;
    writeLevel(next);
  }, []);

  const value = useMemo<ExpertiseContextValue>(
    () => ({
      level,
      setLevel,
      show: (section) => showDensity(level, section),
    }),
    [level, setLevel],
  );

  return (
    <ExpertiseContext.Provider value={value}>
      {children}
    </ExpertiseContext.Provider>
  );
}

export function useExpertise(): ExpertiseContextValue {
  const ctx = useContext(ExpertiseContext);
  if (!ctx) {
    return {
      level: "operator",
      setLevel: () => {},
      show: (section) => showDensity("operator", section),
    };
  }
  return ctx;
}
