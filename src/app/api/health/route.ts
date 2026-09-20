import { NextResponse } from "next/server";
import { readHealth } from "@/lib/data/health";
import { SOURCES, type SourceId } from "@/lib/data/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_AFTER_MS = 6 * 60 * 60_000;

/**
 * Estado de saúde por fonte (DESENHO-V5 §5.4). Lê data/snapshots/health.json
 * — escrito pelo ingest — e marca staleSources: fontes live/snapshot cujo
 * último sucesso tem mais de 6h (ou nunca existiu).
 */
export async function GET() {
  const health = await readHealth();
  const now = Date.now();

  const staleSources = (Object.keys(SOURCES) as SourceId[]).filter((id) => {
    const def = SOURCES[id];
    if (def.kind === "browser") return false;
    const lastOk = health?.sources?.[id]?.lastOk;
    if (!lastOk) return true;
    const t = Date.parse(lastOk);
    return !Number.isFinite(t) || now - t > STALE_AFTER_MS;
  });

  return NextResponse.json(
    {
      updatedAt: health?.updatedAt ?? null,
      sources: health?.sources ?? {},
      staleSources,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
