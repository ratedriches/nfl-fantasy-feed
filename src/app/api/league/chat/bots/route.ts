import { generateAndPostBotCommentary } from "@/lib/leagueChat";

// Triggered daily by Vercel Cron (see vercel.json). Vercel automatically sends
// `Authorization: Bearer $CRON_SECRET` on cron-triggered requests when the
// CRON_SECRET env var is set — this guards against anyone else hitting the
// route and spending your Anthropic API budget on demand.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await generateAndPostBotCommentary();
  return Response.json(result);
}
