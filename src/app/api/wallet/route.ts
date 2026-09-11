import {
  ADDRESS_RE,
  isWalletChainId,
  type WalletView,
} from "@/lib/data/etherscan";
import { fetchWalletView } from "@/lib/data/etherscan-server";
import { BTC_ADDRESS_RE, fetchBtcAddressView } from "@/lib/data/mempool";
import { fetchUsdPrices } from "@/lib/data/coingecko";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Thin, stateless wallet proxy — the address transits but is never stored
 * or logged (VISION §5). Key precedence: the caller's own key (BYOK header,
 * kept in their browser) > shared ETHERSCAN_API_KEY env. Bitcoin needs no
 * key at all (mempool.space public API).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address") ?? "";
  const rawChain = searchParams.get("chain") ?? "";
  const chain = rawChain === "btc" ? "btc" : Number(rawChain);
  const byokKey = req.headers.get("x-etherscan-key")?.trim() ?? "";

  if (!isWalletChainId(chain)) {
    return NextResponse.json({ error: "unsupported chain" }, { status: 400 });
  }

  const validAddress =
    chain === "btc" ? BTC_ADDRESS_RE.test(address) : ADDRESS_RE.test(address);
  if (!validAddress) {
    return NextResponse.json({ error: "invalid address" }, { status: 400 });
  }

  try {
    let view: WalletView;
    if (chain === "btc") {
      view = await fetchBtcAddressView(address);
      const prices = await fetchUsdPrices(["bitcoin"]);
      const usd = prices.bitcoin;
      if (usd != null) {
        view.nativeUsd = view.nativeBalance * usd;
        view.estValueUsd = view.nativeUsd;
      }
    } else {
      const apiKey = byokKey || process.env.ETHERSCAN_API_KEY || "";
      if (!apiKey) {
        return NextResponse.json({ error: "no api key" }, { status: 503 });
      }
      view = await fetchWalletView(address, chain, apiKey);
    }
    return NextResponse.json(view, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
