import { Redis } from "@upstash/redis";
import { getPastSeasonYears } from "@/lib/espnFantasy";

const LEAGUE_ID = process.env.ESPN_LEAGUE_ID ?? "";
const RECORD_BOOK_KEY = "league:recordbook";

function authCookie(): string | null {
  const s2 = process.env.ESPN_S2?.trim();
  const swid = process.env.ESPN_SWID?.trim();
  if (!s2 || !swid) return null;
  return `espn_s2=${s2}; SWID=${swid}`;
}

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

async function fetchSeason(year: number, views: string[], scoringPeriodId?: number): Promise<any | null> {
  const cookie = authCookie();
  if (!cookie || !LEAGUE_ID) return null;
  const qs = views.map((v) => `view=${v}`).join("&");
  const periodQs = scoringPeriodId ? `&scoringPeriodId=${scoringPeriodId}` : "";
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${LEAGUE_ID}?seasonId=${year}&${qs}${periodQs}`;
  try {
    const res = await fetch(url, { headers: { Cookie: cookie }, cache: "no-store" });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json) ? json[0] : json;
  } catch {
    return null;
  }
}

function teamDisplayName(t: any): string {
  if (t.name) return t.name;
  const loc = t.location ?? "";
  const nick = t.nickname ?? "";
  return `${loc} ${nick}`.trim() || `Team ${t.id}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyTeamScore {
  year: number;
  week: number;
  teamName: string;
  ownerName: string;
  score: number;
}

export interface MatchupRecord {
  year: number;
  week: number;
  teamA: string;
  ownerA: string;
  scoreA: number;
  teamB: string;
  ownerB: string;
  scoreB: number;
  margin: number;
}

export interface SeasonRecord {
  year: number;
  teamName: string;
  ownerName: string;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
}

export interface PlayerWeekRecord {
  year: number;
  week: number;
  playerName: string;
  position: string;
  points: number;
  teamName: string;
  ownerName: string;
}

export interface RecordBook {
  computedAt: number;
  seasonsCovered: number[];
  topWeeklyTeamScores: WeeklyTeamScore[];
  closestMatchups: MatchupRecord[];
  biggestBlowouts: MatchupRecord[];
  bestSeasonRecords: SeasonRecord[];
  worstSeasonRecords: SeasonRecord[];
  topPlayersByPosition: Record<string, PlayerWeekRecord[]>;
}

export async function getRecordBook(): Promise<RecordBook | null> {
  const redis = getRedis();
  if (!redis) return null;
  return redis.get<RecordBook>(RECORD_BOOK_KEY);
}

export function isRecordBookConfigured(): boolean {
  return isRedisConfigured() && Boolean(authCookie()) && Boolean(LEAGUE_ID);
}

// ─── Team-level records (fast — one call per season) ──────────────────────────

async function computeTeamRecords(years: number[]) {
  const weeklyScores: WeeklyTeamScore[] = [];
  const matchups: MatchupRecord[] = [];
  const seasonRecords: SeasonRecord[] = [];

  const seasonDataList = await Promise.all(
    years.map((y) => fetchSeason(y, ["mTeam", "mStandings", "mMatchup", "mSettings"]))
  );

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const data = seasonDataList[i];
    if (!data?.teams) continue;

    const memberName = new Map<string, string>();
    for (const m of data.members ?? []) {
      const full = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
      memberName.set(m.id, full || m.displayName || "Unknown Owner");
    }

    const teamById = new Map<number, { name: string; ownerName: string }>();
    for (const t of data.teams) {
      const ownerId = t.primaryOwner ?? t.owners?.[0] ?? "";
      teamById.set(t.id, { name: teamDisplayName(t), ownerName: memberName.get(ownerId) ?? "Unknown Owner" });

      const overall = t.record?.overall ?? {};
      const wins = overall.wins ?? 0;
      const losses = overall.losses ?? 0;
      const ties = overall.ties ?? 0;
      const total = wins + losses + ties;
      seasonRecords.push({
        year,
        teamName: teamDisplayName(t),
        ownerName: memberName.get(ownerId) ?? "Unknown Owner",
        wins,
        losses,
        ties,
        winPct: total > 0 ? Math.round(((wins + ties * 0.5) / total) * 1000) / 10 : 0,
      });
    }

    for (const m of data.schedule ?? []) {
      const home = m.home;
      const away = m.away;
      if (home?.teamId && typeof home.totalPoints === "number" && home.totalPoints > 0) {
        const t = teamById.get(home.teamId);
        if (t) weeklyScores.push({ year, week: m.matchupPeriodId, teamName: t.name, ownerName: t.ownerName, score: home.totalPoints });
      }
      if (away?.teamId && typeof away.totalPoints === "number" && away.totalPoints > 0) {
        const t = teamById.get(away.teamId);
        if (t) weeklyScores.push({ year, week: m.matchupPeriodId, teamName: t.name, ownerName: t.ownerName, score: away.totalPoints });
      }
      if (
        home?.teamId &&
        away?.teamId &&
        typeof home.totalPoints === "number" &&
        typeof away.totalPoints === "number" &&
        home.totalPoints > 0 &&
        away.totalPoints > 0
      ) {
        const tA = teamById.get(home.teamId);
        const tB = teamById.get(away.teamId);
        if (tA && tB) {
          matchups.push({
            year,
            week: m.matchupPeriodId,
            teamA: tA.name,
            ownerA: tA.ownerName,
            scoreA: home.totalPoints,
            teamB: tB.name,
            ownerB: tB.ownerName,
            scoreB: away.totalPoints,
            margin: Math.round(Math.abs(home.totalPoints - away.totalPoints) * 100) / 100,
          });
        }
      }
    }
  }

  weeklyScores.sort((a, b) => b.score - a.score);
  const closestMatchups = [...matchups].sort((a, b) => a.margin - b.margin).slice(0, 10);
  const biggestBlowouts = [...matchups].sort((a, b) => b.margin - a.margin).slice(0, 10);
  const bestSeasonRecords = [...seasonRecords].sort((a, b) => b.winPct - a.winPct).slice(0, 5);
  const worstSeasonRecords = [...seasonRecords].sort((a, b) => a.winPct - b.winPct).slice(0, 5);

  return {
    topWeeklyTeamScores: weeklyScores.slice(0, 10),
    closestMatchups,
    biggestBlowouts,
    bestSeasonRecords,
    worstSeasonRecords,
  };
}

