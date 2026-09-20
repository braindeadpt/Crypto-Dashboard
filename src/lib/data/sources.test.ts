import { test } from "node:test";
import assert from "node:assert/strict";
import { SOURCES, type SourceId } from "@/lib/data/sources";

test("cada fonte tem host válido para URL https://", () => {
  for (const [id, def] of Object.entries(SOURCES)) {
    assert.equal(def.id, id);
    assert.ok(def.name.length > 0, `${id} sem nome`);
    const url = new URL(`https://${def.host}`);
    assert.ok(url.hostname.includes("."), `${id} host inválido: ${def.host}`);
    assert.ok(["live", "snapshot", "browser"].includes(def.kind));
    assert.ok(def.ttlSec >= 0);
    assert.ok(def.docsUrl.startsWith("https://"));
  }
});

test("ids esperados existem", () => {
  const ids = Object.keys(SOURCES) as SourceId[];
  for (const id of [
    "coingecko",
    "binance_rest",
    "binance_ws",
    "defillama",
    "farside",
    "mempool",
    "alternative",
    "etherscan",
    "dexscreener",
    "geckoterminal",
  ] as const) {
    assert.ok(ids.includes(id), `falta ${id}`);
  }
});
