import type { SectorsSnapshot } from "@/lib/data/sectors";
import type { AssetQuote } from "@/lib/types";

/**
 * Camadas alternativas de cor para o mapa do mercado (R4) — helpers puros.
 *
 * Módulo seguro para cliente: só tipos e matemática, sem fs nem cache de
 * servidor. O fetch vive em `mapLayersServer.ts`.
 *
 * - funding: última taxa anualizada dos perpétuos Binance (chave = símbolo
 *   do perp, ex. "BTCUSDT"). Activos sem perp ficam sem valor — a UI
 *   declara a lacuna, nunca estima.
 * - sector: cada activo herdado da categoria CoinGecko onde aparece no
 *   top-3. A cor é a variação de quota temática a 7 dias — rotação.
 * - volume: turnover (vol24h/cap) vs mediana do grupo — deriva dos assets.
 */

export type MapSectorTag = {
  name: string;
  /** Δ quota temática em pontos percentuais (7d). Null = série curta. */
  shareDelta7d: number | null;
  /** Δ capitalização do sector (7d). Null = série curta. */
  mcapChange7d: number | null;
};

export type MapLayers = {
  /** Símbolo de perp Binance ("BTCUSDT") → funding anualizado em %. */
  funding: Record<string, number>;
  /** CoinGecko id → sector (só activos no top-3 de uma categoria). */
  sector: Record<string, MapSectorTag>;
  fundingAt: string | null;
  sectorAt: string | null;
};

/**
 * Símbolos de perpétuo a tentar para um ticker spot, por ordem.
 * A Binance denomina memes pequenos em lotes de 1000 (1000PEPEUSDT).
 */
export function perpCandidates(symbol: string): string[] {
  const s = symbol.toUpperCase();
  return [`${s}USDT`, `1000${s}USDT`, `${s}USDC`, `1000${s}USDC`];
}

/** Funding anualizado de um activo, ou null quando não há perpétuo. */
export function fundingForAsset(
  symbol: string,
  rates: Record<string, number>,
): number | null {
  for (const cand of perpCandidates(symbol)) {
    const v = rates[cand];
    if (v != null) return v;
  }
  return null;
}

/**
 * CoinGecko id → sector, a partir dos top-3 de cada categoria.
 * As temáticas ganham prioridade sobre as mega (são elas que têm rotação
 * calculada); a primeira categoria a reclamar um activo fica com ele.
 */
export function buildSectorTagMap(
  snap: SectorsSnapshot | null,
): Record<string, MapSectorTag> {
  const out: Record<string, MapSectorTag> = {};
  if (!snap) return out;
  const rotationById = new Map(snap.rotation.map((r) => [r.id, r]));
  for (const row of [...snap.thematic, ...snap.mega]) {
    const rot = rotationById.get(row.id);
    for (const coinId of row.topCoinIds) {
      out[coinId] ??= {
        name: row.name,
        shareDelta7d: rot?.shareDelta7d ?? null,
        mcapChange7d: rot?.mcapChange7d ?? null,
      };
    }
  }
  return out;
}

/** Turnover = volume 24h ÷ capitalização. Sem cap ou sem volume → null. */
export function turnoverOf(a: AssetQuote): number | null {
  if (!a.marketCap || a.marketCap <= 0 || !a.volume24h || a.volume24h <= 0) {
    return null;
  }
  return a.volume24h / a.marketCap;
}

/** Mediana do turnover do grupo — referência para o "volume anómalo". */
export function medianTurnover(assets: AssetQuote[]): number | null {
  const vals = assets
    .map(turnoverOf)
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  if (!vals.length) return null;
  const mid = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[mid]! : (vals[mid - 1]! + vals[mid]!) / 2;
}

/**
 * Turnover relativo à mediana do grupo (ratio). >1 = mais transaccionado
 * que o típico face ao tamanho; <1 = mais frio.
 */
export function turnoverRatio(
  a: AssetQuote,
  median: number | null,
): number | null {
  const t = turnoverOf(a);
  if (t == null || median == null || median <= 0) return null;
  return t / median;
}
