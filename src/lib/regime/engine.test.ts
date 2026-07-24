import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  baselineRegimeInputs,
  computeBreadthPct,
  computeRegime,
} from "./engine";

describe("computeBreadthPct", () => {
  it("returns null for empty", () => {
    assert.equal(computeBreadthPct([]), null);
  });
  it("rounds share of green assets", () => {
    assert.equal(
      computeBreadthPct([
        { change24h: 1 },
        { change24h: -1 },
        { change24h: 0 },
        { change24h: -2 },
      ]),
      50,
    );
  });
});

describe("computeRegime posture boundaries", () => {
  it("calm when signals are mild", () => {
    const r = computeRegime(baselineRegimeInputs());
    assert.equal(r.posture, "calm");
    assert.ok(r.score < 32);
    assert.equal(r.contributors.length, 0);
  });

  it("F&G 28 + breadth 36% + BTC negative is NOT calm", () => {
    // Acceptance case from HANDOFF P7
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 28,
        breadthPct: 36,
        btcChange24h: -1.5,
      }),
    );
    assert.notEqual(r.posture, "calm");
    assert.ok(r.score >= 32);
    assert.ok(r.contributors.some((c) => c.id === "breadth"));
    assert.ok(r.contributors.some((c) => c.id === "fng"));
  });

  it("storm on stacked extremes", () => {
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 18,
        breadthPct: 28,
        btcChange24h: -9,
        // Mild funding — avoid "weird" contradiction (high funding + dump)
        fundingRate: 0.00005,
        oiChangeMaxAbsPct: 10,
        longShortRatio: 2.2,
        maxPegDeviationPct: 1.2,
        etfCombinedUsdM: -100,
      }),
    );
    assert.equal(r.posture, "storm");
    assert.ok(r.score >= 60);
  });

  it("unsettled around mid stress", () => {
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 35,
        breadthPct: 38,
        btcChange24h: -2.2,
      }),
    );
    assert.equal(r.posture, "unsettled");
  });

  it("weird when price and sentiment contradict under stress", () => {
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 22,
        btcChange24h: 4.5,
        breadthPct: 40,
      }),
    );
    assert.equal(r.posture, "weird");
  });

  it("ranks contributors by points", () => {
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 20,
        breadthPct: 30,
        btcChange24h: -5,
      }),
    );
    for (let i = 1; i < r.contributors.length; i++) {
      assert.ok(r.contributors[i - 1].points >= r.contributors[i].points);
    }
  });
});

describe("informal historical-style scenarios", () => {
  it("strong dump day → storm or unsettled, not calm", () => {
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 24,
        breadthPct: 22,
        btcChange24h: -7.5,
        ethChange24h: -9,
        solChange24h: -12,
        oiChangeMaxAbsPct: 9,
        fundingRate: -0.0004,
        etfCombinedUsdM: -420,
      }),
    );
    assert.ok(["storm", "unsettled", "weird"].includes(r.posture));
    assert.notEqual(r.posture, "calm");
  });

  it("quiet sideways day → calm", () => {
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 52,
        breadthPct: 55,
        btcChange24h: 0.3,
        ethChange24h: 0.4,
        solChange24h: -0.2,
        fundingRate: 0.00004,
        etfCombinedUsdM: 15,
      }),
    );
    assert.equal(r.posture, "calm");
  });

  it("euphoria melt-up → not calm", () => {
    const r = computeRegime(
      baselineRegimeInputs({
        fearGreed: 82,
        breadthPct: 88,
        btcChange24h: 6.5,
        fundingRate: 0.0006,
        longShortRatio: 1.9,
        oiChangeMaxAbsPct: 7,
        etfCombinedUsdM: 650,
      }),
    );
    assert.notEqual(r.posture, "calm");
  });
});
