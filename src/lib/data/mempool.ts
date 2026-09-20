import { cachedFetch } from "@/lib/cache";
import { http } from "@/lib/data/sources";
import type { WalletActivityItem, WalletView } from "@/lib/data/etherscan";

export type MempoolFees = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
  /** Congestion — pending txs / virtual size (from /api/mempool). */
  pendingCount: number | null;
  pendingVsizeMb: number | null;
  updatedAt: string;
};

export async function fetchMempoolFees(): Promise<MempoolFees | null> {
  return cachedFetch("btc:mempool-fees", 120_000, async () => {
    try {
      const [feesRes, mempoolRes] = await Promise.all([
        fetch(`${MP}/v1/fees/recommended`, {
          next: { revalidate: 120 },
          headers: { Accept: "application/json" },
        }),
        fetch(`${MP}/mempool`, {
          next: { revalidate: 120 },
          headers: { Accept: "application/json" },
        }),
      ]);
      if (!feesRes.ok) return null;
      const fees = (await feesRes.json()) as Omit<
        MempoolFees,
        "updatedAt" | "pendingCount" | "pendingVsizeMb"
      >;
      let pendingCount: number | null = null;
      let pendingVsizeMb: number | null = null;
      if (mempoolRes.ok) {
        const mp = (await mempoolRes.json()) as {
          count?: number;
          vsize?: number;
        };
        pendingCount = typeof mp.count === "number" ? mp.count : null;
        pendingVsizeMb =
          typeof mp.vsize === "number" ? mp.vsize / 1e6 : null;
      }
      return {
        ...fees,
        pendingCount,
        pendingVsizeMb,
        updatedAt: new Date().toISOString(),
      };
    } catch {
      return null;
    }
  });
}

/* ------------------------------------------------------------------ */
/* Bitcoin address view — Carteira lane (free, no API key)             */
/* ------------------------------------------------------------------ */

export const BTC_ADDRESS_RE =
  /^(bc1[a-z0-9]{11,71}|tb1[a-z0-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/i;

interface MempoolTx {
  txid: string;
  vin: { prevout?: { scriptpubkey_address?: string; value?: number } }[];
  vout: { scriptpubkey_address?: string; value?: number }[];
  status: { confirmed: boolean; block_time?: number };
}

interface MempoolAddressStats {
  funded_txo_sum: number;
  spent_txo_sum: number;
  tx_count: number;
}

const MP = `${http("mempool")}/api`;
const sats = (s: number) => s / 1e8;

/**
 * Read-only Bitcoin address view mapped to the same WalletView shape as EVM.
 * mempool.space needs no key; nothing is persisted. Sums chain_stats +
 * mempool_stats so unconfirmed movement is included but flagged.
 */
export async function fetchBtcAddressView(
  address: string,
): Promise<WalletView> {
  const [addrRes, txsRes] = await Promise.all([
    fetch(`${MP}/address/${address}`, { cache: "no-store" }),
    fetch(`${MP}/address/${address}/txs`, { cache: "no-store" }),
  ]);
  if (!addrRes.ok) throw new Error(`mempool.space HTTP ${addrRes.status}`);

  const stats = (await addrRes.json()) as {
    chain_stats: MempoolAddressStats;
    mempool_stats: MempoolAddressStats;
  };
  const txs = txsRes.ok ? ((await txsRes.json()) as MempoolTx[]) : [];

  const funded =
    (stats.chain_stats?.funded_txo_sum ?? 0) +
    (stats.mempool_stats?.funded_txo_sum ?? 0);
  const spent =
    (stats.chain_stats?.spent_txo_sum ?? 0) +
    (stats.mempool_stats?.spent_txo_sum ?? 0);
  const nativeBalance = sats(funded - spent);

  const lower = address.toLowerCase();
  const activity: WalletActivityItem[] = txs.slice(0, 25).map((tx) => {
    const inSum = (tx.vout ?? [])
      .filter((o) => o.scriptpubkey_address?.toLowerCase() === lower)
      .reduce((s, o) => s + (o.value ?? 0), 0);
    const outSum = (tx.vin ?? [])
      .filter(
        (i) => i.prevout?.scriptpubkey_address?.toLowerCase() === lower,
      )
      .reduce((s, i) => s + (i.prevout?.value ?? 0), 0);
    return {
      hash: tx.txid,
      time: tx.status.block_time
        ? new Date(tx.status.block_time * 1000).toISOString()
        : new Date().toISOString(),
      kind: "native" as const,
      direction:
        outSum > 0 && inSum > 0 ? "self" : outSum > 0 ? "out" : "in",
      amount: sats(Math.abs(inSum - outSum)),
      symbol: "BTC",
      counterparty: tx.txid.slice(0, 10) + "…",
      failed: false,
      pending: !tx.status.confirmed,
      url: `${http("mempool")}/tx/${tx.txid}`,
    };
  });

  return {
    address,
    chainId: "btc",
    chainName: "Bitcoin",
    nativeSymbol: "BTC",
    nativeBalance,
    nativeUsd: null,
    estValueUsd: null,
    tokens: [],
    activity,
    tokenScan: { rows: 0, capped: false },
    updatedAt: new Date().toISOString(),
  };
}
