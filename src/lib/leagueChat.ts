import { Redis } from "@upstash/redis";
import Anthropic from "@anthropic-ai/sdk";
import { getLeagueMatchups, getPowerRankings, getTransactions } from "@/lib/espnFantasy";

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
// Runs once/day via a Vercel Cron job. To get a lively board out of a single
// daily invocation (rather than trickling one message at a time, which would
// need a cron frequency the free Vercel tier doesn't allow), each persona is
// asked for a small batch of distinct one-liners in a single Claude call.

interface BotPersona {
  name: string;
  voice: string;
  messagesPerRun: number;
}

const BOT_PERSONAS: BotPersona[] = [
  {
    name: "SUAREZBOT-9000",
    voice:
      "A trash-talking hype bot. Cocky, funny, loves roasting bad performances and hyping blowouts. Short and punchy, like a tweet.",
    messagesPerRun: 3,
  },
  {
    name: "FRYEBOT-9000",
    voice:
      "A deadpan stats nerd. Dry humor, cites specific numbers, treats fantasy football with mock-serious analytical gravity.",
    messagesPerRun: 3,
  },
  {
    name: "THE LEDGER",
    voice:
      "An old-timey scorekeeper/historian persona. Speaks like it's recording things for posterity, references records and precedent, slightly pompous.",
    messagesPerRun: 2,
  },
];

async function buildLeagueContext(): Promise<string> {
  const [{ teams, matchups, currentMatchupPeriod }, { rankings }, transactions] = await Promise.all([
    getLeagueMatchups(),
    getPowerRankings(),
    getTransactions(),
  ]);

  const teamName = (id: number | null) => teams.find((t) => t.id === id)?.name ?? "BYE";
  const thisWeek = matchups.filter((m) => m.matchupPeriodId === currentMatchupPeriod);

  const scoresLines = thisWeek
    .map((m) => `${teamName(m.homeTeamId)} ${m.homeScore.toFixed(1)} vs ${teamName(m.awayTeamId)} ${m.awayScore?.toFixed(1) ?? "—"}`)
    .join("\n");

  const rankingsLines = rankings
    .slice(0, 5)
    .map((r) => `#${r.rank} ${r.teamName} (power score ${r.powerScore.toFixed(1)}, all-play ${r.allPlayWins}-${r.allPlayLosses})`)
    .join("\n");

  const recentTx = transactions
    .slice(0, 5)
    .map((tx) => `${tx.teamName}: ${tx.items.map((i) => `${i.type} ${i.playerName}`).join(", ")}`)
    .join("\n");

  return [
    `Current week: ${currentMatchupPeriod}`,
    `\nThis week's matchups:\n${scoresLines || "No scores yet."}`,
    `\nTop 5 power rankings:\n${rankingsLines || "Not enough data yet."}`,
    `\nRecent transactions:\n${recentTx || "None recently."}`,
  ].join("\n");
}

export async function isAiBotConfigured(): Promise<boolean> {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// Claude often wraps JSON responses in a ```json ... ``` fence despite
// instructions not to — strip that before parsing rather than relying on the
// prompt alone.
function extractJsonArray(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenced ? fenced[1] : trimmed;
}

export async function generateAndPostBotCommentary(): Promise<{ posted: number }> {
  if (!process.env.ANTHROPIC_API_KEY || !isChatConfigured()) return { posted: 0 };

  const client = new Anthropic();
  const context = await buildLeagueContext();

  let posted = 0;

  for (const persona of BOT_PERSONAS) {
    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: `You are ${persona.name}, a bot personality that posts short comments in a fantasy football league's group chat. Voice: ${persona.voice}\n\nYou will be given the league's current scores, power rankings, and transactions. Write ${persona.messagesPerRun} SEPARATE, DISTINCT one-liner comments (1-2 sentences each) reacting to different specific details from the data — real team names, real scores, real numbers. Do not repeat the same topic across your comments. No hashtags, no emoji spam (an occasional single emoji is fine), no generic filler like "great week everyone".\n\nRespond with ONLY a JSON array of strings, nothing else. Example: ["comment one", "comment two"]`,
        messages: [{ role: "user", content: context }],
      });

      const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      if (!textBlock) continue;

      let lines: string[];
      try {
        lines = JSON.parse(extractJsonArray(textBlock.text));
      } catch {
        continue;
      }
      if (!Array.isArray(lines)) continue;

      for (const line of lines) {
        if (typeof line !== "string" || !line.trim()) continue;
        const result = await postMessage({ author: persona.name, text: line, isBot: true });
        if (result) posted++;
      }
    } catch {
      continue;
    }
  }

  return { posted };
}
