import { fetchMarketsByIds, searchCoins } from "@/lib/data/coingecko";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/**
 * Watchlist quotes / search — public market data only.
 * Does NOT receive or store user watchlists (those stay in the browser).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    const idsParam = searchParams.get("ids");

    if (q) {
      const hits = await searchCoins(q, 10);
      return NextResponse.json({ hits });
    }

    if (idsParam) {
      const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20);
      const quotes = await fetchMarketsByIds(ids);
      return NextResponse.json({ quotes, updatedAt: new Date().toISOString() });
    }

    return NextResponse.json(
      { error: "Provide ?ids=bitcoin,ethereum or ?q=arb" },
      { status: 400 },
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
