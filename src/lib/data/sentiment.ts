import { fetchFundingRate, fetchForceOrders, fetchOpenInterest } from "@/lib/data/binance";
import { fetchOiChange24hPct } from "@/lib/data/derivatives";
import { fetchFearGreed } from "@/lib/data/feargreed";
import type { LiquidationWeather, SentimentSnapshot } from "@/lib/types";

export async function fetchSentimentSnapshot(): Promise<SentimentSnapshot> {
  const [fng, funding, oi, force, oiChg] = await Promise.all([
    fetchFearGreed(),
    fetchFundingRate("BTCUSDT"),
    fetchOpenInterest("BTCUSDT"),
    fetchForceOrders("BTCUSDT", 80),
    fetchOiChange24hPct("BTCUSDT").catch(() => null),
  ]);

  const fundingBias =
    funding.rate > 0.0001 ? "long" : funding.rate < -0.0001 ? "short" : "neutral";

  const longLiq = force.filter((f) => f.side === "SELL");
  const shortLiq = force.filter((f) => f.side === "BUY");
  const longNotional = longLiq.reduce((s, f) => s + f.notional, 0);
  const shortNotional = shortLiq.reduce((s, f) => s + f.notional, 0);
  const recentForceNotional = longNotional + shortNotional;

  const mark = funding.markPrice;
  const leverages = [5, 10, 25, 50, 100];
  const zones: LiquidationWeather["zones"] = [];

  for (const lev of leverages) {
    const longLiqPrice = mark * (1 - 1 / lev);
    const shortLiqPrice = mark * (1 + 1 / lev);
    const density = Math.max(0.15, 1 - lev / 120);
    zones.push({ price: longLiqPrice, density, side: "long" });
    zones.push({ price: shortLiqPrice, density, side: "short" });
  }

  for (const f of force.slice(0, 30)) {
    zones.push({
      price: f.price,
      density: Math.min(1, f.notional / (mark * 5)),
      side: f.side === "SELL" ? "long" : "short",
    });
  }

  const bias: LiquidationWeather["bias"] =
    longNotional > shortNotional * 1.25
      ? "long"
      : shortNotional > longNotional * 1.25
        ? "short"
        : "neutral";

  const intensity = Math.min(
    100,
    Math.round(
      (recentForceNotional / Math.max(mark, 1)) * 2 +
        Math.abs(funding.rate) * 500000,
    ),
  );

  return {
    fearGreed: fng,
    funding: {
      rate: funding.rate,
      annualized: funding.annualized,
      bias: fundingBias,
    },
    openInterest: {
      value: oi.value * mark,
      change24hPct: oiChg,
    },
    liquidationWeather: {
      bias,
      intensity,
      zones: zones.sort((a, b) => a.price - b.price),
      recentForceNotional,
      note: "estimated",
    },
    updatedAt: new Date().toISOString(),
  };
}
