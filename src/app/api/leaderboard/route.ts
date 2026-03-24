import { NextResponse } from "next/server";
import { getLeaderboardData } from "@/lib/leaderboard-fetch";

export const maxDuration = 30;

export async function GET() {
  try {
    const { data, lastUpdated, capabilityMap } = await getLeaderboardData();
    return NextResponse.json({ data, lastUpdated, capabilityMap });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return NextResponse.json(
      { error: "Failed to load leaderboard data. Please try again later." },
      { status: 502 }
    );
  }
}
