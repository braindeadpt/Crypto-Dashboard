import { NextResponse } from "next/server";
import { fetchKlines } from "@/lib/data/binance";

export const revalidate = 60;

const SYMBOLS = new Set(["BTCUSDT", "ETHUSDT", "SOLUSDT"]);
const INTERVALS = new Set(["15m", "1h", "4h", "1d"]);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "BTCUSDT").toUpperCase();
  const interval = (searchParams.get("interval") ?? "1h") as
    | "15m"
    | "1h"
    | "4h"
    | "1d";

  if (!SYMBOLS.has(symbol) || !INTERVALS.has(interval)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  try {
    const bars = await fetchKlines(symbol, interval, 180);
    return NextResponse.json({ symbol, interval, bars });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "chart error" },
      { status: 502 },
    );
  }
}
