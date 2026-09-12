import { getDraftRecap, isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET() {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, picks: [], drafted: false, completeDate: null, summary: null });
  }
  const { picks, drafted, completeDate, summary } = await getDraftRecap();
  return Response.json({ configured: true, picks, drafted, completeDate, summary });
}