// ─── Individual player weekly records (heavy — one call per season+week) ──────

const POSITION_MAP: Record<number, string> = {
  1: "QB",
  2: "RB",
  3: "WR",
  4: "TE",
  5: "K",
  7: "P",
  9: "DT",
  10: "DE",
  11: "LB",
  12: "CB",
  13: "S",
  14: "DB",
  16: "D/ST",
};

async function fetchWeekPlayerScores(year: number, week: number): Promise<PlayerWeekRecord[]> {
  const data = await fetchSeason(year, ["mTeam", "mRoster", "mBoxscore"], week);
  if (!data?.teams) return [];

  const memberName = new Map<string, string>();
  for (const m of data.members ?? []) {
    const full = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
    memberName.set(m.id, full || m.displayName || "Unknown Owner");
  }

  const records: PlayerWeekRecord[] = [];
  for (const t of data.teams) {
    const ownerId = t.primaryOwner ?? t.owners?.[0] ?? "";
    const teamName = teamDisplayName(t);
    const ownerName = memberName.get(ownerId) ?? "Unknown Owner";

    for (const entry of t.roster?.entries ?? []) {
      const player = entry.playerPoolEntry?.player;
      if (!player) continue;
      const position = POSITION_MAP[player.defaultPositionId];
      if (!position) continue;

      // The top-level playerPoolEntry.appliedStatTotal is NOT this week's
      // score (it's some other aggregate) — the real per-week actual score
      // lives in the stats array, keyed by scoringPeriodId + statSourceId
      // (0 = actual, 1 = projected).
      const weekStat = (player.stats ?? []).find(
        (s: any) => s.scoringPeriodId === week && s.statSourceId === 0 && s.seasonId === year
      );
      const points = weekStat?.appliedTotal;
      if (typeof points !== "number") continue;

      records.push({
        year,
        week,
        playerName: player.fullName ?? "Unknown Player",
        position,
        points,
        teamName,
        ownerName,
      });
    }
  }
  return records;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function computePlayerRecords(years: number[]): Promise<Record<string, PlayerWeekRecord[]>> {
  const seasonSettings = await Promise.all(years.map((y) => fetchSeason(y, ["mSettings"])));

  const weekJobs: { year: number; week: number }[] = [];
  years.forEach((year, i) => {
    const finalWeek = seasonSettings[i]?.status?.finalScoringPeriod ?? 0;
    for (let week = 1; week <= finalWeek; week++) weekJobs.push({ year, week });
  });

  const perWeekResults = await mapWithConcurrency(weekJobs, 12, (job) => fetchWeekPlayerScores(job.year, job.week));

  const byPosition: Record<string, PlayerWeekRecord[]> = {};
  for (const weekRecords of perWeekResults) {
    for (const rec of weekRecords) {
      if (!byPosition[rec.position]) byPosition[rec.position] = [];
      byPosition[rec.position].push(rec);
    }
  }
  for (const pos of Object.keys(byPosition)) {
    byPosition[pos] = byPosition[pos].sort((a, b) => b.points - a.points).slice(0, 5);
  }
  return byPosition;
}

// ─── Build + store ──────────────────────────────────────────────────────────

export async function buildAndStoreRecordBook(): Promise<{ ok: boolean; seasonsCovered: number[] }> {
  const redis = getRedis();
  if (!redis || !authCookie() || !LEAGUE_ID) return { ok: false, seasonsCovered: [] };

  const previousSeasons = await getPastSeasonYears();
  const currentYear = Number(process.env.ESPN_SEASON ?? "2025");
  const years = Array.from(new Set([...previousSeasons, currentYear])).sort((a, b) => a - b);
  if (years.length === 0) return { ok: false, seasonsCovered: [] };

  const [teamRecords, topPlayersByPosition] = await Promise.all([
    computeTeamRecords(years),
    computePlayerRecords(years),
  ]);

  const recordBook: RecordBook = {
    computedAt: Date.now(),
    seasonsCovered: years,
    ...teamRecords,
    topPlayersByPosition,
  };

  await redis.set(RECORD_BOOK_KEY, JSON.stringify(recordBook));

  return { ok: true, seasonsCovered: years };
}
