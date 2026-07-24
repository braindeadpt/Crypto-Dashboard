"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { ExpertiseLevel } from "@/lib/types";

const KEY = "clareza-expertise";

const ExpertiseContext = createContext<{
  level: ExpertiseLevel;
  setLevel: (l: ExpertiseLevel) => void;
} | null>(null);

export function ExpertiseProvider({ children }: { children: ReactNode }) {
  const [level, setLevelState] = useState<ExpertiseLevel>("analyst");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY) as ExpertiseLevel | null;
    if (saved === "citizen" || saved === "operator" || saved === "analyst") {
      setLevelState("analyst");
    }
    setReady(true);
  }, []);

  function setLevel(l: ExpertiseLevel) {
    setLevelState(l);
    localStorage.setItem(KEY, l);
  }

  if (!ready) {
    return (
      <ExpertiseContext.Provider value={{ level: "analyst", setLevel }}>
        {children}
      </ExpertiseContext.Provider>
    );
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
