import { getRegimeBundle } from "@/lib/data/bundle";
import { buildDeterministicBrief } from "@/lib/editorial/brief";
import { NextResponse } from "next/server";

export const revalidate = 120;

export async function GET() {
  try {
    const { market, regime, sentiment } = await getRegimeBundle();
    const brief = buildDeterministicBrief({ market, regime, sentiment });

    // Optional LLM enrichment
    if (process.env.OPENAI_API_KEY) {
      try {
        const enriched = await enrichWithLlm(brief, {
          headline: regime.headlineEn,
          fng: sentiment.fearGreed.value,
          btc: market.btc.change24h,
        });
        return NextResponse.json(enriched);
      } catch {
        return NextResponse.json(brief);
      }
    }

    return NextResponse.json(brief);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}

async function enrichWithLlm(
  brief: ReturnType<typeof buildDeterministicBrief>,
  ctx: { headline: string; fng: number; btc: number },
) {
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
            "You are the CLAREZA editorial desk. Write PT-PT (Portugal) and EN. Output JSON with keys: whyItMattersPt, whyItMattersEn, uncertainty, watchNext. No buy/sell advice. Calm, precise, educational.",
        },
        {
          role: "user",
          content: JSON.stringify({
            fact: brief.fact,
            context: ctx,
            existing: {
              whyItMattersPt: brief.whyItMattersPt,
              whyItMattersEn: brief.whyItMattersEn,
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
    ...brief,
    whyItMattersPt: parsed.whyItMattersPt ?? brief.whyItMattersPt,
    whyItMattersEn: parsed.whyItMattersEn ?? brief.whyItMattersEn,
    uncertainty: parsed.uncertainty ?? brief.uncertainty,
    watchNext: parsed.watchNext ?? brief.watchNext,
  };
}
