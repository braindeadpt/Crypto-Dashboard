import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeDayDeltas } from "@/lib/history/deltas";
import type { HistorySnapshot } from "@/lib/history/metrics";

describe("computeDayDeltas", () => {
  it("marks fear_greed notable when abs change >= 5", () => {
    const series: HistorySnapshot["series"] = {
      fear_greed: {
        points: [
          { t: "2026-07-24", v: 20 },
          { t: "2026-07-25", v: 28 },
        ],
        source: "test",
      },
      funding_btc: {
        points: [
          { t: "2026-07-24", v: 0.00001 },
          { t: "2026-07-25", v: 0.000012 },
        ],
        source: "test",
      },
    } as HistorySnapshot["series"];

    const deltas = computeDayDeltas(series);
    const fg = deltas.find((d) => d.metricId === "fear_greed");
    const fund = deltas.find((d) => d.metricId === "funding_btc");
    assert.ok(fg?.notable);
    assert.equal(fg?.absChange, 8);
    assert.equal(fund?.notable, false);
  });

  it("returns empty when fewer than 2 points", () => {
    const deltas = computeDayDeltas({
      fear_greed: { points: [{ t: "2026-07-25", v: 28 }], source: "test" },
    } as HistorySnapshot["series"]);
    assert.equal(deltas.length, 0);
  });
});
