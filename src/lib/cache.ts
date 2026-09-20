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

/* ------------------------------------------------------------------ */
/* Circuit-breaker por fonte (prefixo da chave = host/família).        */
/* 3 falhas 429/5xx seguidas abrem o circuito durante 5 min: serve-se   */
/* o último valor bom sem bater à rede; sem stale, falha como antes.   */
/* ------------------------------------------------------------------ */

const BREAKER_THRESHOLD = 3;
const BREAKER_OPEN_MS = 300_000;

type BreakerState = { failures: number; openUntil: number };
const breakers = new Map<string, BreakerState>();

/** 429 e 5xx contam para o circuito; erros de rede/parse também (upstream morto). */
function countsTowardBreaker(err: unknown): boolean {
  if (err instanceof Error) {
    if (/\b(429|5\d{2})\b/.test(err.message)) return true;
    // fetch falhou sem resposta (DNS, timeout, reset)
    if (/fetch failed|network|timeout|abort/i.test(err.message)) return true;
  }
  return false;
}

export function breakerState(prefix: string): BreakerState {
  return breakers.get(prefix) ?? { failures: 0, openUntil: 0 };
}

function noteSourceSuccess(prefix: string) {
  breakers.delete(prefix);
}

function noteSourceFailure(prefix: string, err: unknown) {
  if (!countsTowardBreaker(err)) return;
  const cur = breakerState(prefix);
  const failures = cur.failures + 1;
  breakers.set(prefix, {
    failures,
    openUntil: failures >= BREAKER_THRESHOLD ? Date.now() + BREAKER_OPEN_MS : 0,
  });
}

function isBreakerOpen(prefix: string): boolean {
  const b = breakers.get(prefix);
  if (!b || b.openUntil === 0) return false;
  if (b.openUntil > Date.now()) return true;
  // Janela fechou — half-open: deixa passar um pedido real.
  breakers.delete(prefix);
  return false;
}

/** Só para testes. */
export function _resetBreakers() {
  breakers.clear();
}

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

  const sourceKey = key.split(":")[0] ?? "data";

  // Circuito aberto: não bater à rede — serve o stale ou propaga a falha.
  if (isBreakerOpen(sourceKey)) {
    if (hit) return hit.data;
    throw new Error(`circuit-breaker aberto para ${sourceKey}`);
  }

  const revalidateSec = Math.max(30, Math.round(ttlMs / 1000));
  const cached = unstable_cache(fetcher, [key], {
    revalidate: revalidateSec,
    tags: [sourceKey],
  });

  try {
    // Fora do servidor Next (scripts, testes) não há incrementalCache —
    // corre o fetcher directamente, a camada de memória continua a valer.
    const data = await cached().catch((err: unknown) => {
      if (
        err instanceof Error &&
        err.message.includes("incrementalCache missing")
      ) {
        return fetcher() as Promise<T>;
      }
      throw err;
    });
    memory.set(key, { data, expires: Date.now() + ttlMs });
    noteSourceSuccess(sourceKey);
    return data;
  } catch (err) {
    noteSourceFailure(sourceKey, err);
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
