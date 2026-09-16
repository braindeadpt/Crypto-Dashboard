import { cachedFetch } from "@/lib/cache";
import { buildSectorTagMap, type MapLayers } from "@/lib/data/mapLayers";
import { fetchSectorsSnapshot } from "@/lib/data/sectors";

/**
 * Fetch das camadas do mapa (R4) — servidor apenas. UMA chamada a
 * /fapi/v1/premiumIndex sem símbolo devolve o funding de todos os
 * perpétuos; os sectores vêm do snapshot em disco (sem rede no render).
 */

const FAPI = "https://fapi.binance.com";

type PremiumIndexRow = {
  symbol: string;
  lastFundingRate: string;
  time: number;
};

/** Taxa por 8h → anualizada ×3×365, como em fetchFundingRate. */
export async function fetchFundingMap(): Promise<{
  rates: Record<string, number>;
  updatedAt: string;
}> {
  return cachedFetch("binance:funding:all", 90_000, async () => {
    const res = await fetch(`${FAPI}/fapi/v1/premiumIndex`, {
      next: { revalidate: 90 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Binance premiumIndex ${res.status}`);
    const rows = (await res.json()) as PremiumIndexRow[];
    const rates: Record<string, number> = {};
    let newest = 0;
    for (const r of rows) {
      const rate = Number(r.lastFundingRate);
      if (Number.isFinite(rate)) rates[r.symbol] = rate * 3 * 365 * 100;
      if (r.time > newest) newest = r.time;
    }
    return {
      rates,
      updatedAt: new Date(newest || Date.now()).toISOString(),
    };
  });
}

export async function fetchMapLayers(): Promise<MapLayers> {
  const [fundingRes, sectors] = await Promise.all([
    fetchFundingMap().catch(() => null),
    fetchSectorsSnapshot().catch(() => null),
  ]);
  return {
    funding: fundingRes?.rates ?? {},
    sector: buildSectorTagMap(sectors),
    fundingAt: fundingRes?.updatedAt ?? null,
    sectorAt: sectors?.ingestedAt ?? null,
  };
}
