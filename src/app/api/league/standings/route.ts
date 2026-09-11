import { getLeagueStandings, isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET() {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, standings: [], divisions: [] });
  }
  const { teams, divisions } = await getLeagueStandings();
  return Response.json({ configured: true, standings: teams, divisions });
}
