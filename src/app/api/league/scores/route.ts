import { getLeagueMatchups, isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET() {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, teams: [], matchups: [], currentMatchupPeriod: 1 });
  }
  const { teams, matchups, currentMatchupPeriod } = await getLeagueMatchups();
  return Response.json({ configured: true, teams, matchups, currentMatchupPeriod });
}
