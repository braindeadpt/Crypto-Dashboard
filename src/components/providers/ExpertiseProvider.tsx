"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { ExpertiseLevel } from "@/lib/types";

const KEY = "clareza-expertise";

const ExpertiseContext = createContext<{
  level: ExpertiseLevel;
  setLevel: (l: ExpertiseLevel) => void;
} | null>(null);

/** MVP: operator board always uses full density (analyst). Dial returns in a later pass. */
export function ExpertiseProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<ExpertiseLevel>("analyst");

  function setLevel(l: ExpertiseLevel) {
    setLevelState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* ignore */
    }
  }

  return (
    <ExpertiseContext.Provider value={{ level, setLevel }}>
      {children}
    </ExpertiseContext.Provider>
  );
}

export function useExpertise() {
  const ctx = useContext(ExpertiseContext);
  if (!ctx) throw new Error("useExpertise outside provider");
  return ctx;
}
