import { generateSingleBotPost, type BotTopic } from "@/lib/leagueChat";

const VALID_TOPICS: BotTopic[] = [
  "matchupRecap",
  "powerRankings",
  "playerPerformances",
  "standings",
  "weeklyRecap",
  "nflTeamStats",
  "transactions",
];

// Triggered by six separate Vercel Crons (see vercel.json), one per weekly
// slot — each specifies which bot should post via ?bot=, and Tuesday's slot
// pins ?topic=matchupRecap since that's the only day matchups get discussed.
// Vercel automatically sends `Authorization: Bearer $CRON_SECRET` on
// cron-triggered requests when the CRON_SECRET env var is set — this guards
// against anyone else hitting the route and spending your Anthropic budget.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const url = new URL(req.url);
  const bot = url.searchParams.get("bot");
  const topicParam = url.searchParams.get("topic");
  const topic = topicParam && (VALID_TOPICS as string[]).includes(topicParam) ? (topicParam as BotTopic) : undefined;

  if (!bot) {
    return Response.json({ error: "Missing ?bot= query param" }, { status: 400 });
  }

  const result = await generateSingleBotPost(bot, topic);
  return Response.json(result);
}
