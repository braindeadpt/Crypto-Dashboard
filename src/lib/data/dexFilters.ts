/**
 * DEX frenzy denylist + liquidity gates.
 *
 * Outliers: |Δ24h| > 500% with liquidity < $50k are treated as thin-pool
 * artefacts and dropped (not "memes" — often dust / manipulated prints).
 */

const WRAPPED_OR_NATIVE = new Set([
  "weth",
  "wbnb",
  "wbtc",
  "wsol",
  "wavax",
  "wmatic",
  "wftm",
  "eth",
  "bnb",
  "btc",
  "sol",
  "matic",
  "avax",
  "cbeth",
  "steth",
  "wsteth",
  "weeth",
  "reth",
]);

const STABLES = new Set([
  "usdt",
  "usdc",
  "dai",
  "usd1",
  "fdusd",
  "tusd",
  "usde",
  "usds",
  "pyusd",
  "eurc",
  "eurs",
]);

const BLUE_CHIPS = new Set([
  "btc",
  "eth",
  "sol",
  "bnb",
  "xrp",
  "ada",
  "doge",
  "link",
  "uni",
  "aave",
  "mkr",
  "ltc",
]);

const MIN_LIQUIDITY_USD = 25_000;
const MIN_VOLUME_USD = 50_000;
/** Above this with thin liquidity → discard as artefact */
const EXTREME_MOVE_PCT = 500;
const THIN_LIQ_FOR_OUTLIER_USD = 50_000;

export function isDexNoiseSymbol(symbol: string): boolean {
  const s = symbol.trim().toLowerCase().replace(/^\$/, "");
  const base = s.split(/[\/\-_\s]/)[0] ?? s;
  return (
    WRAPPED_OR_NATIVE.has(base) ||
    STABLES.has(base) ||
    BLUE_CHIPS.has(base)
  );
}

export function passesDexQuality(input: {
  symbol: string;
  change24h: number | null;
  volume24h: number | null;
  liquidityUsd: number | null;
}): boolean {
  if (isDexNoiseSymbol(input.symbol)) return false;
  const liq = input.liquidityUsd ?? 0;
  const vol = input.volume24h ?? 0;
  if (liq < MIN_LIQUIDITY_USD && vol < MIN_VOLUME_USD) return false;
  const move = Math.abs(input.change24h ?? 0);
  if (move > EXTREME_MOVE_PCT && liq < THIN_LIQ_FOR_OUTLIER_USD) return false;
  return true;
}
