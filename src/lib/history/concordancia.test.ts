import { buildConcordancia, CONCORD_SIGNALS } from "./concordancia";
import type { HistorySnapshot } from "./metrics";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function snap(map: Record<string, { t: string; v: number }[]>): HistorySnapshot {
  const out: HistorySnapshot = { windowDays: 90, series: {} };
  for (const [k, pts] of Object.entries(map)) {
    // @ts-expect-error — test helper
    out.series[k] = { points: pts, source: "test" };
  }
  return out;
}

function series(vals: number[], start = vals.length - 1) {
  return vals.map((v, i) => ({ t: daysAgo(start - i), v }));
}

describe("buildConcordancia", () => {
  it("counts same-direction signals per day", () => {
    // price rising every day; all signals rising too → full agreement
    const data = buildConcordancia(
      snap({
        price_btc: series([1, 2, 3, 4], 3),
        funding_btc: series([1, 2, 3, 4], 3),
        volume_btc: series([1, 2, 3, 4], 3),
      }),
    );
    const last = data.days[data.days.length - 1];
    assert.equal(last.agreed, 2);
    assert.equal(last.total, 2);
  });

  it("disagreement: signal falling while price rises does not count", () => {
    const data = buildConcordancia(
      snap({
        price_btc: series([1, 2, 3, 4], 3),
        funding_btc: series([4, 3, 2, 1], 3), // falling vs rising price
        volume_btc: series([1, 2, 3, 4], 3),
      }),
    );
    const last = data.days[data.days.length - 1];
    assert.equal(last.agreed, 1);
    assert.equal(last.total, 2);
  });

  it("zero-delta signals never agree (sameSign contract)", () => {
    const data = buildConcordancia(
      snap({
        price_btc: series([1, 2, 3, 4], 3),
        funding_btc: series([5, 5, 5, 5], 3), // flat → delta 0
        volume_btc: series([1, 2, 3, 4], 3),
      }),
    );
    const last = data.days[data.days.length - 1];
    assert.equal(last.agreed, 1); // só volume concorda; funding flat ≠ sinal
    assert.equal(last.total, 2);
  });

  it("gap day: price delta missing → no column (lacuna, não interpola)", () => {
    const price = series([1, 2], 1); // only yesterday + today
    price.push({ t: daysAgo(4), v: 9 }); // out-of-order older point
    const data = buildConcordancia(
      snap({ price_btc: price, volume_btc: series([1, 2, 3, 4, 5], 4) }),
    );
    // day with price but missing strict prev → skipped, never invented
    const dayKeys = data.days.map((d) => d.t);
    assert.ok(dayKeys.includes(daysAgo(0)));
    assert.ok(!dayKeys.includes(daysAgo(4)));
  });

  it("empty snapshot → empty days, honest", () => {
    const data = buildConcordancia(null);
    assert.equal(data.days.length, 0);
    assert.equal(data.signalCount, CONCORD_SIGNALS.length);
  });
});
