/**
 * Registo único de fontes externas (DESENHO-V5 §5.3).
 *
 * Cada host que o site consome tem uma entrada: nome próprio para o ecrã,
 * TTL de referência do caminho de render, se precisa de chave, e o tipo:
 *  - "live"     → fetch no servidor durante o render (cacheada por cache.ts)
 *  - "snapshot" → só entra em disco via ingest; o render lê data/snapshots/
 *  - "browser"  → ligação directa do cliente (WebSocket)
 *
 * Todos os fetchers constroem URLs a partir de `SOURCES.*.host` — nenhum
 * host hardcoded fora deste ficheiro. /metodologia e /api/health lêem daqui.
 */
export type SourceKind = "live" | "snapshot" | "browser";

export type SourceDef = {
  id: string;
  /** Nome próprio para o ecrã ("DefiLlama", nunca URL). */
  name: string;
  /** Hostname[:porta], sem esquema. */
  host: string;
  kind: SourceKind;
  /** TTL de referência do cache de render (s). 0 = sem cache/stream. */
  ttlSec: number;
  needsKey: boolean;
  docsUrl: string;
};

export const SOURCES = {
  coingecko: {
    id: "coingecko",
    name: "CoinGecko",
    host: "api.coingecko.com",
    kind: "live",
    ttlSec: 90,
    needsKey: true,
    docsUrl: "https://docs.coingecko.com",
  },
  binance_rest: {
    id: "binance_rest",
    name: "Binance Futures",
    host: "fapi.binance.com",
    kind: "live",
    ttlSec: 60,
    needsKey: false,
    docsUrl: "https://developers.binance.com/docs/derivatives/usds-margined-futures",
  },
  binance_spot: {
    id: "binance_spot",
    name: "Binance Spot",
    host: "api.binance.com",
    kind: "live",
    ttlSec: 60,
    needsKey: false,
    docsUrl: "https://developers.binance.com/docs/binance-spot-api-docs",
  },
  binance_ws: {
    id: "binance_ws",
    name: "Binance (ticker)",
    host: "stream.binance.com:9443",
    kind: "browser",
    ttlSec: 0,
    needsKey: false,
    docsUrl: "https://developers.binance.com/docs/binance-spot-api-docs/web-socket-streams",
  },
  binance_ws_futures: {
    id: "binance_ws_futures",
    name: "Binance (liquidações)",
    host: "fstream.binance.com",
    kind: "browser",
    ttlSec: 0,
    needsKey: false,
    docsUrl: "https://developers.binance.com/docs/derivatives/usds-margined-futures/websocket-market-streams",
  },
  defillama: {
    id: "defillama",
    name: "DefiLlama",
    host: "api.llama.fi",
    kind: "snapshot",
    ttlSec: 900,
    needsKey: false,
    docsUrl: "https://defillama.com/docs/api",
  },
  defillama_stables: {
    id: "defillama_stables",
    name: "DefiLlama Stablecoins",
    host: "stablecoins.llama.fi",
    kind: "snapshot",
    ttlSec: 2700,
    needsKey: false,
    docsUrl: "https://defillama.com/docs/api",
  },
  defillama_yields: {
    id: "defillama_yields",
    name: "DefiLlama Yields",
    host: "yields.llama.fi",
    kind: "snapshot",
    ttlSec: 900,
    needsKey: false,
    docsUrl: "https://defillama.com/docs/api",
  },
  farside: {
    id: "farside",
    name: "Farside Investors",
    host: "farside.co.uk",
    kind: "snapshot",
    ttlSec: 43200,
    needsKey: false,
    docsUrl: "https://farside.co.uk",
  },
  mempool: {
    id: "mempool",
    name: "mempool.space",
    host: "mempool.space",
    kind: "live",
    ttlSec: 120,
    needsKey: false,
    docsUrl: "https://mempool.space/docs/api",
  },
  alternative: {
    id: "alternative",
    name: "Alternative.me",
    host: "api.alternative.me",
    kind: "live",
    ttlSec: 300,
    needsKey: false,
    docsUrl: "https://alternative.me/crypto/fear-and-greed-index/",
  },
  etherscan: {
    id: "etherscan",
    name: "Etherscan",
    host: "api.etherscan.io",
    kind: "live",
    ttlSec: 0,
    needsKey: true,
    docsUrl: "https://docs.etherscan.io",
  },
  dexscreener: {
    id: "dexscreener",
    name: "DexScreener",
    host: "api.dexscreener.com",
    kind: "live",
    ttlSec: 120,
    needsKey: false,
    docsUrl: "https://docs.dexscreener.com",
  },
  geckoterminal: {
    id: "geckoterminal",
    name: "GeckoTerminal",
    host: "api.geckoterminal.com",
    kind: "live",
    ttlSec: 180,
    needsKey: false,
    docsUrl: "https://www.geckoterminal.com/dex-api",
  },
} as const satisfies Record<string, SourceDef>;

export type SourceId = keyof typeof SOURCES;

/** URL helpers — esquema explícito no ponto de uso, host nunca literal. */
export const http = (id: SourceId) => `https://${SOURCES[id].host}`;
export const wss = (id: SourceId) => `wss://${SOURCES[id].host}`;
