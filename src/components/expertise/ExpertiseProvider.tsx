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

/**
 * Store externo mínimo por cima do localStorage.
 *
 * Porquê useSyncExternalStore e não useState+useEffect: ler o armazenamento no
 * efeito e chamar setState viola react-hooks/set-state-in-effect (o lint corre
 * no CI). Este é o padrão sancionado pelo React para fontes externas, e mantém
 * a reactividade que o dial precisa — writeLevel notifica os subscritores, por
 * isso o clique e o teclado voltam a re-renderizar.
 */
let memoryLevel: ExpertiseLevel | null = null;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): ExpertiseLevel {
  // Lazy: lê o disco uma vez e guarda, para o snapshot ser estável entre
  // renders (um snapshot instável provoca ciclo infinito).
  if (memoryLevel == null) {
    try {
      memoryLevel = parseExpertise(
        window.localStorage.getItem(EXPERTISE_STORAGE_KEY),
      );
    } catch {
      memoryLevel = "operator";
    }
  }
  return memoryLevel;
}

function getServerSnapshot(): ExpertiseLevel {
  return "operator";
}

function writeLevel(next: ExpertiseLevel) {
  memoryLevel = next;
  try {
    window.localStorage.setItem(EXPERTISE_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  for (const l of listeners) l();
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
