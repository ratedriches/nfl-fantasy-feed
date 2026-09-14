import { Redis } from "@upstash/redis";
import Anthropic from "@anthropic-ai/sdk";
import { getLeagueMatchups, getPowerRankings, getLeagueStandings, getTransactions, type Matchup } from "@/lib/espnFantasy";
import { getAllTeamStats } from "@/lib/espn";
import { getRecapIndex, getRecap } from "@/lib/weeklyRecap";
import { getRecordBook } from "@/lib/recordBook";

const CHAT_KEY = "league:chat:messages";
const MAX_MESSAGES = 500;
const MAX_NAME_LENGTH = 24;
const MAX_TEXT_LENGTH = 500;

export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  isBot: boolean;
}

// Vercel's Upstash integration names these KV_REST_API_URL / KV_REST_API_TOKEN
// (legacy "Vercel KV" naming), not the @upstash/redis default UPSTASH_REDIS_REST_*.
export function isChatConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!isChatConfigured()) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

export async function getMessages(limit = 100): Promise<ChatMessage[]> {
  const redis = getRedis();
  if (!redis) return [];
  // Stored newest-first (LPUSH); reverse for chronological display.
  const raw = await redis.lrange<string>(CHAT_KEY, 0, limit - 1);
  const messages = raw
    .map((item) => {
      try {
        return typeof item === "string" ? (JSON.parse(item) as ChatMessage) : (item as unknown as ChatMessage);
      } catch {
        return null;
      }
    })
    .filter((m): m is ChatMessage => m !== null);
  return messages.reverse();
}

export interface PostMessageInput {
  author: string;
  text: string;
  isBot?: boolean;
}

export async function postMessage(input: PostMessageInput): Promise<ChatMessage | null> {
  const redis = getRedis();
  if (!redis) return null;

  const author = input.author.trim().slice(0, MAX_NAME_LENGTH);
  const text = input.text.trim().slice(0, MAX_TEXT_LENGTH);
  if (!author || !text) return null;

  const message: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    author,
    text,
    timestamp: Date.now(),
    isBot: Boolean(input.isBot),
  };

  await redis.lpush(CHAT_KEY, JSON.stringify(message));
  await redis.ltrim(CHAT_KEY, 0, MAX_MESSAGES - 1);

  return message;
}

// ─── AI bot commentary ──────────────────────────────────────────────────────
//
// Each bot posts exactly ONE message per scheduled slot (see vercel.json —
// six weekly crons, one bot + topic per slot, staggered days/times so they
// never all fire together). Tuesday is reserved for recapping the just-
// completed week's matchups; every other slot picks a non-matchup topic.

export type BotTopic =
  | "matchupRecap"
  | "powerRankings"
  | "playerPerformances"
  | "standings"
  | "weeklyRecap"
  | "nflTeamStats"
  | "transactions";

const GENERAL_TOPICS: BotTopic[] = [
  "powerRankings",
  "playerPerformances",
  "standings",
  "weeklyRecap",
  "nflTeamStats",
  "transactions",
];

interface BotPersona {
  name: string;
  voice: string;
}

export const BOT_PERSONAS: Record<string, BotPersona> = {
  suarez: {
    name: "SUAREZBOT-9000",
    voice:
      "A trash-talking hype bot. Cocky, funny, loves roasting bad performances and hyping blowouts. Short and punchy, like a tweet.",
  },
  frye: {
    name: "FRYEBOT-9000",
    voice:
      "A deadpan stats nerd. Dry humor, cites specific numbers, treats fantasy football with mock-serious analytical gravity.",
  },
  ledger: {
    name: "THE LEDGER",
    voice:
      "An old-timey scorekeeper/historian persona. Speaks like it's recording things for posterity, references records and precedent, slightly pompous.",
  },
};

