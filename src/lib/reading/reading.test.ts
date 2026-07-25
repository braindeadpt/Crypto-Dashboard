import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildReadingSet,
  computeDirection,
  computeMoney,
  computeRisk,
  LOW_CONFIDENCE,
} from "@/lib/reading";

test("direcção: amplitude larga com preço a subir = muito positivo", () => {
  const r = computeDirection({
    btcChange24h: 4,
    ethChange24h: 5,
    breadthPct: 88,
    marketCapChange24h: 3.5,
  });
  assert.equal(r.band, "muito-positivo");
  assert.equal(r.confidence, 1);
  assert.equal(r.gaps.length, 0);
});

test("direcção: BTC a subir mas amplitude estreita não é subida ampla", () => {
  const forte = computeDirection({
    btcChange24h: 4,
    ethChange24h: 4,
    breadthPct: 85,
    marketCapChange24h: 3,
  });
  const estreita = computeDirection({
    btcChange24h: 4,
    ethChange24h: 4,
    breadthPct: 25,
    marketCapChange24h: 3,
  });
  // A amplitude tem o maior peso: a mesma subida de preço com amplitude
  // estreita tem de dar uma leitura materialmente mais fraca.
  assert.ok(
    estreita.value < forte.value - 25,
    `esperava leitura bem mais fraca, veio ${estreita.value} vs ${forte.value}`,
  );
});

test("ingrediente em falta: contribui zero, é nomeado e baixa a confiança", () => {
  const r = computeDirection({
    btcChange24h: 2,
    ethChange24h: null,
    breadthPct: null,
    marketCapChange24h: 1,
  });
  assert.ok(r.confidence < 1, "confiança devia descer");
  assert.deepEqual(
    r.gaps.map((g) => g.id).sort(),
    ["breadth", "eth"],
    "as lacunas têm de ser nomeadas, não silenciadas",
  );
  // Nenhum contributo inventado para as lacunas.
  assert.ok(!r.contributors.some((c) => c.id === "breadth" || c.id === "eth"));
});

test("sem dados nenhuns: confiança zero, sem valor inventado", () => {
  const r = computeMoney({});
  assert.equal(r.confidence, 0);
  assert.equal(r.value, 0);
  assert.equal(r.contributors.length, 0);
  assert.ok(r.gaps.length > 0);
});

test("risco: só magnitude, nunca negativo", () => {
  const calmo = computeRisk({
    oiChange24hPct: 0.2,
    fundingRate: 0.00001,
    realizedVolPct: 20,
    longShortRatio: 1.02,
    liquidationsUsd: 0,
  });
  const frágil = computeRisk({
    oiChange24hPct: 12,
    fundingRate: 0.0009,
    realizedVolPct: 120,
    longShortRatio: 2.8,
    liquidationsUsd: 90_000_000,
  });
  assert.ok(calmo.value >= 0, "risco nunca é negativo");
  assert.ok(frágil.value > calmo.value);
  assert.equal(frágil.band, "muito-negativo");
  assert.equal(calmo.band, "positivo");
});

test("risco: OI a cair conta como risco tanto quanto a subir (magnitude)", () => {
  const sobe = computeRisk({ oiChange24hPct: 10 });
  const desce = computeRisk({ oiChange24hPct: -10 });
  assert.equal(sobe.value, desce.value);
});

test("dinheiro: stablecoins a encolher e ETF a sair = saída", () => {
  const r = computeMoney({
    stableSupply7dPct: -1.8,
    etfCombinedUsdM: -500,
    tvlChange1dPct: -2,
  });
  assert.equal(r.band, "muito-negativo");
  assert.ok(r.value < 0);
});

test("manchete: avisa quando a leitura é parcial", () => {
  const parcial = buildReadingSet({ btcChange24h: 1 });
  assert.ok(
    parcial.headlinePt.includes("parcial"),
    "confiança baixa tem de ser dita na manchete",
  );

  const completa = buildReadingSet({
    btcChange24h: 1,
    ethChange24h: 1,
    breadthPct: 55,
    marketCapChange24h: 1,
    oiChange24hPct: 1,
    fundingRate: 0.0001,
    realizedVolPct: 40,
    longShortRatio: 1.1,
    liquidationsUsd: 1_000_000,
    stableSupply7dPct: 0.1,
    etfCombinedUsdM: 10,
    tvlChange1dPct: 0.1,
  });
  assert.ok(!completa.headlinePt.includes("parcial"));
  assert.ok(completa.direction.confidence >= LOW_CONFIDENCE);
});

test("vigiar hoje: devolve um só ponto, o de maior peso", () => {
  const set = buildReadingSet({
    btcChange24h: 0.2,
    ethChange24h: 0.1,
    breadthPct: 51,
    marketCapChange24h: 0.1,
    oiChange24hPct: 14,
    fundingRate: 0.00002,
    realizedVolPct: 25,
    longShortRatio: 1.01,
    liquidationsUsd: 0,
  });
  assert.ok(set.watchPt.length > 0);
  // O sinal dominante é a alavancagem, e é isso que tem de ser destacado.
  assert.ok(
    set.watchPt.toLowerCase().includes("alavancagem"),
    `esperava destaque da alavancagem, veio: ${set.watchPt}`,
  );
});
