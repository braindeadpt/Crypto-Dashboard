type CacheEntry<T> = { data: T; expires: number };

const store = new Map<string, CacheEntry<unknown>>();

export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  const data = await fetcher();
  store.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
