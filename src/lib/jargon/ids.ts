/**
 * Central jargon IDs — copy lives in messages/pt.json + en.json under `jargon`.
 * Do not scatter plain-language twins as string literals in components.
 */
export const JARGON_TERM_IDS = [
  "oi",
  "funding",
  "etf",
  "tvl",
  "ls",
  "breadth",
  "percentile",
  "fearGreed",
  "openInterest",
  "leverage",
  "spot",
  "amplitude",
] as const;

export type JargonTermId = (typeof JARGON_TERM_IDS)[number];

export function isJargonTermId(v: unknown): v is JargonTermId {
  return (
    typeof v === "string" &&
    (JARGON_TERM_IDS as readonly string[]).includes(v)
  );
}

/** Map history / pulse axes onto jargon terms when a twin exists. */
export const HISTORY_TO_JARGON: Partial<
  Record<string, JargonTermId>
> = {
  funding_btc: "funding",
  oi_btc: "oi",
  etf_btc_flow: "etf",
  tvl: "tvl",
  breadth: "breadth",
  fear_greed: "fearGreed",
};
