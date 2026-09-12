import { buildAndStoreRecordBook } from "@/lib/recordBook";

// This does ~13 team-level calls plus one call per season+week for individual
// player scores (~230 calls total across 13 seasons) — needs more than the
// default 10s function timeout.
export const maxDuration = 60;

// Triggered weekly by Vercel Cron (see vercel.json), same CRON_SECRET pattern
// as the chat bots endpoint.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await buildAndStoreRecordBook();
  return Response.json(result);
}
