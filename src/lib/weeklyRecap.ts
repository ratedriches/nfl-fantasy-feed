import { Redis } from "@upstash/redis";
import Anthropic from "@anthropic-ai/sdk";
import { getLeagueMatchups } from "@/lib/espnFantasy";

const RECAPS_INDEX_KEY = "league:recaps:index";
const recapKey = (year: number, week: number) => `league:recap:${year}:${week}`;

function isRedisConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!isRedisConfigured()) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

export function isRecapConfigured(): boolean {
  return isRedisConfigured() && Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface RecapSummary {
  year: number;
  week: number;
  headline: string;
  generatedAt: number;
}

export interface WeeklyRecap extends RecapSummary {
  body: string;
}

export async function getRecapIndex(): Promise<RecapSummary[]> {
  const redis = getRedis();
  if (!redis) return [];
  const raw = await redis.get<RecapSummary[]>(RECAPS_INDEX_KEY);
  return Array.isArray(raw) ? raw : [];
}

export async function getRecap(year: number, week: number): Promise<WeeklyRecap | null> {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get<WeeklyRecap>(recapKey(year, week));
}

// Claude often wraps JSON in a ```json fence despite instructions not to.
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenced ? fenced[1] : trimmed;
}

export async function generateAndStoreWeeklyRecap(): Promise<{ ok: boolean; reason?: string; year?: number; week?: number }> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "no_api_key" };
  const redis = getRedis();
  if (!redis) return { ok: false, reason: "no_redis" };

  const { teams, matchups, currentMatchupPeriod } = await getLeagueMatchups();
  if (teams.length === 0) return { ok: false, reason: "no_league_data" };

  const year = Number(process.env.ESPN_SEASON ?? new Date().getFullYear());
  const week = currentMatchupPeriod;
  const weekMatchups = matchups.filter((m) => m.matchupPeriodId === week);

  if (weekMatchups.length === 0) return { ok: false, reason: "no_matchups_for_week" };
  if (weekMatchups.some((m) => m.winner === "UNDECIDED")) {
    return { ok: false, reason: "week_not_finished" };
  }

  const teamName = (id: number | null) => teams.find((t) => t.id === id)?.name ?? "BYE";

  const resultLines = weekMatchups
    .map((m) => `${teamName(m.homeTeamId)} ${m.homeScore.toFixed(1)} vs ${teamName(m.awayTeamId)} ${m.awayScore?.toFixed(1) ?? "—"} (winner: ${m.winner === "HOME" ? teamName(m.homeTeamId) : m.winner === "AWAY" ? teamName(m.awayTeamId) : "tie"})`)
    .join("\n");

  const decided = weekMatchups.filter((m) => m.awayTeamId !== null && m.awayScore !== null);
  const withMargin = decided.map((m) => ({ m, margin: Math.abs(m.homeScore - (m.awayScore as number)) }));
  const closest = [...withMargin].sort((a, b) => a.margin - b.margin)[0];
  const biggest = [...withMargin].sort((a, b) => b.margin - a.margin)[0];

  const closestLine = closest
    ? `Closest game: ${teamName(closest.m.homeTeamId)} vs ${teamName(closest.m.awayTeamId)}, decided by ${closest.margin.toFixed(1)} points.`
    : "";
  const biggestLine = biggest
    ? `Biggest blowout: ${teamName(biggest.m.homeTeamId)} vs ${teamName(biggest.m.awayTeamId)}, decided by ${biggest.margin.toFixed(1)} points.`
    : "";

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1500,
    system: `You are the beat writer for "Rated R League", a fantasy football league's weekly recap column. Write an engaging, slightly dramatic recap of this week's matchups using ONLY the real team names and scores given — never invent stats or players. Reference the closest game and the biggest blowout by name. 3-4 short paragraphs, punchy sports-column tone. Respond with ONLY a JSON object: {"headline": "short punchy headline", "body": "paragraphs separated by \\n\\n"}. No markdown fences, no commentary outside the JSON.`,
    messages: [
      {
        role: "user",
        content: `Week ${week}, ${year} results:\n${resultLines}\n\n${closestLine}\n${biggestLine}`,
      },
    ],
  });

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) return { ok: false, reason: "no_response" };

  let parsed: { headline?: string; body?: string };
  try {
    parsed = JSON.parse(extractJson(textBlock.text));
  } catch {
    return { ok: false, reason: "bad_json" };
  }
  if (!parsed.headline || !parsed.body) return { ok: false, reason: "incomplete_response" };

  const recap: WeeklyRecap = {
    year,
    week,
    headline: parsed.headline,
    body: parsed.body,
    generatedAt: Date.now(),
  };

  await redis.set(recapKey(year, week), JSON.stringify(recap));

  const index = await getRecapIndex();
  const filtered = index.filter((r) => !(r.year === year && r.week === week));
  filtered.push({ year, week, headline: recap.headline, generatedAt: recap.generatedAt });
  filtered.sort((a, b) => b.year - a.year || b.week - a.week);
  await redis.set(RECAPS_INDEX_KEY, JSON.stringify(filtered));

  return { ok: true, year, week };
}
