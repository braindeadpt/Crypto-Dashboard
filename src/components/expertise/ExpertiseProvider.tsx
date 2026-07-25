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
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ExpertiseContextValue = {
  level: ExpertiseLevel;
  setLevel: (level: ExpertiseLevel) => void;
  show: (section: DensitySection) => boolean;
};

const ExpertiseContext = createContext<ExpertiseContextValue | null>(null);

export function ExpertiseProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<ExpertiseLevel>("operator");

  useEffect(() => {
    try {
      setLevelState(
        parseExpertise(window.localStorage.getItem(EXPERTISE_STORAGE_KEY)),
      );
    } catch {
      /* ignore */
    }
  }, []);

  const setLevel = useCallback((next: ExpertiseLevel) => {
    if (!EXPERTISE_LEVELS.includes(next)) return;
    setLevelState(next);
    try {
      window.localStorage.setItem(EXPERTISE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
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
