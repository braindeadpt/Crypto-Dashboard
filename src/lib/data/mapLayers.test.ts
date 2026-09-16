import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildSectorTagMap,
  fundingForAsset,
  medianTurnover,
  perpCandidates,
  turnoverOf,
  turnoverRatio,
} from "@/lib/data/mapLayers";
import type { SectorsSnapshot } from "@/lib/data/sectors";
import type { AssetQuote } from "@/lib/types";

function asset(partial: Partial<AssetQuote>): AssetQuote {
  return {
    id: "x",
    symbol: "X",
    name: "X",
    price: 1,
    change24h: 0,
    marketCap: 100,
    volume24h: 10,
    ...partial,
  };
}

describe("perpCandidates", () => {
  it("tries USDT, 1000-lot and USDC variants in order", () => {
    assert.deepEqual(perpCandidates("pepe"), [
      "PEPEUSDT",
      "1000PEPEUSDT",
      "PEPEUSDC",
      "1000PEPEUSDC",
    ]);
  });
});

describe("fundingForAsset", () => {
  const rates = {
    BTCUSDT: 12.5,
    "1000PEPEUSDT": -40.2,
    ETHUSDC: 5,
  };

  it("resolves direct and 1000-lot symbols", () => {
    assert.equal(fundingForAsset("BTC", rates), 12.5);
    assert.equal(fundingForAsset("PEPE", rates), -40.2);
    assert.equal(fundingForAsset("ETH", rates), 5);
  });

  it("returns null for assets without a perp — gap, never an estimate", () => {
    assert.equal(fundingForAsset("USDT", rates), null);
    assert.equal(fundingForAsset("LEO", rates), null);
  });
});

describe("buildSectorTagMap", () => {
  const snap = {
    thematic: [
      {
        id: "artificial-intelligence",
        name: "AI",
        marketCap: 1,
        change24h: 0,
        volume24h: 0,
        sharePct: 10,
        topCoinIds: ["bittensor", "bitcoin"],
        updatedAt: "",
      },
    ],
    mega: [
      {
        id: "layer-1",
        name: "Layer 1",
        marketCap: 1,
        change24h: 0,
        volume24h: 0,
        sharePct: 100,
        topCoinIds: ["bitcoin", "ethereum"],
        updatedAt: "",
      },
    ],
    rotation: [
      {
        id: "artificial-intelligence",
        name: "AI",
        shareDelta7d: 0.42,
        shareDelta30d: null,
        mcapChange7d: 8.1,
        mcapChange30d: null,
        sampleDays: 20,
      },
    ],
  } as unknown as SectorsSnapshot;

  it("tags top-3 coins; thematic claims before mega", () => {
    const map = buildSectorTagMap(snap);
    // bitcoin appears in both — thematic (with rotation) wins
    assert.equal(map["bitcoin"]?.name, "AI");
    assert.equal(map["bitcoin"]?.shareDelta7d, 0.42);
    assert.equal(map["ethereum"]?.name, "Layer 1");
    assert.equal(map["ethereum"]?.shareDelta7d, null);
    assert.equal(map["ethereum"]?.mcapChange7d, null);
  });

  it("returns empty map without a snapshot", () => {
    assert.deepEqual(buildSectorTagMap(null), {});
  });
});

describe("turnover layers", () => {
  it("computes turnover, cohort median and ratio honestly", () => {
    const assets = [
      asset({ id: "a", volume24h: 10, marketCap: 100 }), // 0.10
      asset({ id: "b", volume24h: 40, marketCap: 100 }), // 0.40
      asset({ id: "c", volume24h: 20, marketCap: 100 }), // 0.20
    ];
    assert.equal(turnoverOf(assets[0]), 0.1);
    assert.equal(medianTurnover(assets), 0.2);
    assert.equal(turnoverRatio(assets[1], 0.2), 2);
    assert.equal(turnoverRatio(assets[0], 0.2), 0.5);
  });

  it("never fabricates turnover without cap/volume", () => {
    const a = asset({ volume24h: 0 });
    assert.equal(turnoverOf(a), null);
    assert.equal(medianTurnover([a]), null);
    assert.equal(turnoverRatio(a, 0.2), null);
    assert.equal(turnoverRatio(asset({}), null), null);
  });
});
