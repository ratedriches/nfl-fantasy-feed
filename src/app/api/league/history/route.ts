import { getLeagueHistory, isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET() {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, seasons: [], owners: [] });
  }
  const { seasons, owners } = await getLeagueHistory();
  return Response.json({ configured: true, seasons, owners });
}
