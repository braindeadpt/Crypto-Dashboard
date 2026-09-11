import { cachedFetch } from "@/lib/cache";

export async function fetchFearGreed() {
  return cachedFetch("sentiment:fng", 300_000, async () => {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error("Fear&Greed fetch failed");
    const json = (await res.json()) as {
      data: { value: string; value_classification: string; timestamp: string }[];
    };
    const row = json.data[0];
    return {
      value: Number(row.value),
      classification: row.value_classification,
      timestamp: new Date(Number(row.timestamp) * 1000).toISOString(),
    };
  });
}

export type FngPoint = { value: number; timestamp: string };

/** 30-day F&G history, ascending — for the Fluxos sparkline. */
export async function fetchFearGreedHistory(days = 30): Promise<FngPoint[]> {
  return cachedFetch(`sentiment:fng-history:${days}`, 300_000, async () => {
    const res = await fetch(
      `https://api.alternative.me/fng/?limit=${days}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) throw new Error("Fear&Greed history fetch failed");
    const json = (await res.json()) as {
      data: { value: string; timestamp: string }[];
    };
    return json.data
      .map((r) => ({
        value: Number(r.value),
        timestamp: new Date(Number(r.timestamp) * 1000).toISOString(),
      }))
      .reverse();
  });
}
