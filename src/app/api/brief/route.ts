import { getRegimeBundle } from "@/lib/data/bundle";
import { buildDailyCases } from "@/lib/cases/build";
import {
  buildDailyRitual,
  ritualToBriefItem,
  type DailyRitual,
} from "@/lib/editorial/ritual";
import { getHistoryDayDeltas } from "@/lib/history/deltas";
import { NextResponse } from "next/server";

export const revalidate = 120;

/**
 * Daily ritual — structure fixed; numbers only from computed signals.
 * Optional LLM may rephrase prose fields only (never invent facts).
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format"); // "ritual" | "brief" (default ritual)

    const [{ market, regime, sentiment, caseContext }, { deltas }] =
      await Promise.all([getRegimeBundle(), getHistoryDayDeltas()]);

    const cases = buildDailyCases(
      [...market.movers.gainers, ...market.movers.losers],
      caseContext,
    );

    let ritual = buildDailyRitual({
      market,
      regime,
      sentiment,
      deltas,
      cases,
    });

    if (process.env.OPENAI_API_KEY) {
      try {
        ritual = await enrichRitualProse(ritual);
      } catch {
        /* keep deterministic */
      }
    }

    if (format === "brief") {
      return NextResponse.json(ritualToBriefItem(ritual));
    }
    return NextResponse.json(ritual);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}

async function enrichRitualProse(ritual: DailyRitual): Promise<DailyRitual> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are CLAREZA editorial. Rewrite ONLY whyItMattersPt, whyItMattersEn, uncertainty, watchNext. Use the provided signals as the only facts — never invent numbers, events, or catalysts. PT-PT and EN. No buy/sell advice. If quietDay is true, keep the tone honest and short.",
        },
        {
          role: "user",
          content: JSON.stringify({
            quietDay: ritual.quietDay,
            fact: ritual.fact,
            posture: ritual.posture,
            score: ritual.score,
            headlinePt: ritual.headlinePt,
            headlineEn: ritual.headlineEn,
            notableDeltas: ritual.notableDeltas.map((d) => ({
              id: d.metricId,
              absChange: d.absChange,
              pctChange: d.pctChange,
              prev: d.prev,
              curr: d.curr,
            })),
            mover: ritual.mover,
            existing: {
              whyItMattersPt: ritual.whyItMattersPt,
              whyItMattersEn: ritual.whyItMattersEn,
              uncertainty: ritual.uncertainty,
              watchNext: ritual.watchNext,
            },
          }),
        },
      ],
    }),
  });

  if (!res.ok) throw new Error("LLM failed");
  const json = (await res.json()) as {
    choices: { message: { content: string } }[];
  };
  const parsed = JSON.parse(json.choices[0].message.content) as {
    whyItMattersPt?: string;
    whyItMattersEn?: string;
    uncertainty?: string;
    watchNext?: string;
  };

  return {
    ...ritual,
    whyItMattersPt: parsed.whyItMattersPt ?? ritual.whyItMattersPt,
    whyItMattersEn: parsed.whyItMattersEn ?? ritual.whyItMattersEn,
    uncertainty: parsed.uncertainty ?? ritual.uncertainty,
    watchNext: parsed.watchNext ?? ritual.watchNext,
    mode: "llm",
  };
}
