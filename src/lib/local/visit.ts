import { createLocalStore } from "@/lib/local/store";
import type { MarketPosture } from "@/lib/types";

/**
 * R1 — "desde a tua última visita".
 *
 * Snapshot dos vitals no browser (localStorage, sem servidor). A visita
 * anterior fica em `prev` durante toda a sessão — o diff na entrada
 * compara esse estado com o mercado actual.
 */
export type VisitVitals = {
  seenAt: string;
  posture: MarketPosture;
  score: number;
  btcChange24h: number | null;
  breadthPct: number | null;
  fearGreed: number | null;
  fundingBps: number | null;
  dominance: number | null;
  etfUsdM: number | null;
};

export type VisitRecord = {
  prev: VisitVitals | null;
  curr: VisitVitals | null;
};

/** Abaixo de 6h conta como a mesma visita — remounts não apagam o "antes". */
const MIN_GAP_MS = 6 * 60 * 60 * 1000;

const POSTURES: MarketPosture[] = ["calm", "unsettled", "storm", "weird"];

function isVitals(v: unknown): v is VisitVitals {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.seenAt === "string" &&
    typeof o.score === "number" &&
    POSTURES.includes(o.posture as MarketPosture)
  );
}

function validate(d: unknown): d is VisitRecord {
  if (!d || typeof d !== "object") return false;
  const o = d as Record<string, unknown>;
  return (
    (o.prev == null || isVitals(o.prev)) &&
    (o.curr == null || isVitals(o.curr))
  );
}

export const visitStore = createLocalStore<VisitRecord>({
  key: "clareza:visit",
  version: 1,
  defaultValue: { prev: null, curr: null },
  validate,
});

/**
 * Regista a visita. Roda `curr → prev` só quando a última leitura tem
 * ≥6h — dentro da janela o `curr` actualiza-se mas `prev` fica intacto,
 * para o diff da entrada sobreviver a remounts na mesma sessão.
 */
export function recordVisit(v: VisitVitals) {
  const { data } = visitStore.get();
  const last = data.curr ? Date.parse(data.curr.seenAt) : NaN;
  const now = Date.parse(v.seenAt);
  const rotate =
    !Number.isFinite(last) ||
    !Number.isFinite(now) ||
    now - last >= MIN_GAP_MS;
  visitStore.set(rotate ? { prev: data.curr, curr: v } : { ...data, curr: v });
}
