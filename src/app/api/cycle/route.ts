import { fetchCycleSnapshot } from "@/lib/data/cycle";
import { NextResponse } from "next/server";

export const revalidate = 300;

export async function GET() {
  try {
    const data = await fetchCycleSnapshot();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
