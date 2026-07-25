import { getHistoryContexts } from "@/lib/history/context";
import { HISTORY_METRIC_IDS } from "@/lib/history/metrics";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Historical context for central metrics — disk only, no live upstream calls.
 * Shape per metric: { valor, percentil, zScore, min, max, mediana,
 * classificação, diasDeAmostra, janelaDias }
 *
 * Optional ?metric=funding_btc for a single series.
 * Optional overrides via query are intentionally omitted — never invent values.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get("metric");

    const data = await getHistoryContexts();

    if (metric) {
      if (!HISTORY_METRIC_IDS.includes(metric as (typeof HISTORY_METRIC_IDS)[number])) {
        return NextResponse.json(
          { error: `unknown metric: ${metric}` },
          { status: 400 },
        );
      }
      const ctx = data.metrics[metric as keyof typeof data.metrics];
      if (!ctx) {
        return NextResponse.json(
          {
            metric,
            updatedAt: data.updatedAt,
            windowDays: data.windowDays,
            context: null,
            note: "Sem série persistida ainda — corre /api/cron/refresh-heavy.",
          },
          { status: 200 },
        );
      }
      return NextResponse.json({
        metric,
        updatedAt: data.updatedAt,
        windowDays: data.windowDays,
        context: ctx,
      });
    }

    return NextResponse.json({
      updatedAt: data.updatedAt,
      windowDays: data.windowDays,
      metrics: data.metrics,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 },
    );
  }
}
