import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateSnapshot } from "@/lib/data/schemas";

/**
 * Persistent slim snapshots for heavy DefiLlama payloads.
 *
 * Why: yields.llama.fi/pools (~11MB) and api.llama.fi/protocols (~8MB) cannot
 * live on the render path — Next data cache rejects >2MB and cold renders stall.
 * Ingest writes a reduced JSON blob; readers only touch that blob (<50KB).
 *
 * Storage: data/snapshots/*.json on disk (survives process restart locally /
 * long-lived Node). On ephemeral serverless, pair with unstable_cache on the
 * slim result and a cron hitting /api/cron/refresh-heavy.
 */

const DIR = path.join(process.cwd(), "data", "snapshots");

export type SnapshotMeta = {
  updatedAt: string;
  source: string;
};

export async function readSnapshot<T>(name: string): Promise<(T & SnapshotMeta) | null> {
  try {
    const raw = await readFile(path.join(DIR, `${name}.json`), "utf8");
    return JSON.parse(raw) as T & SnapshotMeta;
  } catch {
    return null;
  }
}

export async function writeSnapshot<T extends object>(
  name: string,
  data: T,
  source: string,
): Promise<T & SnapshotMeta> {
  await mkdir(DIR, { recursive: true });
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
    source,
  };
  /**
   * Nunca gravar inválido/vazio por cima de um snapshot bom: valida o payload,
   * e em falha mantém o anterior em disco (o ingest continua para as outras
   * fontes). Sem anterior, recusa mesmo assim — um ficheiro mau é pior que
   * nenhum.
   */
  const check = validateSnapshot(name, payload);
  if (!check.ok) {
    const prev = await readSnapshot<Record<string, unknown>>(name);
    console.warn(
      `[snapshot ${name}] escrita recusada: ${check.error}` +
        (prev ? " — mantido o anterior" : " — sem anterior"),
    );
    if (prev) return prev as T & SnapshotMeta;
    throw new Error(`snapshot ${name} inválido: ${check.error}`);
  }
  await writeFile(
    path.join(DIR, `${name}.json`),
    JSON.stringify(payload),
    "utf8",
  );
  return payload;
}

export function snapshotAgeMs(updatedAt: string | undefined): number | null {
  if (!updatedAt) return null;
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return null;
  return Date.now() - t;
}

export function isSnapshotStale(
  updatedAt: string | undefined,
  maxAgeMs: number,
): boolean {
  const age = snapshotAgeMs(updatedAt);
  if (age == null) return true;
  return age > maxAgeMs;
}
