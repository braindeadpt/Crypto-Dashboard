import {
  classifyByPercentile,
  computeMetricContext,
  percentileRank,
} from "./context";
import { describe, it } from "node:test";
import assert from "node:assert/strict";

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

describe("percentileRank", () => {
  it("ranks mid-distribution", () => {
    const sorted = [1, 2, 3, 4, 5];
    assert.equal(percentileRank(sorted, 3), 50);
  });
  it("handles ties with mid-rank", () => {
    const sorted = [1, 2, 2, 2, 5];
    assert.equal(percentileRank(sorted, 2), 50);
  });
});

describe("computeMetricContext", () => {
  it("reports insufficient when few samples", () => {
    const points = Array.from({ length: 5 }, (_, i) => ({
      t: daysAgo(4 - i),
      v: i,
    }));
    const ctx = computeMetricContext(points, { value: 4 });
    assert.ok(ctx);
    assert.equal(ctx!.classification, "insufficient");
    assert.equal(ctx!.sampleDays, 5);
  });

  it("does not pretend 90 days when only 12 exist", () => {
    const points = Array.from({ length: 12 }, (_, i) => ({
      t: daysAgo(11 - i),
      v: i * 10,
    }));
    const ctx = computeMetricContext(points, { value: 110, windowDays: 90 });
    assert.ok(ctx);
    assert.equal(ctx!.sampleDays, 12);
    assert.equal(ctx!.windowDays, 90);
    assert.ok(ctx!.percentile != null && ctx!.percentile > 90);
  });

  it("classifies extremes by percentile", () => {
    assert.equal(classifyByPercentile(3, 30), "extreme_low");
    assert.equal(classifyByPercentile(15, 30), "low");
    assert.equal(classifyByPercentile(50, 30), "normal");
    assert.equal(classifyByPercentile(90, 30), "high");
    assert.equal(classifyByPercentile(97, 30), "extreme_high");
  });
});
