import { z } from "zod";

/**
 * Schemas zod dos snapshots em data/snapshots/ (DESENHO-V5 §5.5).
 * Espelham os tipos TS existentes — campos opcionais toleram null, campos
 * extra passam (loose). Usados em duas direcções: validate-snapshots lê o
 * disco, e writeSnapshot valida antes de gravar (nunca vazio por cima de bom).
 */

const iso = z.string();
const num = z.number();
const nullableNum = num.nullable();

const assetQuote = z.looseObject({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  price: num,
  change1h: nullableNum.optional(),
  change24h: num,
  change7d: nullableNum.optional(),
  marketCap: num,
  volume24h: num,
  image: z.string().optional(),
  rank: num.optional(),
  sparkline7d: z.array(num).optional(),
});

const mover = assetQuote.extend({
  causePt: z.string(),
  causeEn: z.string(),
  caseId: z.string().optional(),
});

export const marketSchema = z.looseObject({
  btc: assetQuote,
  eth: assetQuote,
  global: z.looseObject({
    totalMarketCap: num,
    totalVolume: num,
    btcDominance: num,
    ethDominance: num,
    marketCapChange24h: num,
  }),
  movers: z.looseObject({
    gainers: z.array(mover),
    losers: z.array(mover),
  }),
  top: z.array(assetQuote).min(1),
  updatedAt: iso,
});

export const sentimentSchema = z.looseObject({
  fearGreed: z.looseObject({
    value: num,
    classification: z.string(),
    timestamp: iso,
  }),
  funding: z.looseObject({
    rate: num,
    annualized: num,
    bias: z.enum(["long", "short", "neutral"]),
  }),
  openInterest: z.looseObject({
    value: num,
    change24hPct: nullableNum,
  }),
  fngHistory: z.array(z.looseObject({ value: num, timestamp: iso })).optional(),
  updatedAt: iso,
});

const protocolRow = z.looseObject({
  name: z.string(),
  slug: z.string(),
  tvl: num,
  change1d: nullableNum,
  change7d: nullableNum,
  category: z.string(),
  chains: z.array(z.string()),
});

const stableRow = z.looseObject({
  name: z.string(),
  symbol: z.string(),
  circulating: num,
  pegDeviation: nullableNum.optional(),
});

export const defiSchema = z.looseObject({
  totalTvl: num,
  tvlSource: z.string().optional(),
  change1d: nullableNum,
  fees24h: nullableNum,
  feesChange1d: nullableNum,
  protocols: z.array(protocolRow),
  chains: z.array(z.looseObject({ name: z.string(), tvl: num })),
  stablecoins: z.array(stableRow),
  pegWatch: z.array(stableRow),
  updatedAt: iso,
});

const etfFlow = z.looseObject({
  date: z.string(),
  dateLabel: z.string(),
  totalUsdM: num,
  byTicker: z.record(z.string(), nullableNum),
});

const etfAsset = z.looseObject({
  asset: z.enum(["BTC", "ETH", "SOL"]),
  unit: z.string(),
  latest: etfFlow.nullable(),
  previous: etfFlow.nullable(),
  streakDays: num,
  sum5dUsdM: nullableNum,
  sum20dUsdM: nullableNum,
  history: z.array(etfFlow).min(1),
  source: z.string(),
  sourceUrl: z.string(),
  updatedAt: iso,
});

export const etfSchema = z.looseObject({
  btc: etfAsset,
  eth: etfAsset,
  sol: etfAsset.nullable(),
  signal: z.looseObject({
    spotBidPt: z.string(),
    spotBidEn: z.string(),
    tone: z.enum(["up", "down", "neutral", "warn"]),
  }),
  stale: z.boolean(),
  ingestedAt: iso,
  updatedAt: iso,
});

const seriesPoint = z.looseObject({ t: z.string(), v: num });

const metricContext = z.looseObject({
  valor: num,
  percentil: num.nullable(),
  zScore: num.nullable(),
  min: num.nullable(),
  max: num.nullable(),
  mediana: num.nullable(),
  classificação: z.string(),
  diasDeAmostra: num,
  janelaDias: num,
});

