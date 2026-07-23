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
