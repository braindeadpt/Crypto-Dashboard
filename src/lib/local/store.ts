/**
 * Generic browser-local persistence — no server.
 * Reused by watchlist now; designed for future Carteira (public addresses).
 */

export type LocalEnvelope<T> = {
  /** Schema version for migrations */
  version: number;
  updatedAt: string;
  data: T;
};

export type LocalStoreOptions<T> = {
  key: string;
  version: number;
  defaultValue: T;
  /** Return null to reject / fall back to default */
  validate?: (data: unknown) => data is T;
  migrate?: (fromVersion: number, data: unknown) => T | null;
};

type Listener = () => void;

const memory = new Map<string, unknown>();
const listeners = new Map<string, Set<Listener>>();

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function readRaw(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* quota / private mode */
  }
}

function parseEnvelope<T>(
  raw: string | null,
  opts: LocalStoreOptions<T>,
): LocalEnvelope<T> {
  const fallback: LocalEnvelope<T> = {
    version: opts.version,
    updatedAt: new Date(0).toISOString(),
    data: opts.defaultValue,
  };
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalEnvelope<unknown>>;
    const ver =
      typeof parsed.version === "number" ? parsed.version : 0;
    let data: unknown = parsed.data;

    if (ver !== opts.version && opts.migrate) {
      const migrated = opts.migrate(ver, data);
      if (migrated == null) return fallback;
      data = migrated;
    }

    if (opts.validate && !opts.validate(data)) return fallback;

    return {
      version: opts.version,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
      data: data as T,
    };
  } catch {
    return fallback;
  }
}

export function createLocalStore<T>(opts: LocalStoreOptions<T>) {
  const { key } = opts;

  function get(): LocalEnvelope<T> {
    if (memory.has(key)) {
      return memory.get(key) as LocalEnvelope<T>;
    }
    const env = parseEnvelope(readRaw(key), opts);
    memory.set(key, env);
    return env;
  }

  function set(data: T): LocalEnvelope<T> {
    const env: LocalEnvelope<T> = {
      version: opts.version,
      updatedAt: new Date().toISOString(),
      data,
    };
    memory.set(key, env);
    writeRaw(key, JSON.stringify(env));
    emit(key);
    return env;
  }

  function subscribe(cb: Listener): () => void {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(cb);
    return () => set!.delete(cb);
  }

  /** Portable JSON for download — includes product marker */
  function toExportBlob(product = "clareza"): Blob {
    const env = get();
    const payload = {
      product,
      kind: key,
      ...env,
    };
    return new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
  }

  /**
   * Import from file/JSON. Accepts envelope or bare `{ data }` / raw data.
   * Returns false if validation fails.
   */
  function importPayload(raw: unknown): boolean {
    try {
      let candidate: unknown = raw;
      if (
        candidate &&
        typeof candidate === "object" &&
        "data" in (candidate as object)
      ) {
        const env = candidate as Partial<LocalEnvelope<unknown>> & {
          kind?: string;
        };
        if (env.kind && env.kind !== key) return false;
        candidate = env.data;
        if (
          typeof env.version === "number" &&
          env.version !== opts.version &&
          opts.migrate
        ) {
          const migrated = opts.migrate(env.version, candidate);
          if (migrated == null) return false;
          candidate = migrated;
        }
      }
      if (opts.validate && !opts.validate(candidate)) return false;
      set(candidate as T);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * MUST return a stable reference. useSyncExternalStore compares snapshots by
   * identity, so building a fresh object per call made React see a "changed"
   * store on every render — the infinite loop behind
   * "The result of getServerSnapshot should be cached to avoid an infinite loop".
   */
  const serverSnapshot: LocalEnvelope<T> = {
    version: opts.version,
    updatedAt: new Date(0).toISOString(),
    data: opts.defaultValue,
  };

  function getServerSnapshot(): LocalEnvelope<T> {
    return serverSnapshot;
  }

  return {
    key,
    get,
    set,
    subscribe,
    toExportBlob,
    importPayload,
    getServerSnapshot,
  };
}

/** Trigger a file download in the browser (client-only). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Read a JSON file from an <input type=file>. */
export function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result)));
      } catch (e) {
        reject(e);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