export async function isAiBotConfigured(): Promise<boolean> {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function pickRandomTopic(): BotTopic {
  return GENERAL_TOPICS[Math.floor(Math.random() * GENERAL_TOPICS.length)];
}

// The most recent week where every matchup has a decided winner — i.e. the
// week that "just concluded" from Tuesday's perspective, regardless of
// whether ESPN's currentMatchupPeriod has already ticked over to the new week.
function findLastCompletedWeek(matchups: Matchup[]): number | null {
  const weeks = Array.from(new Set(matchups.map((m) => m.matchupPeriodId))).sort((a, b) => b - a);
  for (const week of weeks) {
    const weekMatchups = matchups.filter((m) => m.matchupPeriodId === week);
    if (weekMatchups.length > 0 && weekMatchups.every((m) => m.winner !== "UNDECIDED")) return week;
  }
  return null;
}

async function buildTopicContext(topic: BotTopic): Promise<string | null> {
  switch (topic) {
    case "matchupRecap": {
      const { teams, matchups } = await getLeagueMatchups();
      const week = findLastCompletedWeek(matchups);
      if (week === null) return null;
      const teamName = (id: number | null) => teams.find((t) => t.id === id)?.name ?? "BYE";
      const lines = matchups
        .filter((m) => m.matchupPeriodId === week)
        .map((m) => {
          const winner = m.winner === "HOME" ? teamName(m.homeTeamId) : m.winner === "AWAY" ? teamName(m.awayTeamId) : "tie";
          return `${teamName(m.homeTeamId)} ${m.homeScore.toFixed(1)} vs ${teamName(m.awayTeamId)} ${m.awayScore?.toFixed(1) ?? "—"} (winner: ${winner})`;
        })
        .join("\n");
      return lines ? `Week ${week} results (just completed):\n${lines}` : null;
    }
    case "powerRankings": {
      const { rankings } = await getPowerRankings();
      if (rankings.length === 0) return null;
      const lines = rankings
        .map(
          (r) =>
            `#${r.rank} ${r.teamName} (power score ${r.powerScore.toFixed(1)}, actual record ${r.actualWins}-${r.actualLosses}, all-play ${r.allPlayWins}-${r.allPlayLosses})`
        )
        .join("\n");
      return `Current power rankings:\n${lines}`;
    }
    case "standings": {
      const { teams } = await getLeagueStandings();
      if (teams.length === 0) return null;
      const lines = teams
        .map((t, i) => `#${i + 1} ${t.name} (${t.wins}-${t.losses}${t.ties ? `-${t.ties}` : ""}, ${t.pointsFor.toFixed(1)} PF)`)
        .join("\n");
      return `Current league standings:\n${lines}`;
    }
    case "transactions": {
      const txs = await getTransactions();
      if (txs.length === 0) return null;
      const lines = txs
        .slice(0, 8)
        .map((tx) => `${tx.teamName}: ${tx.items.map((i) => `${i.type} ${i.playerName}`).join(", ")}`)
        .join("\n");
      return `Recent transactions:\n${lines}`;
    }
    case "weeklyRecap": {
      const index = await getRecapIndex();
      if (index.length === 0) return null;
      const latest = index[0];
      const full = await getRecap(latest.year, latest.week);
      if (!full) return null;
      return `This week's recap article (headline: "${full.headline}"):\n${full.body}`;
    }
    case "nflTeamStats": {
      const stats = await getAllTeamStats();
      if (stats.length === 0) return null;
      const top = [...stats].sort((a, b) => b.avgPointsFor - a.avgPointsFor).slice(0, 5);
      const lines = top
        .map(
          (t) =>
            `${t.abbrev}: ${t.avgPointsFor.toFixed(1)} pts/g, ${t.totalOffensiveYardsPerGame} total yds/g, ${t.sacks} sacks, ${t.defensiveInterceptions} INTs`
        )
        .join("\n");
      return `Top 5 real NFL teams by scoring this season:\n${lines}`;
    }
    case "playerPerformances": {
      const recordBook = await getRecordBook();
      if (!recordBook) return null;
      const positions = Object.keys(recordBook.topPlayersByPosition);
      if (positions.length === 0) return null;
      const pos = positions[Math.floor(Math.random() * positions.length)];
      const top = recordBook.topPlayersByPosition[pos].slice(0, 3);
      if (top.length === 0) return null;
      const lines = top
        .map((p) => `${p.playerName} (${p.position}) — ${p.points.toFixed(1)} pts, ${p.teamName} (${p.ownerName}), ${p.year} Wk ${p.week}`)
        .join("\n");
      return `All-time best ${pos} weekly performances in this league's history:\n${lines}`;
    }
  }
}

export async function generateSingleBotPost(
  personaKey: string,
  requestedTopic?: BotTopic
): Promise<{ ok: boolean; reason?: string; topic?: BotTopic }> {
  if (!process.env.ANTHROPIC_API_KEY || !isChatConfigured()) return { ok: false, reason: "not_configured" };

  const persona = BOT_PERSONAS[personaKey];
  if (!persona) return { ok: false, reason: "unknown_persona" };

  const topic = requestedTopic ?? pickRandomTopic();
  const context = await buildTopicContext(topic);
  if (!context) return { ok: false, reason: `no_data_for_topic:${topic}`, topic };

  const topicInstruction =
    topic === "matchupRecap"
      ? "React to how last week's matchups played out — call out a specific winner, loser, or score."
      : "React to this specific data with one sharp, specific observation.";

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: `You are ${persona.name}, a bot personality posting in a fantasy football league's group chat. Voice: ${persona.voice}\n\n${topicInstruction} Use ONLY the real data given — real team/player names and numbers, never invented. Write exactly ONE comment, 1-2 sentences. No hashtags, no emoji spam (an occasional single emoji is fine), no generic filler like "great week everyone". Respond with ONLY the comment text — no quotes, no JSON, no preamble.`,
      messages: [{ role: "user", content: context }],
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
    if (!textBlock) return { ok: false, reason: "no_response", topic };

    const text = textBlock.text.trim().replace(/^"(.*)"$/, "$1");
    if (!text) return { ok: false, reason: "empty_response", topic };

    const result = await postMessage({ author: persona.name, text, isBot: true });
    return { ok: Boolean(result), topic };
  } catch {
    return { ok: false, reason: "api_error", topic };
  }
}
