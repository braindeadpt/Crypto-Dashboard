import type { SeriesPoint } from "@/lib/stats";

/** Central metrics with historical context. */
export const HISTORY_METRIC_IDS = [
  "funding_btc",
  "oi_btc",
  "breadth",
  "fear_greed",
  "btc_dominance",
  "tvl",
  "etf_btc_flow",
  "volume_btc",
  "vol_realized_btc",
  "fee_btc",
  "stablecoin_supply",
] as const;

export type HistoryMetricId = (typeof HISTORY_METRIC_IDS)[number];

export type MetricSeriesMeta = {
  id: HistoryMetricId;
  /** Human unit label for docs/debug */
  unit: string;
  granularity: "day" | "hour";
  /** Where bootstrap history comes from */
  bootstrap: string;
};

export const METRIC_META: Record<HistoryMetricId, MetricSeriesMeta> = {
  funding_btc: {
    id: "funding_btc",
    unit: "rate",
    granularity: "day",
    bootstrap: "Binance fapi/v1/fundingRate",
  },
  oi_btc: {
    id: "oi_btc",
    unit: "usd",
    granularity: "day",
    bootstrap: "Binance openInterestHist 1d",
  },
  breadth: {
    id: "breadth",
    unit: "pct_green",
    granularity: "day",
    bootstrap: "cron append (CoinGecko top)",
  },
  fear_greed: {
    id: "fear_greed",
    unit: "index_0_100",
    granularity: "day",
    bootstrap: "Alternative.me fng limit=90",
  },
  btc_dominance: {
    id: "btc_dominance",
    unit: "pct",
    granularity: "day",
    bootstrap: "cron append (CoinGecko global)",
  },
  tvl: {
    id: "tvl",
    unit: "usd",
    granularity: "day",
    bootstrap: "DefiLlama historicalChainTvl",
  },
  etf_btc_flow: {
    id: "etf_btc_flow",
    unit: "usd_m",
    granularity: "day",
    bootstrap: "Farside ETF snapshot history",
  },
  volume_btc: {
    id: "volume_btc",
    unit: "usd",
    granularity: "day",
    bootstrap: "CoinGecko bitcoin market_chart",
  },
  vol_realized_btc: {
    id: "vol_realized_btc",
    unit: "annualized_pct",
    granularity: "day",
    bootstrap: "derived from CoinGecko BTC prices",
  },
  fee_btc: {
    id: "fee_btc",
    unit: "sat_vb",
    granularity: "day",
    bootstrap: "cron append (mempool.space)",
  },
  stablecoin_supply: {
    id: "stablecoin_supply",
    unit: "usd",
    granularity: "day",
    bootstrap: "DefiLlama stablecoincharts/all",
  },
};

export type HistorySeriesBlob = {
  points: SeriesPoint[];
  source: string;
};

export type HistorySnapshot = {
  windowDays: number;
  series: Partial<Record<HistoryMetricId, HistorySeriesBlob>>;
};
