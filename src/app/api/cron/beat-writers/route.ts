import { refreshAllTeams } from "@/lib/twitter";

// Vercel Hobby plans only allow daily cron jobs, so this is a once-a-day
// top-up. Between runs, getTweetsForTeam() in src/lib/twitter.ts still
// refreshes each team on demand (rate-limited by its own short Redis cache),
// which is what actually keeps the feed fresh through the day.
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await refreshAllTeams();
  return Response.json(result);
}
