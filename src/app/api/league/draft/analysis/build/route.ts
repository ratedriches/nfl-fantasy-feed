import { buildAndStoreDraftAnalysis } from "@/lib/draftAnalysis";

// A single Opus call grading every team's draft — not on a recurring cron
// (the draft only happens once a season). Trigger manually after each
// season's draft via GET with the CRON_SECRET bearer token.
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await buildAndStoreDraftAnalysis();
  return Response.json(result);
}
