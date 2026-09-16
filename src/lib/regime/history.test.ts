import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeRegimeHistory } from "@/lib/regime/history";
import type { HistorySnapshot } from "@/lib/history/metrics";

function pts(dayValues: [string, number][]) {
  return { points: dayValues.map(([t, v]) => ({ t, v })), source: "test" };
}

describe("computeRegimeHistory", () => {
  it("computes a stress score per day from recorded signals only", () => {
    const series = {
      fear_greed: pts([
        ["2026-07-23", 20],
        ["2026-07-24", 22],
        ["2026-07-25", 80],
      ]),
      price_btc: pts([
        ["2026-07-22", 100000],
        ["2026-07-23", 95000],
        ["2026-07-24", 96000],
        ["2026-07-25", 90000],
      ]),
      funding_btc: pts([
        ["2026-07-23", 0.00001],
        ["2026-07-24", 0.00001],
        ["2026-07-25", 0.0006],
      ]),
    } as HistorySnapshot["series"];

    const days = computeRegimeHistory(series);
    assert.equal(days.length, 3);

    const calmDay = days.find((d) => d.t === "2026-07-24");
    const stormyDay = days.find((d) => d.t === "2026-07-25");
    assert.ok(stormyDay && calmDay);
    // 2026-07-25: F&G 80 (greed) + funding 6bps + BTC -6.25% → much higher stress
    assert.ok(stormyDay.score > calmDay.score);
    // 3 of 6 core signals present → honest coverage
    assert.equal(stormyDay.coverage, 0.5);
  });

  it("skips days with fewer than 2 signals — never a one-input regime", () => {
    const series = {
      fear_greed: pts([
        ["2026-07-24", 50],
        ["2026-07-25", 55],
      ]),
    } as HistorySnapshot["series"];

    assert.equal(computeRegimeHistory(series).length, 0);
  });

  it("does not fabricate a 24h move across a missing day", () => {
    const series = {
      fear_greed: pts([
        ["2026-07-20", 30],
        ["2026-07-25", 30],
      ]),
      price_btc: pts([
        ["2026-07-20", 100000],
        // days 21–24 missing → no day-over-day delta on the 25th
        ["2026-07-25", 80000],
      ]),
      funding_btc: pts([
        ["2026-07-20", 0.00001],
        ["2026-07-25", 0.00001],
      ]),
    } as HistorySnapshot["series"];

    const days = computeRegimeHistory(series);
    const d25 = days.find((d) => d.t === "2026-07-25");
    assert.ok(d25);
    // BTC move uncounted → score only from F&G 30 (12 pts ladder)
    assert.equal(d25.score, 12);
  });

  it("returns empty without series", () => {
    assert.equal(computeRegimeHistory(undefined).length, 0);
    assert.equal(computeRegimeHistory({}).length, 0);
  });
});
