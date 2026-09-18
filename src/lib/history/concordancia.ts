import { readSnapshot } from "@/lib/data/snapshotStore";
import { dayKey } from "@/lib/history/series";
import { sameSign } from "@/lib/cases/correlate";
import type { HistorySnapshot } from "@/lib/history/metrics";

/**
 * CONCORDÂNCIA — o movimento do preço tem apoio, ou está sozinho?
 *
 * Para cada dia com variação de preço computável (dia anterior estrito
 * existe — lacuna ≠ 24h), conta quantos dos seis sinais se moveram NO
 * MESMO SENTIDO do preço. O teste de sentido é o `sameSign` do motor de
 * correlação de casos — não há segundo motor a competir.
 *
 * Linguagem obrigatória: "consistente com". Concordância mede acordo
 * temporal entre sinais — nunca causa.
 */

export const CONCORD_SIGNALS = [
  "funding_btc",
  "oi_btc",
  "breadth",
  "volume_btc",
  "stablecoin_supply",
  "fear_greed",
] as const;

export type ConcordDay = {
  /** YYYY-MM-DD (UTC) */
  t: string;
  /** Δ% do preço face ao dia anterior estrito. */
  priceDeltaPct: number;
  /** Sinais no mesmo sentido do preço. */
  agreed: number;
  /** Sinais com Δ computável nesse dia. */
  total: number;
};

export type Concordancia = {
  days: ConcordDay[];
  /** Sinais considerados (podem faltar por dia). */
  signalCount: number;
  updatedAt: string | null;
};

function toMap(points: { t: string; v: number }[] | undefined) {
  const m = new Map<string, number>();
  for (const p of points ?? []) {
    if (Number.isFinite(p.v)) m.set(dayKey(p.t), p.v);
  }
  return m;
}

function prevDay(day: string): string {
  const t = Date.parse(`${day}T00:00:00Z`) - 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Δ face ao dia anterior estrito — null quando o dia anterior falta. */
function dayDelta(map: Map<string, number>, day: string): number | null {
  const cur = map.get(day);
  const prev = map.get(prevDay(day));
  if (cur == null || prev == null || prev === 0) return null;
  return ((cur - prev) / Math.abs(prev)) * 100;
}

export function buildConcordancia(
  snap: HistorySnapshot | null,
): Concordancia {
  const empty: Concordancia = {
    days: [],
    signalCount: CONCORD_SIGNALS.length,
    updatedAt: null,
  };
  if (!snap?.series) return empty;

  const price = toMap(snap.series.price_btc?.points);
  const signals = CONCORD_SIGNALS.map((id) => toMap(snap.series[id]?.points));

  const days: ConcordDay[] = [];
  for (const day of [...price.keys()].sort()) {
    const pDelta = dayDelta(price, day);
    if (pDelta == null) continue; // dia sem Δ honesto → lacuna na faixa
    let agreed = 0;
    let total = 0;
    for (const map of signals) {
      const d = dayDelta(map, day);
      if (d == null) continue;
      total++;
      if (sameSign(d, pDelta)) agreed++;
    }
    days.push({ t: day, priceDeltaPct: pDelta, agreed, total });
  }

  return { ...empty, days };
}

/** Disk-only loader. */
export async function getConcordancia(): Promise<Concordancia> {
  const snap =
    await readSnapshot<HistorySnapshot & { updatedAt?: string }>("history");
  const data = buildConcordancia(snap);
  return { ...data, updatedAt: snap?.updatedAt ?? null };
}
