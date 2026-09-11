/**
 * Etherscan API V2 — server-side read-only wallet view (VISION §10, Fase 1).
 *
 * Privacy discipline: address data is fetched on demand and NEVER persisted —
 * no cachedFetch, no disk. The key is `ETHERSCAN_API_KEY` (env) or the user's
 * own key passed per-request via BYOK header (stored only in their browser).
 * Server-only: pulls CoinGecko pricing (cached) — do not import from client
 * components; shared types live in `etherscan.ts`.
 */

import {
  fetchTokenPricesUsd,
  fetchUsdPrices,
} from "@/lib/data/coingecko";
import {
  WALLET_CHAINS,
  type EvmChainId,
  type WalletActivityItem,
  type WalletTokenBalance,
  type WalletView,
} from "@/lib/data/etherscan";

const API = "https://api.etherscan.io/v2/api";
const TOKEN_TX_SCAN_LIMIT = 500;
const ACTIVITY_LIMIT = 25;

interface EtherscanRow {
  [k: string]: string;
}

interface EtherscanResponse {
  status: string;
  message: string;
  result: string | EtherscanRow[];
}

async function call(
  chainId: number,
  action: string,
  address: string,
  apiKey: string,
  extra: Record<string, string> = {},
): Promise<string | EtherscanRow[]> {
  const params = new URLSearchParams({
    chainid: String(chainId),
    module: "account",
    action,
    address,
    sort: "desc",
    apikey: apiKey,
    ...extra,
  });
  const res = await fetch(`${API}?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Etherscan HTTP ${res.status}`);
  const json = (await res.json()) as EtherscanResponse;
  if (json.status !== "1") {
    if (json.message === "NOTOK" && typeof json.result === "string") {
      // "No transactions found" is a valid empty; real errors bubble up.
      if (/no transactions found/i.test(json.result)) return [];
      throw new Error(`Etherscan: ${json.result}`);
    }
    return [];
  }
  return json.result;
}

function fmtUnits(raw: string, decimals: number): number {
  return Number(raw) / 10 ** decimals;
}

function shortAddr(a: string): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a;
}

/** Native + token-estimated portfolio + merged activity. Never persisted. */
export async function fetchWalletView(
  address: string,
  chainId: EvmChainId,
  apiKey: string,
): Promise<WalletView> {
  const chain = WALLET_CHAINS.find((c) => c.chainId === chainId);
  if (!chain) throw new Error("unsupported chain");
  const lower = address.toLowerCase();

  const [balanceResult, normalTxs, tokenTxs] = await Promise.all([
    call(chainId, "balance", address, apiKey, { tag: "latest" }),
    call(chainId, "txlist", address, apiKey, {
      page: "1",
      offset: String(ACTIVITY_LIMIT),
    }),
    call(chainId, "tokentx", address, apiKey, {
      page: "1",
      offset: String(TOKEN_TX_SCAN_LIMIT),
    }),
  ]);

  const nativeBalance =
    typeof balanceResult === "string" ? fmtUnits(balanceResult, 18) : 0;

  const normalRows = Array.isArray(normalTxs) ? normalTxs : [];
  const tokenRows = Array.isArray(tokenTxs) ? tokenTxs : [];

  // Token balances estimated from the scanned transfer window.
  const tokenMap = new Map<string, WalletTokenBalance>();
  for (const row of tokenRows) {
    const contract = row.contractAddress?.toLowerCase() ?? "";
    if (!contract) continue;
    const decimals = Number(row.tokenDecimal) || 18;
    const amount = fmtUnits(row.value ?? "0", decimals);
    const dir =
      row.to?.toLowerCase() === lower
        ? row.from?.toLowerCase() === lower
          ? 0
          : 1
        : -1;
    const cur = tokenMap.get(contract) ?? {
      contract,
      symbol: row.tokenSymbol || "?",
      name: row.tokenName || contract,
      balanceEst: 0,
      txCount: 0,
      usdPrice: null,
      usdValue: null,
    };
    cur.balanceEst += amount * dir;
    cur.txCount += 1;
    tokenMap.set(contract, cur);
  }
  const tokens = [...tokenMap.values()]
    .filter((t) => t.balanceEst > 0)
    .sort((a, b) => b.txCount - a.txCount)
    .slice(0, 15);

  // USD valuation — CoinGecko by contract (free tier). Unknown tokens stay
  // unpriced, never zero; if the price feed fails we degrade, not invent.
  const [nativePrices, tokenPrices] = await Promise.all([
    fetchUsdPrices([chain.cgNativeId]),
    fetchTokenPricesUsd(chain.cgPlatform, tokens.map((t) => t.contract)),
  ]);
  const nativeUsdPrice = nativePrices[chain.cgNativeId] ?? null;
  const nativeUsd =
    nativeUsdPrice != null ? nativeBalance * nativeUsdPrice : null;
  let tokenUsdSum = 0;
  for (const t of tokens) {
    const p = tokenPrices[t.contract];
    if (p != null) {
      t.usdPrice = p;
      t.usdValue = t.balanceEst * p;
      tokenUsdSum += t.usdValue;
    }
  }
  const estValueUsd =
    nativeUsd != null || tokenUsdSum > 0
      ? (nativeUsd ?? 0) + tokenUsdSum
      : null;

  const activity: WalletActivityItem[] = [];
  for (const row of normalRows) {
    const from = row.from?.toLowerCase() ?? "";
    const to = row.to?.toLowerCase() ?? "";
    activity.push({
      hash: row.hash,
      time: new Date(Number(row.timeStamp) * 1000).toISOString(),
      kind: "native",
      direction: from === lower && to === lower ? "self" : to === lower ? "in" : "out",
      amount: fmtUnits(row.value ?? "0", 18),
      symbol: chain.native,
      counterparty: shortAddr(to === lower ? row.from : row.to),
      failed: row.isError === "1",
      url: `${chain.explorer}/tx/${row.hash}`,
    });
  }
  for (const row of tokenRows) {
    const from = row.from?.toLowerCase() ?? "";
    const to = row.to?.toLowerCase() ?? "";
    activity.push({
      hash: row.hash,
      time: new Date(Number(row.timeStamp) * 1000).toISOString(),
      kind: "token",
      direction: from === lower && to === lower ? "self" : to === lower ? "in" : "out",
      amount: fmtUnits(row.value ?? "0", Number(row.tokenDecimal) || 18),
      symbol: row.tokenSymbol || "?",
      counterparty: shortAddr(to === lower ? row.from : row.to),
      failed: false,
      url: `${chain.explorer}/tx/${row.hash}`,
    });
  }
  activity.sort((a, b) => b.time.localeCompare(a.time));

  return {
    address,
    chainId,
    chainName: chain.name,
    nativeSymbol: chain.native,
    nativeBalance,
    nativeUsd,
    estValueUsd,
    tokens,
    activity: activity.slice(0, ACTIVITY_LIMIT),
    tokenScan: {
      rows: tokenRows.length,
      capped: tokenRows.length >= TOKEN_TX_SCAN_LIMIT,
    },
    updatedAt: new Date().toISOString(),
  };
}
