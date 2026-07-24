/**
 * Process-local TTL cache + Next unstable_cache for slim results.
 *
 * Heavy DefiLlama payloads are NOT cached here — they are reduced offline into
 * data/snapshots/*.json (see refreshHeavy.ts). This module only memoises small
 * JSON (<2MB) across requests within a warm process / Next data cache.
 */

import { unstable_cache } from "next/cache";

type CacheEntry<T> = { data: T; expires: number };

const memory = new Map<string, CacheEntry<unknown>>();

export async function cachedFetch<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const hit = memory.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expires > Date.now()) {
    return hit.data;
  }

  const revalidateSec = Math.max(30, Math.round(ttlMs / 1000));
  const cached = unstable_cache(fetcher, [key], {
    revalidate: revalidateSec,
    tags: [key.split(":")[0] ?? "data"],
  });

  const data = await cached();
  memory.set(key, { data, expires: Date.now() + ttlMs });
  return data;
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    memory.clear();
    return;
  }
  for (const key of memory.keys()) {
    if (key.startsWith(prefix)) memory.delete(key);
  }
}
