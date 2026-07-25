import {
  createLocalStore,
  type LocalEnvelope,
} from "@/lib/local/store";

/** CoinGecko-style id (e.g. arbitrum, celestia). */
export type WatchAsset = {
  id: string;
  symbol: string;
  name: string;
  addedAt: string;
};

export type WatchlistData = {
  assets: WatchAsset[];
};

export const WATCHLIST_KEY = "clareza-watchlist";
export const WATCHLIST_VERSION = 1;
export const WATCHLIST_MAX = 12;

export function isWatchlistData(v: unknown): v is WatchlistData {
  if (!v || typeof v !== "object") return false;
  const assets = (v as WatchlistData).assets;
  if (!Array.isArray(assets)) return false;
  return assets.every(
    (a) =>
      a &&
      typeof a === "object" &&
      typeof a.id === "string" &&
      typeof a.symbol === "string" &&
      typeof a.name === "string" &&
      typeof a.addedAt === "string",
  );
}

export const watchlistStore = createLocalStore<WatchlistData>({
  key: WATCHLIST_KEY,
  version: WATCHLIST_VERSION,
  defaultValue: { assets: [] },
  validate: isWatchlistData,
});

export function listWatchAssets(
  env?: LocalEnvelope<WatchlistData>,
): WatchAsset[] {
  return (env ?? watchlistStore.get()).data.assets;
}

export function addWatchAsset(
  asset: Omit<WatchAsset, "addedAt"> & { addedAt?: string },
): { ok: true; assets: WatchAsset[] } | { ok: false; reason: "full" | "dup" } {
  const current = listWatchAssets();
  if (current.some((a) => a.id === asset.id)) {
    return { ok: false, reason: "dup" };
  }
  if (current.length >= WATCHLIST_MAX) {
    return { ok: false, reason: "full" };
  }
  const next: WatchAsset[] = [
    ...current,
    {
      id: asset.id,
      symbol: asset.symbol.toUpperCase(),
      name: asset.name,
      addedAt: asset.addedAt ?? new Date().toISOString(),
    },
  ];
  watchlistStore.set({ assets: next });
  return { ok: true, assets: next };
}

export function removeWatchAsset(id: string): WatchAsset[] {
  const next = listWatchAssets().filter((a) => a.id !== id);
  watchlistStore.set({ assets: next });
  return next;
}

export function clearWatchlist(): void {
  watchlistStore.set({ assets: [] });
}
