import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CG = "https://api.coingecko.com/api/v3";

function cgHeaders(): HeadersInit {
  const headers: Record<string, string> = { Accept: "application/json" };
  const key =
    process.env.COINGECKO_DEMO_API_KEY ||
    process.env.COINGECKO_API_KEY ||
    "";
  if (key) headers["x-cg-demo-api-key"] = key;
  return headers;
}

/**
 * On-demand coins for a category — only after user click, never on page SSR.
 * Uses CoinGecko /coins/markets?category=
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  if (!category || !/^[a-z0-9-]+$/i.test(category)) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${CG}/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h`,
      { cache: "no-store", headers: cgHeaders() },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko ${res.status}` },
        { status: 502 },
      );
    }
    const raw = (await res.json()) as {
      id: string;
      symbol: string;
      name: string;
      image: string;
      current_price: number;
      market_cap: number;
      price_change_percentage_24h: number | null;
    }[];

    const coins = (raw ?? []).map((c) => ({
      id: c.id,
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change24h: c.price_change_percentage_24h ?? 0,
      marketCap: c.market_cap,
      image: c.image,
    }));

    return NextResponse.json({ category, coins });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
