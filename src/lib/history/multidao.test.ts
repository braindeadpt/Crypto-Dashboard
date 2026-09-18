import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMultidao, quadrantOf } from "@/lib/history/multidao";
import type { HistorySnapshot } from "@/lib/history/metrics";
import type { SeriesPoint } from "@/lib/stats";

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

function series(values: number[], startDaysAgo: number): SeriesPoint[] {
  return values.map((v, i) => ({ t: daysAgo(startDaysAgo - i), v }));
}

function snap(seriesMap: Record<string, SeriesPoint[]>): HistorySnapshot {
  return {
    windowDays: 90,
    series: Object.fromEntries(
      Object.entries(seriesMap).map(([k, points]) => [
        k,
        { points, source: "test" },
      ]),
    ) as HistorySnapshot["series"],
  };
}

describe("quadrantOf", () => {
  it("names the four fields in plain terms", () => {
    assert.equal(quadrantOf(1.4, 2), "longsUp");
    assert.equal(quadrantOf(1.4, -2), "longsDown");
    assert.equal(quadrantOf(0.7, 2), "shortsUp");
    assert.equal(quadrantOf(0.7, -2), "shortsDown");
  });
  it("ratio ≈ 1 is a split crowd, not a side", () => {
    assert.equal(quadrantOf(1.0, 3), "balanced");
    assert.equal(quadrantOf(0.98, -3), "balanced");
  });
});

describe("buildMultidao", () => {
  it("pairs each ratio day with that day's price change", () => {
    const data = buildMultidao(
      snap({
        price_btc: series([100, 102, 101, 105], 3),
        ls_btc: series([1.2, 1.5, 0.9, 1.1], 3),
      }),
    );
    assert.ok(data);
    assert.equal(data.days.length, 3); // primeiro dia sem anterior → fora
    const d = data.days[0];
    assert.equal(d.ratio, 1.5);
    assert.ok(Math.abs(d.chgPct - 2) < 0.01); // 100 → 102
    assert.equal(d.quadrant, "longsUp");
  });

  it("drops days where price has no honest delta — no invented point", () => {
    const ls = series([1.3, 1.4], 1);
    const price = series([100, 104], 1);
    // dia isolado há 4 dias — sem anterior estrito
    ls.push({ t: daysAgo(4), v: 1.6 });
    price.push({ t: daysAgo(4), v: 90 });
    const data = buildMultidao(snap({ price_btc: price, ls_btc: ls }));
    assert.ok(data);
    assert.equal(data.days.length, 1); // só o dia com par completo
    assert.equal(data.days[0].t, daysAgo(0));
  });

  it("missing ratio series → null, field says so instead of drawing", () => {
    assert.equal(
      buildMultidao(snap({ price_btc: series([100, 101], 1) })),
      null,
    );
    assert.equal(buildMultidao(null), null);
  });
});
