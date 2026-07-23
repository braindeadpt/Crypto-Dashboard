import { NextResponse } from "next/server";
import { getFrontPageData } from "@/lib/data/bundle";

export const revalidate = 60;

export async function GET() {
  try {
    const data = await getFrontPageData();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 },
    );
  }
}
