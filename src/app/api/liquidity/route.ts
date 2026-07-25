import { fetchLiquiditySnapshot } from "@/lib/data/liquidity";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchLiquiditySnapshot();
    if (!data) {
      return NextResponse.json(
        { error: "no_snapshot", note: "Run refresh-heavy or ingest-liquidity" },
        { status: 404 },
      );
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
