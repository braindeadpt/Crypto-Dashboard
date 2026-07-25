import { fetchSectorsSnapshot } from "@/lib/data/sectors";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Disk-only — no CoinGecko call on this path. */
export async function GET() {
  try {
    const data = await fetchSectorsSnapshot();
    if (!data) {
      return NextResponse.json(
        {
          error: "no_snapshot",
          note: "Corre /api/cron/refresh-heavy ou scripts/ingest-sectors.ts",
        },
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
