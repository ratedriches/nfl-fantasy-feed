import { getAllTeamChatMentions } from "@/lib/teamDetail";
import { isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET(_req: Request, { params }: { params: Promise<{ teamId: string }> }) {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, mentions: [] });
  }
  const { teamId } = await params;
  const mentions = await getAllTeamChatMentions(Number(teamId));
  return Response.json({ configured: true, mentions: mentions ?? [] });
}
