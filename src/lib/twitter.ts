import { Redis } from "@upstash/redis";
import { teams, type Team } from "@/data/teams";
import { mockTweetsByTeam, type Tweet } from "@/data/mockTweets";

// twitterapi.io — a low-cost third-party X/Twitter API (no official dev
// account needed, ~$0.15/1k tweets). See TWITTER_API_KEY in .env.local.
const API_BASE = "https://api.twitterapi.io";
const TWEETS_PER_WRITER = 15;
const TWEETS_PER_TEAM = 30;
const CACHE_TTL_SECONDS = 180; // re-fetch at most every 3 minutes per team

function isConfigured(): boolean {
  return Boolean(process.env.TWITTER_API_KEY);
}

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return redisClient;
}

function cacheKey(slug: string): string {
  return `tweets:${slug}`;
}

interface RawTweet {
  id: string;
  text: string;
  createdAt: string;
  likeCount?: number;
  retweetCount?: number;
  replyCount?: number;
  retweeted_tweet?: unknown;
}

interface LastTweetsResponse {
  status: string;
  data?: { tweets?: RawTweet[] };
}

async function fetchTweetsForHandle(handle: string): Promise<RawTweet[]> {
  const url = `${API_BASE}/twitter/user/last_tweets?userName=${encodeURIComponent(handle)}`;
  const res = await fetch(url, {
    headers: { "X-API-Key": process.env.TWITTER_API_KEY! },
    // Beat writer tweets change fast enough that we don't want Next's own
    // fetch cache adding a second, uncoordinated caching layer on top of Redis.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`twitterapi.io ${res.status} for @${handle}`);
  const data = (await res.json()) as LastTweetsResponse;
  if (data.status !== "success") throw new Error(`twitterapi.io error for @${handle}: ${data.status}`);
  // Retweets carry the original post's content in `retweeted_tweet`; skip them
  // so beat writer feeds show original reporting, not reposts of other people's.
  return (data.data?.tweets ?? []).filter((t) => !t.retweeted_tweet).slice(0, TWEETS_PER_WRITER);
}

function toTweet(raw: RawTweet, team: Team, authorName: string, authorHandle: string, authorOutlet: string): Tweet {
  const parsed = new Date(raw.createdAt);
  return {
    id: raw.id,
    authorName,
    authorHandle,
    authorOutlet,
    content: raw.text,
    timestamp: Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString(),
    likes: raw.likeCount ?? 0,
    retweets: raw.retweetCount ?? 0,
    replies: raw.replyCount ?? 0,
  };
}

async function refreshTeamTweets(team: Team): Promise<Tweet[]> {
  const results = await Promise.allSettled(
    team.beatWriters.map(async (writer) => {
      const raw = await fetchTweetsForHandle(writer.handle);
      return raw.map((t) => toTweet(t, team, writer.name, writer.handle, writer.outlet));
    })
  );

  const tweets = results
    .filter((r): r is PromiseFulfilledResult<Tweet[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, TWEETS_PER_TEAM);

  const redis = getRedis();
  if (redis && tweets.length > 0) {
    await redis.set(cacheKey(team.slug), JSON.stringify(tweets), { ex: CACHE_TTL_SECONDS });
  }

  return tweets;
}

export function isTwitterConfigured(): boolean {
  return isConfigured();
}

/**
 * Real tweets when TWITTER_API_KEY is set (serving from a short-lived Redis
 * cache, refreshed on demand — see CACHE_TTL_SECONDS), falling back to
 * mockTweetsByTeam otherwise so the app still works without an API key.
 */
export async function getTweetsForTeam(team: Team): Promise<Tweet[]> {
  if (!isConfigured()) return mockTweetsByTeam[team.slug] ?? [];

  const redis = getRedis();
  if (redis) {
    const cached = await redis.get<string>(cacheKey(team.slug));
    if (cached) {
      try {
        return JSON.parse(cached) as Tweet[];
      } catch {
        // fall through to a live refresh
      }
    }
  }

  try {
    const fresh = await refreshTeamTweets(team);
    return fresh.length > 0 ? fresh : mockTweetsByTeam[team.slug] ?? [];
  } catch {
    return mockTweetsByTeam[team.slug] ?? [];
  }
}

/**
 * Cache-only read, no live API call — used by the cross-team search route so
 * typing in the search box doesn't fan out 32 x 3 live requests per keystroke.
 */
export async function getCachedTweetsForTeam(team: Team): Promise<Tweet[]> {
  if (!isConfigured()) return mockTweetsByTeam[team.slug] ?? [];

  const redis = getRedis();
  if (redis) {
    const cached = await redis.get<string>(cacheKey(team.slug));
    if (cached) {
      try {
        return JSON.parse(cached) as Tweet[];
      } catch {
        // fall through
      }
    }
  }
  return mockTweetsByTeam[team.slug] ?? [];
}

/** Refreshes every team's cache in parallel. Used by the polling cron route. */
export async function refreshAllTeams(): Promise<{ teams: number; tweets: number }> {
  const results = await Promise.allSettled(teams.map((team) => refreshTeamTweets(team)));
  const tweetCount = results
    .filter((r): r is PromiseFulfilledResult<Tweet[]> => r.status === "fulfilled")
    .reduce((sum, r) => sum + r.value.length, 0);
  return { teams: teams.length, tweets: tweetCount };
}
