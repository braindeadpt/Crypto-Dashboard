import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { SNAPSHOT_SCHEMAS, validateSnapshot } from "@/lib/data/schemas";

const DIR = path.join(process.cwd(), "data", "snapshots");

test("os snapshots actuais em disco passam nos schemas", () => {
  for (const name of Object.keys(SNAPSHOT_SCHEMAS)) {
    const file = path.join(DIR, `${name}.json`);
    const data = JSON.parse(readFileSync(file, "utf8"));
    const res = validateSnapshot(name, data);
    assert.ok(res.ok, `${name}: ${res.ok === false ? res.error : ""}`);
  }
});

test("snapshot vazio é recusado", () => {
  assert.equal(validateSnapshot("market", {}).ok, false);
  assert.equal(
    validateSnapshot("history", { windowDays: 90, series: {}, updatedAt: "x" }).ok,
    true,
  );
  assert.equal(validateSnapshot("desconhecido", {}).ok, false);
});
