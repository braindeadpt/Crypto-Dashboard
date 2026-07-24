/**
 * Peg-watch helpers — only alert on real USD fiat-backed depegs.
 * Yield-bearing / rebasing "stables" trade above $1 by design (USYC, sDAI…).
 * Non-USD pegs (EURC, etc.) would look permanently depegged vs $1.
 */

const YIELD_BEARING = new Set([
  "usyc",
  "sdai",
  "susde",
  "susds",
  "ousg",
  "usd0++",
  "wstusr",
  "stusd",
  "savusd",
  "ysy",
  "usr",
  "fxusd",
]);

export function pegDeviationPct(
  price: number | null | undefined,
  pegType: string | undefined,
  symbol: string,
): number | null {
  if (price == null || !Number.isFinite(price)) return null;
  // DefiLlama: peggedUSD | peggedEUR | peggedVAR | …
  if (pegType !== "peggedUSD") return null;
  if (YIELD_BEARING.has(symbol.toLowerCase())) return null;
  return (price - 1) * 100;
}
