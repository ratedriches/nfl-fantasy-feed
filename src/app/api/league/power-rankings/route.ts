import { getPowerRankings, isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET() {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, rankings: [], weeksConsidered: [] });
  }
  const { rankings, weeksConsidered } = await getPowerRankings();
  return Response.json({ configured: true, rankings, weeksConsidered });
}
