import { getTeamDetail } from "@/lib/teamDetail";
import { isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, team: null });
  }
  const { teamId } = await params;
  const team = await getTeamDetail(Number(teamId));
  return Response.json({ configured: true, team });
}
