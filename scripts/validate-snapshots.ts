import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import {
  SNAPSHOT_SCHEMAS,
  validateSnapshot,
} from "../src/lib/data/schemas";

/**
 * npm run snapshots:validate — valida cada data/snapshots/*.json contra o
 * schema zod. Para history.json falha se alguma série tiver MENOS pontos do
 * que a versão em HEAD (regressão de dados = erro; o ingest nunca deve
 * encolher séries).
 */

const DIR = path.join(process.cwd(), "data", "snapshots");
const SCHEMA_NAMES = new Set(Object.keys(SNAPSHOT_SCHEMAS));

type SeriesBlob = { points?: { t: string; v: number }[] };
type HistoryFile = { series?: Record<string, SeriesBlob> };

function headHistory(): HistoryFile | null {
  try {
    const raw = execFileSync(
      "git",
      ["show", "HEAD:data/snapshots/history.json"],
      { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
    );
    return JSON.parse(raw) as HistoryFile;
  } catch {
    return null; // sem HEAD (primeiro commit) — nada para comparar
  }
}

let failures = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json"))) {
  const name = file.replace(/\.json$/, "");
  if (!SCHEMA_NAMES.has(name)) continue; // health.json e futuros sem schema
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(path.join(DIR, file), "utf8"));
  } catch (e) {
    console.error(`✗ ${file}: JSON inválido — ${e instanceof Error ? e.message : e}`);
    failures++;
    continue;
  }
  const check = validateSnapshot(name, data);
  if (!check.ok) {
    console.error(`✗ ${file}: ${check.error}`);
    failures++;
  } else {
    console.log(`✓ ${file}`);
  }
}

// Regressão de pontos em history.json vs HEAD
const curPath = path.join(DIR, "history.json");
if (existsSync(curPath)) {
  const prev = headHistory();
  const cur = JSON.parse(readFileSync(curPath, "utf8")) as HistoryFile;
  if (prev?.series && cur.series) {
    for (const [id, blob] of Object.entries(cur.series)) {
      const before = prev.series[id]?.points?.length;
      const now = blob.points?.length ?? 0;
      if (before != null && now < before) {
        console.error(
          `✗ history.json: série "${id}" encolheu ${before} → ${now} pontos`,
        );
        failures++;
      }
    }
  }
}

if (failures) {
  console.error(`\n${failures} problema(s) de validação.`);
  process.exit(1);
}
console.log("\nSnapshots válidos.");
