import { test } from "node:test";
import assert from "node:assert/strict";
import {
  _resetBreakers,
  breakerState,
  cachedFetch,
  clearCache,
} from "@/lib/cache";

function failing(msg: string) {
  return () => Promise.reject(new Error(msg));
}

test("serve valor fresco dentro do TTL", async () => {
  _resetBreakers();
  clearCache();
  let calls = 0;
  const v = await cachedFetch("t:a", 60_000, async () => {
    calls++;
    return 42;
  });
  assert.equal(v, 42);
  const v2 = await cachedFetch("t:a", 60_000, async () => {
    calls++;
    return 43;
  });
  assert.equal(v2, 42);
  assert.equal(calls, 1);
});

test("falha sem stale propaga o erro", async () => {
  _resetBreakers();
  clearCache();
  await assert.rejects(
    cachedFetch("t:b", 60_000, failing("CoinGecko 500: /x")),
    /500/,
  );
});

test("falha com stale serve o último bom", async () => {
  _resetBreakers();
  clearCache();
  const good = await cachedFetch("t:c", 1, async () => "bom");
  assert.equal(good, "bom");
  await new Promise((r) => setTimeout(r, 5)); // expira o TTL
  const stale = await cachedFetch("t:c", 1, failing("CoinGecko 429"));
  assert.equal(stale, "bom");
});

test("3 falhas 429 seguidas abrem o circuito e servem stale sem rede", async () => {
  _resetBreakers();
  clearCache();
  // Stale entry na família "t2".
  await cachedFetch("t2:d", 1, async () => "bom");
  await new Promise((r) => setTimeout(r, 5));
  // Abre o circuito com falhas noutra chave da mesma fonte (sem stale).
  for (let i = 0; i < 3; i++) {
    await assert.rejects(
      cachedFetch(`t2:x${i}`, 60_000, failing("HTTP 429")),
    );
  }
  assert.equal(breakerState("t2").openUntil > Date.now(), true);
  // Com o circuito aberto, a chave com stale é servida sem bater à rede.
  let calls = 0;
  const v = await cachedFetch("t2:d", 1, () => {
    calls++;
    return Promise.resolve("novo");
  });
  assert.equal(v, "bom");
  assert.equal(calls, 0);
});

test("breaker aberto sem stale falha sem chamar a rede", async () => {
  _resetBreakers();
  clearCache();
  for (let i = 0; i < 3; i++) {
    await assert.rejects(
      cachedFetch("t:e", 60_000, failing("CoinGecko 503")),
    );
  }
  assert.equal(breakerState("t").openUntil > Date.now(), true);
  let calls = 0;
  await assert.rejects(
    cachedFetch("t:e", 60_000, () => {
      calls++;
      return Promise.resolve(1);
    }),
    /circuit-breaker/,
  );
  assert.equal(calls, 0);
});

test("sucesso repõe o contador de falhas", async () => {
  _resetBreakers();
  clearCache();
  await assert.rejects(cachedFetch("t:f", 1, failing("HTTP 500")));
  await assert.rejects(cachedFetch("t:f", 1, failing("HTTP 500")));
  assert.equal(breakerState("t").failures, 2);
  await cachedFetch("t:f", 1, async () => "ok");
  assert.equal(breakerState("t").failures, 0);
});
