import { fetchDefiSnapshot } from "@/lib/data/defillama";
import { NextResponse } from "next/server";

export const revalidate = 120;

export async function GET() {
  try {
    const data = await fetchDefiSnapshot();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
