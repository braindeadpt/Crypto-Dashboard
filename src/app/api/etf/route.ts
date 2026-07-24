import { fetchEtfSnapshot } from "@/lib/data/etf";
import { NextResponse } from "next/server";

export const revalidate = 1800;

export async function GET() {
  try {
    const data = await fetchEtfSnapshot();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "etf error" },
      { status: 502 },
    );
  }
}
