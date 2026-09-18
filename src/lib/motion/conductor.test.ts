import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AGITATION_CEILING,
  agitationFromRisk,
  AGITATION_FLOOR,
  conduct,
  MOTION_REST,
} from "@/lib/motion/conductor";
import type { ReadingSet } from "@/lib/reading";

function fakeReading(value: number, confidence = 1) {
  return {
    id: "risk" as const,
    value,
    band: "neutro" as const,
    confidence,
    contributors: [],
    gaps: [],
    sentencePt: "",
    sentenceEn: "",
  };
}

function fakeReadings({
  risk = 50,
  direction = 20,
  confidence = 1,
} = {}): ReadingSet {
  return {
    direction: { ...fakeReading(direction, confidence), id: "direction" },
    risk: fakeReading(risk, confidence),
    money: { ...fakeReading(0, confidence), id: "money" },
    headlinePt: "",
    headlineEn: "",
    headlineClaims: [],
    headlineCaveatPt: null,
    headlineCaveatEn: null,
    watchPt: "",
    watchEn: "",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

test("agitação: o ecrã nunca pára, nem com o mercado em repouso", () => {
  // A regra do produto: a maioria das visitas é em dias calmos, e é aí que o
  // ecrã tem de estar vivo. Risco zero não pode significar imobilidade.
  assert.equal(agitationFromRisk(0), AGITATION_FLOOR);
  assert.ok(agitationFromRisk(28) > AGITATION_FLOOR);
});

test("agitação: um dia normal já se move de forma perceptível", () => {
  // 28 é a leitura típica de um dia calmo — tem de dar movimento visível,
  // não um valor residual indistinguível de estar parado.
  assert.ok(agitationFromRisk(28) > 0.4);
});

test("agitação: o mercado modula a intensidade, não liga/desliga", () => {
  const calmo = agitationFromRisk(28);
  const tenso = agitationFromRisk(70);
  assert.ok(tenso > calmo * 1.5, "o stress tem de ser claramente mais agitado");
  assert.ok(agitationFromRisk(100) <= 1);
  // smoothstep: sem degraus ao longo da escala
  const a = agitationFromRisk(50);
  const b = agitationFromRisk(52);
  assert.ok(b - a < 0.05);
});

test("conduct: tecto de agitação respeitado num crash", () => {
  const s = conduct(fakeReadings({ risk: 100 }));
  assert.ok(s.agitation <= AGITATION_CEILING);
  assert.equal(s.agitation, AGITATION_CEILING);
});

test("conduct: prefers-reduced-motion vence sempre", () => {
  const s = conduct(fakeReadings({ risk: 100 }), { reduced: true });
  assert.deepEqual(s, MOTION_REST);
});

test("conduct: sem leituras é repouso", () => {
  assert.deepEqual(conduct(null), MOTION_REST);
});

test("conduct: confiança fraca força repouso — ecrã não finge energia", () => {
  const s = conduct(fakeReadings({ risk: 90, confidence: 0.4 }));
  assert.deepEqual(s, MOTION_REST);
});

test("conduct: temperatura vem da Direcção, limitada a [-1,1]", () => {
  assert.equal(conduct(fakeReadings({ direction: 55 })).temperature, 0.55);
  assert.equal(conduct(fakeReadings({ direction: -200 })).temperature, -1);
});

test("conduct: cadência encurta com volatilidade, sem série fica neutra", () => {
  const calm = conduct(fakeReadings(), { realizedVolPct: 10 });
  const wild = conduct(fakeReadings(), { realizedVolPct: 90 });
  const none = conduct(fakeReadings(), { realizedVolPct: null });
  assert.ok(wild.cadence < calm.cadence);
  assert.equal(none.cadence, 1);
  assert.ok(wild.cadence >= 0.55); // piso — nunca zero
});
