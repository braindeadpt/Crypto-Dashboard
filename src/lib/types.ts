export type { ExpertiseLevel } from "@/lib/expertise";

export type MarketPosture = "calm" | "unsettled" | "storm" | "weird";

export type CredibilityTier = "A" | "B" | "C" | "D";

export interface EvidenceChip {
  id: string;
  label: string;
  labelEn: string;
  value: string;
  tone: "neutral" | "up" | "down" | "warn";
}

export interface RegimeContributor {
  id: string;
  labelPt: string;
  labelEn: string;
  points: number;
  detail: string;
}

export interface RegimeResult {
  posture: MarketPosture;
  score: number;
  receipts: EvidenceChip[];
  /** Ranked stress contributors — why the score is what it is */
  contributors: RegimeContributor[];
  summaryPt: string;
  summaryEn: string;
  headlinePt: string;
  headlineEn: string;
  dontPt: string;
  dontEn: string;
  lessonSlug: string;
  updatedAt: string;
}

export interface MarketSnapshot {
  btc: AssetQuote;
  eth: AssetQuote;
  global: {
    totalMarketCap: number;
    totalVolume: number;
    btcDominance: number;
    ethDominance: number;
    marketCapChange24h: number;
  };
  movers: {
    gainers: Mover[];
    losers: Mover[];
  };
  top: AssetQuote[];
  updatedAt: string;
}

export interface AssetQuote {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change1h?: number | null;
  change24h: number;
  change7d?: number | null;
  marketCap: number;
  volume24h: number;
  image?: string;
  rank?: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  rank: number | null;
  score: number;
  change24h: number | null;
}

export interface Mover extends AssetQuote {
  causePt: string;
  causeEn: string;
  caseId?: string;
}

export interface SentimentSnapshot {
  fearGreed: {
    value: number;
    classification: string;
    timestamp: string;
  };
  funding: {
    rate: number;
    annualized: number;
    bias: "long" | "short" | "neutral";
  };
  openInterest: {
    value: number;
    change24hPct: number | null;
  };
  updatedAt: string;
}

export interface DefiSnapshot {
  totalTvl: number;
  change1d: number | null;
  fees24h: number | null;
  feesChange1d: number | null;
  protocols: {
    name: string;
    slug: string;
    tvl: number;
    change1d: number | null;
    change7d: number | null;
    category: string;
    chains: string[];
  }[];
  chains: { name: string; tvl: number }[];
  stablecoins: {
    name: string;
    symbol: string;
    circulating: number;
    pegDeviation?: number | null;
  }[];
  pegWatch: {
    name: string;
    symbol: string;
    circulating: number;
    pegDeviation?: number | null;
  }[];
  updatedAt: string;
  /** True when the disk snapshot is older than its freshness window. */
  stale?: boolean;
}

export interface BriefItem {
  id: string;
  fact: string;
  whyItMattersPt: string;
  whyItMattersEn: string;
  uncertainty: string;
  watchNext: string;
  sources: { title: string; url: string }[];
  credibilityTier: CredibilityTier;
  relatedMetrics: string[];
  generatedAt: string;
}

export interface CaseFile {
  id: string;
  assetId: string;
  symbol: string;
  observationPt: string;
  observationEn: string;
  change24h: number;
  /** Optional horizon points from the mover — never invented */
  change1h?: number | null;
  change7d?: number | null;
  price: number;
  hypotheses: {
    id: string;
    labelPt: string;
    labelEn: string;
    confidence: number;
    forPt: string[];
    forEn: string[];
    againstPt: string[];
    againstEn: string[];
    sources: { title: string; url: string }[];
  }[];
  evidence: EvidenceChip[];
  /** True when signals do not support a clear read */
  unclear: boolean;
  conclusionPt: string;
  conclusionEn: string;
  quiz?: {
    questionPt: string;
    questionEn: string;
    optionsPt: string[];
    optionsEn: string[];
    answerIndex: number;
  };
  createdAt: string;
}

export interface AtlasConcept {
  slug: string;
  level: "beginner" | "intermediate" | "advanced";
  titlePt: string;
  titleEn: string;
  summaryPt: string;
  summaryEn: string;
  bodyPt: string;
  bodyEn: string;
  relatedMetrics: string[];
  relatedSlugs: string[];
}

export interface TimelineEvent {
  id: string;
  date: string;
  titlePt: string;
  titleEn: string;
  bodyPt: string;
  bodyEn: string;
  importance: "high" | "medium" | "low";
  priceHint?: string;
}

export interface CyclePricePoint {
  time: number;
  price: number;
}

export interface CycleSnapshot {
  phase: "accumulation" | "bull" | "distribution" | "bear" | "early";
  phaseLabelPt: string;
  phaseLabelEn: string;
  narrativePt: string;
  narrativeEn: string;
  halving: {
    nextEstimate: string;
    daysLeft: number;
    blocksLeft: number | null;
    lastHalving: string;
  };
  cycleProgressPct: number;
  athDistancePct: number | null;
  /** Downsampled BTC USD series for cycle chart (empty if unavailable). */
  priceHistory: CyclePricePoint[];
  updatedAt: string;
}
