import { buildCorrentes, MIN_DAYS } from "./correntes";
import type { HistorySnapshot } from "./metrics";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function series(n: number, fn: (i: number) => number) {
  return Array.from({ length: n }, (_, i) => ({
    t: daysAgo(n - 1 - i),
    v: fn(i),
  }));
}

function snap(map: Record<string, { t: string; v: number }[]>): HistorySnapshot {
  const out: HistorySnapshot = {
    windowDays: 90,
    series: {},
  };
  for (const [k, pts] of Object.entries(map)) {
    // @ts-expect-error — test helper fills arbitrary metric ids
    out.series[k] = { points: pts, source: "test" };
  }
  return out;
}

describe("buildCorrentes", () => {
  it("includes the nine band series when sample ≥ MIN_DAYS", () => {
    const data = buildCorrentes(
      snap({
        price_btc: series(90, (i) => 100 + i),
        funding_btc: series(90, () => 0.0001),
        oi_btc: series(30, (i) => 1e9 + i),
        fear_greed: series(90, () => 50),
        tvl: series(90, () => 8e10),
        volume_btc: series(90, () => 2e10),
        vol_realized_btc: series(90, () => 40),
        stablecoin_supply: series(90, () => 3e11),
        etf_btc_flow: series(27, () => 100),
      }),
    );
    assert.equal(data.series.length, 9);
    assert.equal(data.series[0].id, "price_btc");
  });

  it("routes short-sample series to shortSample, never to bands", () => {
    const data = buildCorrentes(
      snap({
        price_btc: series(90, (i) => 100 + i),
        fee_btc: series(3, () => 5),
        breadth: series(2, () => 60),
        btc_dominance: series(1, () => 58),
      }),
    );
    const ids = data.series.map((s) => s.id);
    assert.ok(!ids.includes("fee_btc"));
    assert.deepEqual(
      data.shortSample.sort(),
      ["breadth", "btc_dominance", "fee_btc"].sort(),
    );
  });

  it("normalizes to own median — scale is max |dev|", () => {
    const data = buildCorrentes(
      snap({ price_btc: series(90, (i) => 100 + i) }),
    );
    const s = data.series[0];
    assert.ok(s.median != null);
    assert.equal(s.scale, Math.max(...s.points.map((p) => Math.abs(p.v - s.median!))));
    // rising series → latest above median → positive dev exists
    assert.ok(s.latest! > s.median!);
  });

  it("keeps real gaps — no interpolation of points", () => {
    const pts = series(20, () => 10);
    const withGap = [...pts.slice(0, 10), ...pts.slice(10)]; // still 20 real
    const data = buildCorrentes(snap({ price_btc: withGap }));
    assert.equal(data.series[0].points.length, 20);
  });

  it("sorts points by timestamp", () => {
    const pts = series(30, (i) => i);
    const shuffled = [...pts].reverse();
    const data = buildCorrentes(snap({ price_btc: shuffled }));
    const ts = data.series[0].points.map((p) => p.t);
    assert.deepEqual(ts, [...ts].sort());
  });

  it("handles null snapshot honestly", () => {
    const data = buildCorrentes(null);
    assert.equal(data.series.length, 0);
    assert.equal(data.windowDays, 90);
  });

  it("MIN_DAYS gate: 13 days is short, 14 is a corrente", () => {
    const short = buildCorrentes(snap({ price_btc: series(MIN_DAYS - 1, () => 5) }));
    assert.equal(short.series.length, 0);
    assert.ok(short.shortSample.includes("price_btc"));
    const ok = buildCorrentes(snap({ price_btc: series(MIN_DAYS, () => 5) }));
    assert.equal(ok.series.length, 1);
  });
});
