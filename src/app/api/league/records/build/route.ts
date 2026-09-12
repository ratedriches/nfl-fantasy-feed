import { buildAndStoreRecordBook } from "@/lib/recordBook";
import { generateAndStoreWeeklyRecap } from "@/lib/weeklyRecap";

// This does ~13 team-level calls plus one call per season+week for individual
// player scores (~230 calls total across 13 seasons) — needs more than the
// default 10s function timeout.
export const maxDuration = 60;

// Triggered weekly by Vercel Cron (see vercel.json), same CRON_SECRET pattern
// as the chat bots endpoint. Also generates the weekly recap here rather than
// a separate cron — both are weekly maintenance tasks, and Vercel's free tier
// caps how many cron jobs a project can have.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const [recordBookResult, recapResult] = await Promise.all([
    buildAndStoreRecordBook(),
    generateAndStoreWeeklyRecap(),
  ]);

  return Response.json({ recordBook: recordBookResult, recap: recapResult });
}
