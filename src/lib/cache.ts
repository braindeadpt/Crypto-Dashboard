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

/**
 * TTL cache com *stale-while-error*.
 *
 * Porquê: as entradas expiram a cada 90s e a CoinGecko gratuita responde 429 com
 * frequência. Sem isto, a expiração punha o retry com backoff (1.2+2.4+3.6s) no
 * caminho de render e as páginas demoravam 7,3s — medido em produção.
 *
 * Com isto, uma falha a montante devolve o último valor bom em vez de esperar.
 * Dados ligeiramente velhos servidos de imediato valem mais do que dados
 * frescos que chegam sete segundos tarde — e continuam a ser dados REAIS,
 * nunca inventados.
 */
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

  try {
    const data = await cached();
    memory.set(key, { data, expires: Date.now() + ttlMs });
    return data;
  } catch (err) {
    if (hit) {
      // Prolonga a validade do valor antigo para não martelar a fonte a cada
      // pedido enquanto ela estiver a recusar.
      memory.set(key, { data: hit.data, expires: Date.now() + 30_000 });
      return hit.data;
    }
    throw err;
  }
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
