import { getDraftRecap, isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET() {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, picks: [], drafted: false, completeDate: null });
  }
  const { picks, drafted, completeDate } = await getDraftRecap();
  return Response.json({ configured: true, picks, drafted, completeDate });
}
