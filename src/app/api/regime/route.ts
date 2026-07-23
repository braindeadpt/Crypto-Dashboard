import { getRegimeBundle } from "@/lib/data/bundle";
import { NextResponse } from "next/server";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getRegimeBundle();
    return NextResponse.json(data.regime);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