export const liquiditySchema = z.looseObject({
  stables: z.looseObject({
    totalUsd: num,
    peggedUsd: num,
    change7dPct: nullableNum,
    change30dPct: nullableNum,
    change7dUsd: nullableNum,
    change30dUsd: nullableNum,
    series: z.array(seriesPoint).min(1),
    context: metricContext.nullable(),
    top: z.array(
      z.looseObject({ name: z.string(), symbol: z.string(), circulatingUsd: num }),
    ),
    source: z.string(),
  }),
  spot: z.looseObject({
    available: z.boolean(),
    etfCombined1dUsdM: nullableNum,
    etfBtc1dUsdM: nullableNum,
    etfEth1dUsdM: nullableNum,
    etfSum5dUsdM: nullableNum,
    tone: z.enum(["up", "down", "neutral", "warn"]).nullable(),
    signalPt: z.string().nullable(),
    signalEn: z.string().nullable(),
    source: z.string(),
  }),
  leverage: z.looseObject({
    available: z.boolean(),
    fundingBtc: nullableNum,
    fundingBps: nullableNum,
    oiUsd: nullableNum,
    oiChange24hPct: nullableNum,
    longShortRatio: nullableNum,
    source: z.string(),
  }),
  readingPt: z.string(),
  readingEn: z.string(),
  stale: z.boolean(),
  ingestedAt: iso,
  updatedAt: iso,
});

const sectorRow = z.looseObject({
  id: z.string(),
  name: z.string(),
  marketCap: num,
  change24h: num,
  volume24h: num,
  sharePct: num,
  topCoinIds: z.array(z.string()),
  updatedAt: z.string(),
});

const sectorDay = z.looseObject({
  date: z.string(),
  mcap: z.record(z.string(), num),
  share: z.record(z.string(), num),
  change24h: z.record(z.string(), num),
});

const sectorRotation = z.looseObject({
  id: z.string(),
  name: z.string(),
  shareDelta7d: nullableNum,
  shareDelta30d: nullableNum,
  mcapChange7d: nullableNum,
  mcapChange30d: nullableNum,
  sampleDays: num,
});

export const sectorsSchema = z.looseObject({
  thematic: z.array(sectorRow).min(1),
  mega: z.array(sectorRow),
  history: z.array(sectorDay),
  rotation: z.array(sectorRotation),
  readingPt: z.string(),
  readingEn: z.string(),
  changeContext: z.record(z.string(), metricContext),
  windowDays: num,
  stale: z.boolean(),
  ingestedAt: iso,
  updatedAt: iso,
});

const yieldPool = z.looseObject({
  pool: z.string(),
  chain: z.string(),
  project: z.string(),
  symbol: z.string(),
  tvlUsd: num,
  apy: num,
  apyBase: nullableNum,
  apyReward: nullableNum,
  stablecoin: z.boolean(),
});

export const yieldsSchema = z.looseObject({
  pools: z.array(yieldPool).min(1),
  updatedAt: iso,
});

const seriesBlob = z.looseObject({
  points: z.array(seriesPoint),
  source: z.string(),
});

export const historySchema = z.looseObject({
  windowDays: num,
  series: z.record(z.string(), seriesBlob),
  updatedAt: iso,
});

export const SNAPSHOT_SCHEMAS = {
  market: marketSchema,
  sentiment: sentimentSchema,
  defi: defiSchema,
  etf: etfSchema,
  liquidity: liquiditySchema,
  sectors: sectorsSchema,
  yields: yieldsSchema,
  history: historySchema,
} as const;

export type SnapshotName = keyof typeof SNAPSHOT_SCHEMAS;

export function validateSnapshot(
  name: string,
  data: unknown,
): { ok: true } | { ok: false; error: string } {
  const schema = SNAPSHOT_SCHEMAS[name as SnapshotName];
  if (!schema) return { ok: false, error: `sem schema para ${name}` };
  const res = schema.safeParse(data);
  if (!res.success) {
    return { ok: false, error: res.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  }
  return { ok: true };
}
