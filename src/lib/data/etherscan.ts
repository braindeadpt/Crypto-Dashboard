/**
 * Etherscan wallet view — shared types/constants for the Carteira lane
 * (VISION §10, Fase 1). Client-safe: no fetch, no node imports.
 * Server-side fetching lives in `etherscan-server.ts`.
 */

export const WALLET_CHAINS = [
  { chainId: 1, name: "Ethereum", native: "ETH", explorer: "https://etherscan.io", cgPlatform: "ethereum", cgNativeId: "ethereum" },
  { chainId: 8453, name: "Base", native: "ETH", explorer: "https://basescan.org", cgPlatform: "base", cgNativeId: "ethereum" },
  { chainId: 42161, name: "Arbitrum", native: "ETH", explorer: "https://arbiscan.io", cgPlatform: "arbitrum-one", cgNativeId: "ethereum" },
] as const;

export type EvmChainId = (typeof WALLET_CHAINS)[number]["chainId"];
export type WalletChainId = EvmChainId | "btc";

export function isWalletChainId(v: unknown): v is WalletChainId {
  return v === "btc" || WALLET_CHAINS.some((c) => c.chainId === v);
}

export const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export interface WalletTokenBalance {
  contract: string;
  symbol: string;
  name: string;
  /** Estimated from the last token-transfer scan — not PRO data. */
  balanceEst: number;
  txCount: number;
  /** CoinGecko USD price by contract — null when unknown (never zero). */
  usdPrice: number | null;
  usdValue: number | null;
}

export interface WalletActivityItem {
  hash: string;
  time: string;
  kind: "native" | "token";
  direction: "in" | "out" | "self";
  amount: number;
  symbol: string;
  counterparty: string;
  failed: boolean;
  /** Unconfirmed on-chain (BTC mempool). */
  pending?: boolean;
  /** Explorer URL for verification — the "receipt". */
  url: string;
}

export interface WalletView {
  address: string;
  chainId: WalletChainId;
  chainName: string;
  nativeSymbol: string;
  nativeBalance: number;
  /** USD value of the native balance — null when the price feed is down. */
  nativeUsd: number | null;
  /** Sum of priced positions (native + tokens with known USD price). */
  estValueUsd: number | null;
  tokens: WalletTokenBalance[];
  activity: WalletActivityItem[];
  tokenScan: { rows: number; capped: boolean };
  updatedAt: string;
}
