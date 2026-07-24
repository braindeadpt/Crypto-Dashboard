import { cachedFetch } from "@/lib/cache";

export type MempoolFees = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
  updatedAt: string;
};

export async function fetchMempoolFees(): Promise<MempoolFees | null> {
  return cachedFetch("btc:mempool-fees", 120_000, async () => {
    try {
      const res = await fetch("https://mempool.space/api/v1/fees/recommended", {
        next: { revalidate: 120 },
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = (await res.json()) as Omit<MempoolFees, "updatedAt">;
      return { ...data, updatedAt: new Date().toISOString() };
    } catch {
      return null;
    }
  });
}
