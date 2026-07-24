import { NextResponse } from "next/server";
import { refreshHeavySnapshots } from "@/lib/data/refreshHeavy";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Heavy DefiLlama ingest (yields + protocols). Call from cron / manual.
 * Protect with CRON_SECRET when set: Authorization: Bearer <secret>
 */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await refreshHeavySnapshots();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "ingest failed" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
