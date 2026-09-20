import path from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { SOURCES, type SourceId } from "@/lib/data/sources";

/**
 * Saúde por fonte (DESENHO-V5 §5.4). O ingest regista recordOk/recordError por
 * fonte; no fim flushHealth() faz merge com o ficheiro anterior — uma falha
 * incrementa consecutiveFailures, um ok repõe a 0. Fontes sem registo nesta
 * corrida (browser WS, etherscan por-pedido) mantêm o estado anterior.
 */

export type SourceHealth = {
  lastOk: string | null;
  lastError: string | null;
  consecutiveFailures: number;
  points?: number;
};

export type HealthFile = {
  updatedAt: string;
  sources: Partial<Record<SourceId, SourceHealth>>;
};

const FILE = path.join(process.cwd(), "data", "snapshots", "health.json");

type Pending = { ok: boolean; error?: string; points?: number };
const pending = new Map<SourceId, Pending>();

/** Marca sucesso da fonte nesta corrida de ingest. */
export function recordOk(id: SourceId, points?: number) {
  pending.set(id, { ok: true, points });
}

/** Marca falha da fonte nesta corrida de ingest. */
export function recordError(id: SourceId, msg: string) {
  pending.set(id, { ok: false, error: msg.slice(0, 300) });
}

export async function readHealth(): Promise<HealthFile | null> {
  try {
    const raw = await readFile(FILE, "utf8");
    return JSON.parse(raw) as HealthFile;
  } catch {
    return null;
  }
}

/**
 * Merge puro — exposto para testes. `prev` pode não ter a fonte.
 */
export function mergeHealth(
  prev: HealthFile | null,
  now: string,
  results: ReadonlyMap<SourceId, Pending>,
): HealthFile {
  const sources: HealthFile["sources"] = { ...(prev?.sources ?? {}) };
  for (const id of Object.keys(SOURCES) as SourceId[]) {
    if (!sources[id]) {
      sources[id] = { lastOk: null, lastError: null, consecutiveFailures: 0 };
    }
  }
  for (const [id, r] of results) {
    const cur = sources[id] ?? {
      lastOk: null,
      lastError: null,
      consecutiveFailures: 0,
    };
    if (r.ok) {
      sources[id] = {
        lastOk: now,
        lastError: null,
        consecutiveFailures: 0,
        ...(r.points != null ? { points: r.points } : cur.points != null ? { points: cur.points } : {}),
      };
    } else {
      sources[id] = {
        ...cur,
        lastError: r.error ?? "unknown",
        consecutiveFailures: cur.consecutiveFailures + 1,
      };
    }
  }
  return { updatedAt: now, sources };
}

/** Escreve o merge dos registos pendentes. Idempotente por corrida. */
export async function flushHealth(): Promise<HealthFile> {
  const prev = await readHealth();
  const merged = mergeHealth(prev, new Date().toISOString(), pending);
  pending.clear();
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(merged), "utf8");
  return merged;
}
