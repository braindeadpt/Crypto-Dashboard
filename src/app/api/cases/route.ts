import { buildDailyCases } from "@/lib/cases/build";
import { getRegimeBundle } from "@/lib/data/bundle";
import { buildCaseFile } from "@/lib/cases/build";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const { market, sentiment } = await getRegimeBundle();
    const movers = [...market.movers.gainers, ...market.movers.losers];
    const cases = buildDailyCases(movers, sentiment);

    if (id) {
      const found =
        cases.find((c) => c.id === id) ||
        (() => {
          const m = movers.find(
            (x) => `case-${x.id}` === id || x.caseId === id || x.id === id,
          );
          return m ? buildCaseFile(m, sentiment) : null;
        })();
      if (!found) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
      return NextResponse.json(found);
    }

    return NextResponse.json({ cases });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
