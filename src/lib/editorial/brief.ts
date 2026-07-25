import { buildDailyRitual, ritualToBriefItem } from "@/lib/editorial/ritual";
import type { BriefItem, MarketSnapshot, RegimeResult, SentimentSnapshot } from "@/lib/types";

/**
 * Deterministic editorial brief — thin wrapper over the daily ritual.
 * Prefer buildDailyRitual + history deltas when available (/api/brief).
 */
export function buildDeterministicBrief(args: {
  market: MarketSnapshot;
  regime: RegimeResult;
  sentiment: SentimentSnapshot;
}): BriefItem {
  return ritualToBriefItem(
    buildDailyRitual({
      market: args.market,
      regime: args.regime,
      sentiment: args.sentiment,
      deltas: [],
      cases: [],
    }),
  );
}

export const CURATED_RSS = [
  {
    name: "Cointelegraph",
    url: "https://cointelegraph.com/rss",
    lang: "en",
    tier: "B" as const,
  },
  {
    name: "Cointelegraph Brasil",
    url: "https://cointelegraph.com/rss/tag/brazil",
    lang: "pt",
    tier: "B" as const,
  },
];

export const CURATED_X_ACCOUNTS = [
  { handle: "BitcoinMagazine", tier: "B" as const, focus: "BTC" },
  { handle: "ECB", tier: "A" as const, focus: "EU macro" },
  { handle: "CMVM_Informacao", tier: "A" as const, focus: "Portugal regulator" },
  { handle: "whale_alert", tier: "C" as const, focus: "flows" },
];
