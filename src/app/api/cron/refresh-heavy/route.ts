import { NextResponse } from "next/server";
import { refreshHeavySnapshots } from "@/lib/data/refreshHeavy";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Heavy DefiLlama ingest (yields + protocols). Só POST.
 * CRON_SECRET obrigatório: Authorization: Bearer <secret>.
 */
export async function POST(req: Request) {
  // CRON_SECRET é obrigatório — sem ele a rota recusa-se (F0.7).
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado no servidor" },
      { status: 503 },
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
