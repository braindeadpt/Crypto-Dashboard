import { fetchMarketSnapshot } from "@/lib/data/coingecko";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await fetchMarketSnapshot();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
