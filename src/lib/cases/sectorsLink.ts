import type { SectorRow, SectorsSnapshot } from "@/lib/data/sectors";

/** Sectors that list this asset among their top coins — honest link, not causation. */
export function sectorsForAsset(
  assetId: string,
  sectors: SectorsSnapshot,
): SectorRow[] {
  const id = assetId.toLowerCase();
  return [...sectors.thematic, ...sectors.mega].filter((s) =>
    s.topCoinIds.some((c) => c.toLowerCase() === id),
  );
}

/** Cases whose asset appears in the sector's top coins. */
export function casesForSector<T extends { assetId: string }>(
  sectorId: string,
  sectors: SectorsSnapshot,
  cases: T[],
): T[] {
  const sector =
    sectors.thematic.find((s) => s.id === sectorId) ??
    sectors.mega.find((s) => s.id === sectorId);
  if (!sector) return [];
  const tops = new Set(sector.topCoinIds.map((c) => c.toLowerCase()));
  return cases.filter((c) => tops.has(c.assetId.toLowerCase()));
}
