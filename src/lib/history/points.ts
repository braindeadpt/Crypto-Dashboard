import { readSnapshot } from "@/lib/data/snapshotStore";
import type { SeriesPoint } from "@/lib/stats";
import type { HistoryMetricId, HistorySnapshot } from "@/lib/history/metrics";

/**
 * Pontos reais de uma série do snapshot de histórico — ordenados, sem
 * preenchimento de lacunas. Null quando a série não existe.
 * Disk-only: para server components.
 */
export async function getHistoryPoints(
  id: HistoryMetricId,
): Promise<{ points: SeriesPoint[]; updatedAt: string | null }> {
  const snap =
    await readSnapshot<HistorySnapshot & { updatedAt?: string }>("history");
  const pts = (snap?.series?.[id]?.points ?? [])
    .filter((p) => Number.isFinite(p.v))
    .slice()
    .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
  return { points: pts, updatedAt: snap?.updatedAt ?? null };
}
