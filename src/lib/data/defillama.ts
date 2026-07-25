import {
  isSnapshotStale,
  readSnapshot,
} from "@/lib/data/snapshotStore";
import type { DefiSnapshot } from "@/lib/types";

const STALE_MS = 15 * 60_000;

/**
 * Render path reads the slim disk snapshot ONLY — never a live DefiLlama call.
 *
 * Why: the "light" fallback included /overview/fees, which is ~4.7MB. Once the
 * snapshot went stale every render re-fetched it, blowing past the 2MB Next data
 * cache limit and turning a 0.4s render into 4s+ (71s cold). Serving a stale
 * snapshot and labelling it stale is honest and instant; blocking the render on
 * a multi-megabyte download is neither.
 *
 * Refresh happens out of band via /api/cron/refresh-heavy (or
 * `npm run snapshots:refresh`), which is where fetchLightDefi() belongs.
 */
export async function fetchDefiSnapshot(): Promise<DefiSnapshot | null> {
  const snap = await readSnapshot<DefiSnapshot>("defi");
  if (!snap) return null;
  return {
    ...snap,
    stale: isSnapshotStale(snap.updatedAt, STALE_MS * 4),
  };
}
