import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeHealth, type HealthFile } from "@/lib/data/health";
import type { SourceId } from "@/lib/data/sources";

const NOW = "2026-09-20T10:00:00.000Z";

function results(
  entries: [SourceId, { ok: boolean; error?: string; points?: number }][],
) {
  return new Map(entries);
}

test("ok repõe consecutiveFailures a 0 e guarda lastOk/points", () => {
  const prev: HealthFile = {
    updatedAt: "x",
    sources: {
      coingecko: { lastOk: "old", lastError: "boom", consecutiveFailures: 3 },
    },
  };
  const out = mergeHealth(
    prev,
    NOW,
    results([["coingecko", { ok: true, points: 40 }]]),
  );
  const h = out.sources.coingecko!;
  assert.equal(h.lastOk, NOW);
  assert.equal(h.lastError, null);
  assert.equal(h.consecutiveFailures, 0);
  assert.equal(h.points, 40);
});

test("falha incrementa consecutiveFailures e guarda lastError", () => {
  const prev: HealthFile = {
    updatedAt: "x",
    sources: {
      farside: { lastOk: "2026-09-19T00:00:00Z", lastError: null, consecutiveFailures: 1 },
    },
  };
  const out = mergeHealth(
    prev,
    NOW,
    results([["farside", { ok: false, error: "HTTP 403" }]]),
  );
  const h = out.sources.farside!;
  assert.equal(h.consecutiveFailures, 2);
  assert.equal(h.lastError, "HTTP 403");
  assert.equal(h.lastOk, "2026-09-19T00:00:00Z");
});

test("fontes sem registo mantêm o estado anterior; desconhecidas nascem neutras", () => {
  const out = mergeHealth(null, NOW, new Map());
  assert.ok(out.sources.coingecko);
  assert.equal(out.sources.coingecko!.consecutiveFailures, 0);
  assert.equal(out.sources.coingecko!.lastOk, null);
});
