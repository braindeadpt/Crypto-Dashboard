import { readSnapshot } from "@/lib/data/snapshotStore";
import { buildMultidao, type MultidaoData } from "@/lib/history/multidao";
import type { HistorySnapshot } from "@/lib/history/metrics";

/**
 * Loader de disco da Multidão — server-only (lê o snapshot com fs).
 * O builder puro fica em multidao.ts para o componente cliente o usar
 * sem puxar node:fs para o bundle.
 */
export async function getMultidao(): Promise<MultidaoData | null> {
  const snap = await readSnapshot<HistorySnapshot>("history");
  return buildMultidao(snap);
}
