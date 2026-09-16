import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  etfCumulativeSeries,
  etfRecordDays,
  etfWeeklyDelta,
} from "@/lib/data/etfDerived";
import type { EtfDailyFlow } from "@/lib/data/etf";

function day(date: string, totalUsdM: number): EtfDailyFlow {
  return { date, dateLabel: date, totalUsdM, byTicker: {} };
}

describe("etfCumulativeSeries", () => {
  it("builds a running sum over the sample", () => {
    const cum = etfCumulativeSeries([
      day("2026-09-01", 100),
      day("2026-09-02", -40),
      day("2026-09-03", 10),
    ]);
    assert.deepEqual(
      cum.map((p) => p.cumUsdM),
      [100, 60, 70],
    );
  });

  it("returns empty for empty history", () => {
    assert.deepEqual(etfCumulativeSeries([]), []);
  });
});

describe("etfRecordDays", () => {
  it("finds the largest inflow and outflow inside the sample", () => {
    const rec = etfRecordDays([
      day("2026-09-01", 100),
      day("2026-09-02", 500),
      day("2026-09-03", -200),
      day("2026-09-04", -50),
      day("2026-09-05", 0),
    ]);
    assert.equal(rec.inflow?.date, "2026-09-02");
    assert.equal(rec.inflow?.totalUsdM, 500);
    assert.equal(rec.outflow?.date, "2026-09-03");
    assert.equal(rec.outflow?.totalUsdM, -200);
  });

  it("returns null on the missing side — never an invented record", () => {
    const rec = etfRecordDays([day("2026-09-01", 10)]);
    assert.equal(rec.inflow?.totalUsdM, 10);
    assert.equal(rec.outflow, null);
    assert.deepEqual(etfRecordDays([]), { inflow: null, outflow: null });
  });
});

describe("etfWeeklyDelta", () => {
  it("compares the last 5 days with the previous 5", () => {
    const history = [
      day("d1", 10),
      day("d2", 10),
      day("d3", 10),
      day("d4", 10),
      day("d5", 10), // prev5 = 50
      day("d6", 20),
      day("d7", 20),
      day("d8", -10),
      day("d9", 30),
      day("d10", 40), // last5 = 100
    ];
    const w = etfWeeklyDelta(history);
    assert.equal(w.last5, 100);
    assert.equal(w.prev5, 50);
  });

  it("declares prev5 a gap under 10 days — no partial-week invention", () => {
    const w = etfWeeklyDelta([day("d1", 5), day("d2", 5)]);
    assert.equal(w.last5, 10);
    assert.equal(w.prev5, null);
    assert.deepEqual(etfWeeklyDelta([]), { last5: null, prev5: null });
  });
});
