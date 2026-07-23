import { cachedFetch } from "@/lib/cache";

const FAPI = "https://fapi.binance.com";

async function binance<T>(path: string): Promise<T> {
  const res = await fetch(`${FAPI}${path}`, {
    next: { revalidate: 30 },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Binance ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export async function fetchFundingRate(symbol = "BTCUSDT") {
  return cachedFetch(`binance:funding:${symbol}`, 60_000, async () => {
    const data = await binance<{ symbol: string; lastFundingRate: string; markPrice: string }[]>(
      `/fapi/v1/premiumIndex?symbol=${symbol}`,
    );
    const row = Array.isArray(data) ? data[0] : data;
    const rate = Number(row.lastFundingRate);
    return {
      rate,
      annualized: rate * 3 * 365 * 100,
      markPrice: Number(row.markPrice),
    };
  });
}

export async function fetchOpenInterest(symbol = "BTCUSDT") {
  return cachedFetch(`binance:oi:${symbol}`, 60_000, async () => {
    const data = await binance<{ openInterest: string; symbol: string; time: number }>(
      `/fapi/v1/openInterest?symbol=${symbol}`,
    );
    return {
      value: Number(data.openInterest),
      time: data.time,
    };
  });
}

export async function fetchForceOrders(symbol = "BTCUSDT", limit = 50) {
  return cachedFetch(`binance:force:${symbol}`, 60_000, async () => {
    try {
      const data = await binance<
        {
          symbol: string;
          side: string;
          price: string;
          origQty: string;
          time: number;
        }[]
      >(`/fapi/v1/forceOrders?symbol=${symbol}&limit=${limit}`);
      return data.map((d) => ({
        side: d.side as "BUY" | "SELL",
        price: Number(d.price),
        qty: Number(d.origQty),
        notional: Number(d.price) * Number(d.origQty),
        time: d.time,
      }));
    } catch {
      return [];
    }
  });
}

export async function fetchMarkPrice(symbol = "BTCUSDT") {
  const f = await fetchFundingRate(symbol);
  return f.markPrice;
}
