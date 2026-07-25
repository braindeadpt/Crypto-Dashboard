"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { AssetQuote } from "@/lib/types";
import {
  addWatchAsset,
  clearWatchlist,
  listWatchAssets,
  removeWatchAsset,
  watchlistStore,
  WATCHLIST_MAX,
  type WatchAsset,
} from "@/lib/local/watchlist";
import { downloadBlob, readJsonFile } from "@/lib/local/store";

type WatchlistContextValue = {
  assets: WatchAsset[];
  quotes: AssetQuote[];
  quotesLoading: boolean;
  max: number;
  add: (asset: Omit<WatchAsset, "addedAt">) => "ok" | "full" | "dup";
  remove: (id: string) => void;
  clear: () => void;
  has: (id: string) => boolean;
  exportFile: () => void;
  importFile: (file: File) => Promise<boolean>;
};

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

const quoteMemo = new Map<string, AssetQuote[]>();
const inflight = new Map<string, Promise<AssetQuote[]>>();

function loadQuotes(idsKey: string): Promise<AssetQuote[]> {
  if (!idsKey) return Promise.resolve([]);
  const hit = quoteMemo.get(idsKey);
  if (hit) return Promise.resolve(hit);
  const pending = inflight.get(idsKey);
  if (pending) return pending;
  const p = fetch(`/api/market/quotes?ids=${encodeURIComponent(idsKey)}`)
    .then(async (res) => {
      if (!res.ok) return [] as AssetQuote[];
      const json = (await res.json()) as { quotes: AssetQuote[] };
      return json.quotes ?? [];
    })
    .catch(() => [] as AssetQuote[])
    .then((quotes) => {
      quoteMemo.set(idsKey, quotes);
      inflight.delete(idsKey);
      return quotes;
    });
  inflight.set(idsKey, p);
  return p;
}

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const env = useSyncExternalStore(
    watchlistStore.subscribe,
    () => watchlistStore.get(),
    () => watchlistStore.getServerSnapshot(),
  );
  const assets = env.data.assets;
  const idsKey = assets.map((a) => a.id).join(",");

  const [quotes, setQuotes] = useState<AssetQuote[]>(
    () => (idsKey ? quoteMemo.get(idsKey) ?? [] : []),
  );

  useEffect(() => {
    if (!idsKey) return;
    let cancelled = false;
    void loadQuotes(idsKey).then((list) => {
      if (!cancelled) setQuotes(list);
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const add = useCallback((asset: Omit<WatchAsset, "addedAt">) => {
    const res = addWatchAsset(asset);
    if (!res.ok) return res.reason;
    return "ok" as const;
  }, []);

  const remove = useCallback((id: string) => {
    removeWatchAsset(id);
  }, []);

  const clear = useCallback(() => {
    clearWatchlist();
  }, []);

  const has = useCallback(
    (id: string) => assets.some((a) => a.id === id),
    [assets],
  );

  const exportFile = useCallback(() => {
    const blob = watchlistStore.toExportBlob();
    const day = new Date().toISOString().slice(0, 10);
    downloadBlob(blob, `clareza-watchlist-${day}.json`);
  }, []);

  const importFile = useCallback(async (file: File) => {
    try {
      const json = await readJsonFile(file);
      return watchlistStore.importPayload(json);
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<WatchlistContextValue>(
    () => ({
      assets,
      quotes: idsKey ? quotes : [],
      quotesLoading: Boolean(idsKey) && !quoteMemo.has(idsKey),
      max: WATCHLIST_MAX,
      add,
      remove,
      clear,
      has,
      exportFile,
      importFile,
    }),
    [assets, quotes, idsKey, add, remove, clear, has, exportFile, importFile],
  );

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    return {
      assets: listWatchAssets(),
      quotes: [],
      quotesLoading: false,
      max: WATCHLIST_MAX,
      add: () => "full",
      remove: () => {},
      clear: () => {},
      has: () => false,
      exportFile: () => {},
      importFile: async () => false,
    };
  }
  return ctx;
}
