import { fetchAthleteDetails, TEAM_ID_TO_ABBREV } from "@/lib/espn";

const SEASON = Number(process.env.ESPN_SEASON ?? "2025");
const LEAGUE_ID = process.env.ESPN_LEAGUE_ID ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeagueTeam {
  id: number;
  name: string;
  abbrev: string;
  logo: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  playoffSeed: number;
  divisionId: number;
}

export interface Division {
  id: number;
  name: string;
}

export interface Matchup {
  matchupPeriodId: number;
  homeTeamId: number | null;
  homeScore: number;
  awayTeamId: number | null;
  awayScore: number | null;
  winner: string;
  isLive: boolean;
}

// ─── Auth / config ──────────────────────────────────────────────────────────

export function isLeagueConfigured(): boolean {
  return Boolean(process.env.ESPN_S2 && process.env.ESPN_SWID && LEAGUE_ID);
}

function authCookie(): string | null {
  // Trim defensively — env vars pasted via a dashboard UI can pick up a
  // trailing newline, which makes fetch() reject the Cookie header outright.
  const s2 = process.env.ESPN_S2?.trim();
  const swid = process.env.ESPN_SWID?.trim();
  if (!s2 || !swid) return null;
  return `espn_s2=${s2}; SWID=${swid}`;
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function fetchLeague(views: string[], revalidateSeconds = 300): Promise<any | null> {
  const cookie = authCookie();
  if (!cookie || !LEAGUE_ID) return null;

  const qs = views.map((v) => `view=${v}`).join("&");
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${SEASON}/segments/0/leagues/${LEAGUE_ID}?${qs}`;

  try {
    // Matchup responses (mMatchup/mScoreboard with full roster data) can exceed
    // Next.js's 2MB data-cache limit, which just logs a noisy warning and skips
    // caching anyway — so for short-lived (live-polling) requests, skip the
    // cache entirely rather than let Next.js attempt and fail to store it.
    const res = await fetch(url, {
      headers: { Cookie: cookie },
      ...(revalidateSeconds <= 20 ? { cache: "no-store" as const } : { next: { revalidate: revalidateSeconds } }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function teamName(t: any): string {
  if (t.name) return t.name;
  const loc = t.location ?? "";
  const nick = t.nickname ?? "";
  return `${loc} ${nick}`.trim() || `Team ${t.id}`;
}

function mapTeam(t: any): LeagueTeam {
  const overall = t.record?.overall ?? {};
  return {
    id: t.id,
    name: teamName(t),
    abbrev: t.abbrev ?? "",
    logo: t.logo ?? "",
    wins: overall.wins ?? 0,
    losses: overall.losses ?? 0,
    ties: overall.ties ?? 0,
    pointsFor: overall.pointsFor ?? 0,
    pointsAgainst: overall.pointsAgainst ?? 0,
    playoffSeed: t.playoffSeed ?? 0,
    divisionId: t.divisionId ?? 0,
  };
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function getLeagueStandings(): Promise<{ teams: LeagueTeam[]; divisions: Division[] }> {
  const data = await fetchLeague(["mTeam", "mStandings", "mSettings"]);
  if (!data?.teams) return { teams: [], divisions: [] };

  const teams = data.teams
    .map(mapTeam)
    .sort((a: LeagueTeam, b: LeagueTeam) => b.wins - a.wins || b.pointsFor - a.pointsFor);

  const divisions: Division[] = (data.settings?.scheduleSettings?.divisions ?? []).map((d: any) => ({
    id: d.id,
    name: d.name,
  }));

  return { teams, divisions };
}

// ─── Matchups / scores ────────────────────────────────────────────────────────

export async function getLeagueMatchups(): Promise<{
  teams: LeagueTeam[];
  matchups: Matchup[];
  currentMatchupPeriod: number;
}> {
  const data = await fetchLeague(["mTeam", "mMatchup", "mMatchupScore", "mScoreboard"], 15);
  if (!data?.teams) return { teams: [], matchups: [], currentMatchupPeriod: 1 };

  const teams: LeagueTeam[] = data.teams.map(mapTeam);

  // ESPN reports the *final* score in totalPoints only once a matchup is
  // decided — while UNDECIDED, the real (in-progress) number lives in
  // totalPointsLive instead, and totalPoints just sits at a 0/1 placeholder.
  function scoreFor(side: any, winner: string): number {
    if (!side) return 0;
    return winner === "UNDECIDED" ? side.totalPointsLive ?? side.totalPoints ?? 0 : side.totalPoints ?? 0;
  }

  const matchups: Matchup[] = (data.schedule ?? [])
    .filter((m: any) => m.home || m.away)
    .map((m: any) => {
      const winner = m.winner ?? "UNDECIDED";
      return {
        matchupPeriodId: m.matchupPeriodId,
        homeTeamId: m.home?.teamId ?? null,
        homeScore: scoreFor(m.home, winner),
        awayTeamId: m.away?.teamId ?? null,
        awayScore: m.away ? scoreFor(m.away, winner) : null,
        winner,
        isLive: winner === "UNDECIDED",
      };
    });

  return { teams, matchups, currentMatchupPeriod: data.status?.currentMatchupPeriod ?? 1 };
}

// ─── Draft recap ────────────────────────────────────────────────────────────────

export interface DraftPick {
  overallPickNumber: number;
  round: number;
  roundPick: number;
  teamId: number;
  teamName: string;
  playerName: string;
  playerPosition: string;
  playerProTeam: string;
  headshotUrl: string;
  isKeeper: boolean;
  isAutoDraft: boolean;
}

// ESPN's roster-SLOT id table (distinct from a player's own defaultPositionId
// table used elsewhere) — the standard mapping used across the community
// (e.g. the espn_api library), for turning lineupSlotCounts into a readable
// starting lineup.
const LINEUP_SLOT_MAP: Record<number, string> = {
  0: "QB",
  1: "TQB",
  2: "RB",
  3: "RB/WR",
  4: "WR",
  5: "WR/TE",
  6: "TE",
  7: "Superflex",
  8: "DT",
  9: "DE",
  10: "LB",
  11: "DL",
  12: "CB",
  13: "S",
  14: "DB",
  15: "DP",
  16: "D/ST",
  17: "K",
  18: "P",
  19: "HC",
  23: "FLEX",
  24: "EDR",
};
const BENCH_IR_SLOTS = new Set([20, 21]);

export interface DraftSummary {
  leagueName: string;
  year: number;
  numTeams: number;
  numRounds: number;
  numPicks: number;
  numKeepers: number;
  startingLineup: string[];
  waiverType: string;
  highlights: string[];
}

export async function getDraftRecap(): Promise<{
  picks: DraftPick[];
  drafted: boolean;
  completeDate: number | null;
  summary: DraftSummary | null;
}> {
  const data = await fetchLeague(["mDraftDetail", "mTeam", "mSettings", "mRoster"], 3600);
  if (!data?.draftDetail?.picks) return { picks: [], drafted: false, completeDate: null, summary: null };

  const teamNameById = new Map<number, string>();
  for (const t of data.teams ?? []) teamNameById.set(t.id, teamName(t));

  // Draft picks only carry a playerId, no name — resolving it requires a
  // second lookup. Team defenses use special negative IDs that the generic
  // CORE athletes API 404s on, but current team rosters embed every
  // player's full details directly (including defenses), so check there
  // first and only fall back to the CORE API for players since dropped.
  const PLAYER_POSITION_MAP: Record<number, string> = {
    1: "QB", 2: "RB", 3: "WR", 4: "TE", 5: "K", 7: "P",
    9: "DT", 10: "DE", 11: "LB", 12: "CB", 13: "S", 14: "DB", 16: "D/ST",
  };
  const rosterPlayerById = new Map<number, { name: string; position: string; teamAbbrev: string }>();
  for (const t of data.teams ?? []) {
    for (const entry of t.roster?.entries ?? []) {
      const player = entry.playerPoolEntry?.player;
      if (!player) continue;
      rosterPlayerById.set(entry.playerId, {
        name: player.fullName ?? "",
        position: PLAYER_POSITION_MAP[player.defaultPositionId] ?? "",
        teamAbbrev: TEAM_ID_TO_ABBREV[String(player.proTeamId)] ?? "",
      });
    }
  }

  const rawPicks: any[] = data.draftDetail.picks;
  const athleteDetails = await Promise.all(
    rawPicks.map((p) =>
      rosterPlayerById.has(p.playerId)
        ? Promise.resolve(null)
        : fetchAthleteDetails(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${p.playerId}`)
    )
  );

  const picks: DraftPick[] = rawPicks
    .map((p, i) => {
      const fromRoster = rosterPlayerById.get(p.playerId);
      const fallback = athleteDetails[i];
      return {
        overallPickNumber: p.overallPickNumber,
        round: p.roundId,
        roundPick: p.roundPickNumber,
        teamId: p.teamId,
        teamName: teamNameById.get(p.teamId) ?? `Team ${p.teamId}`,
        playerName: fromRoster?.name || fallback?.name || "Unknown Player",
        playerPosition: fromRoster?.position || fallback?.position || "",
        playerProTeam: fromRoster?.teamAbbrev || fallback?.teamAbbrev || "",
        headshotUrl:
          fallback?.headshotUrl || (p.playerId > 0 ? `https://a.espncdn.com/i/headshots/nfl/players/full/${p.playerId}.png` : ""),
        isKeeper: Boolean(p.keeper),
        isAutoDraft: p.autoDraftTypeId !== 0,
      };
    })
    .sort((a, b) => a.overallPickNumber - b.overallPickNumber);

  // ─── Header summary ───────────────────────────────────────────────────────

  const numRounds = picks.length > 0 ? Math.max(...picks.map((p) => p.round)) : 0;
  const numKeepers = picks.filter((p) => p.isKeeper).length;

  const slotCounts: Record<string, number> = data.settings?.rosterSettings?.lineupSlotCounts ?? {};
  const startingLineup: string[] = [];
  for (const [slotId, count] of Object.entries(slotCounts)) {
    const id = Number(slotId);
    if (BENCH_IR_SLOTS.has(id) || count <= 0) continue;
    const label = LINEUP_SLOT_MAP[id];
    if (!label) continue;
    for (let i = 0; i < count; i++) startingLineup.push(label);
  }

  const waiverType = data.settings?.acquisitionSettings?.isUsingAcquisitionBudget
    ? `$${data.settings.acquisitionSettings.acquisitionBudget} FAAB`
    : "Traditional waivers";

  // ─── Auto-generated highlights ────────────────────────────────────────────

  const highlights: string[] = [];

  if (picks.length > 0) {
    const first = picks[0];
    highlights.push(`${first.playerName} (${first.playerPosition}) went #1 overall to ${first.teamName}.`);

    const last = picks[picks.length - 1];
    highlights.push(`Mr. Irrelevant: ${last.playerName} (${last.playerPosition}), the last pick of the draft, to ${last.teamName}.`);
  }

  // Longest run of the same position taken back-to-back.
  let longestRun = { position: "", length: 0, startPick: 0 };
  let currentRun = { position: "", length: 0, startPick: 0 };
  for (const p of picks) {
    if (p.playerPosition === currentRun.position) {
      currentRun.length++;
    } else {
      currentRun = { position: p.playerPosition, length: 1, startPick: p.overallPickNumber };
    }
    if (currentRun.length > longestRun.length) longestRun = { ...currentRun };
  }
  if (longestRun.length >= 3) {
    highlights.push(
      `${longestRun.length} ${longestRun.position}s were taken in a row starting at pick ${longestRun.startPick}.`
    );
  }

  // Most popular position in round 1.
  const round1 = picks.filter((p) => p.round === 1);
  if (round1.length > 0) {
    const counts = new Map<string, number>();
    for (const p of round1) counts.set(p.playerPosition, (counts.get(p.playerPosition) ?? 0) + 1);
    const [topPos, topCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (topCount >= 3) {
      highlights.push(`${topPos} was the most popular position in round 1, with ${topCount} taken.`);
    }
  }

  if (numKeepers > 0) {
    const byTeam = new Map<string, number>();
    for (const p of picks.filter((p) => p.isKeeper)) byTeam.set(p.teamName, (byTeam.get(p.teamName) ?? 0) + 1);
    const [topTeam, topKeeperCount] = [...byTeam.entries()].sort((a, b) => b[1] - a[1])[0];
    highlights.push(`${topTeam} kept the most players, with ${topKeeperCount} keeper${topKeeperCount === 1 ? "" : "s"}.`);
  }

  const summary: DraftSummary = {
    leagueName: "Rated R League",
    year: Number(process.env.ESPN_SEASON ?? new Date().getFullYear()),
    numTeams: data.teams?.length ?? 0,
    numRounds,
    numPicks: picks.length,
    numKeepers,
    startingLineup,
    waiverType,
    highlights,
  };

  return {
    picks,
    drafted: Boolean(data.draftDetail.drafted),
    completeDate: data.draftDetail.completeDate ?? null,
    summary,
  };
}

// ─── Power rankings ───────────────────────────────────────────────────────────
//
// ESPN doesn't expose an official "power ranking" — it's a derived stat.
// We use a standard, transparent formula: 60% season-long all-play win rate
// (how a team would do against every other team each week, not just their
// actual opponent — rewards consistent scoring over a lucky schedule) + 40%
// recent scoring form (average points over the last 3 played weeks, ranked
// against the league).

export interface PowerRanking {
  teamId: number;
  teamName: string;
  logo: string;
  rank: number;
  powerScore: number;
  actualWins: number;
  actualLosses: number;
  allPlayWins: number;
  allPlayLosses: number;
  avgPointsRecent: number;
}

function buildWeekScores(matchups: Matchup[], throughWeek: number): Map<number, Map<number, number>> {
  const weekScores = new Map<number, Map<number, number>>();
  for (const m of matchups) {
    if (m.matchupPeriodId > throughWeek) continue;
    if (!weekScores.has(m.matchupPeriodId)) weekScores.set(m.matchupPeriodId, new Map());
    const wm = weekScores.get(m.matchupPeriodId)!;
    if (m.homeTeamId !== null) wm.set(m.homeTeamId, m.homeScore);
    if (m.awayTeamId !== null && m.awayScore !== null) wm.set(m.awayTeamId, m.awayScore);
  }
  return weekScores;
}

// Computes power rankings as they would have stood after `throughWeek` —
// i.e. using only weeks up to and including it. Reused both for the live
// "current" ranking and for reconstructing each team's week-by-week history.
function computePowerRankingsThroughWeek(teams: LeagueTeam[], matchups: Matchup[], throughWeek: number): PowerRanking[] {
  const weekScores = buildWeekScores(matchups, throughWeek);

  const weeksPlayed = Array.from(weekScores.keys())
    .filter((w) => Array.from(weekScores.get(w)!.values()).some((v) => v > 0))
    .sort((a, b) => a - b);

  const allPlay = new Map<number, { wins: number; losses: number }>();
  teams.forEach((t) => allPlay.set(t.id, { wins: 0, losses: 0 }));

  for (const w of weeksPlayed) {
    const entries = Array.from(weekScores.get(w)!.entries());
    for (let i = 0; i < entries.length; i++) {
      const [teamId, score] = entries[i];
      const rec = allPlay.get(teamId);
      if (!rec) continue;
      for (let j = 0; j < entries.length; j++) {
        if (i === j) continue;
        const otherScore = entries[j][1];
        if (score > otherScore) rec.wins++;
        else if (score < otherScore) rec.losses++;
      }
    }
  }

  const recentWeeks = weeksPlayed.slice(-3);
  const recentAvg = new Map<number, number>();
  teams.forEach((t) => {
    const vals = recentWeeks.map((w) => weekScores.get(w)?.get(t.id) ?? 0);
    recentAvg.set(t.id, vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0);
  });

  const byRecent = [...teams].sort((a, b) => (recentAvg.get(b.id) ?? 0) - (recentAvg.get(a.id) ?? 0));
  const recentRank = new Map<number, number>();
  byRecent.forEach((t, idx) => recentRank.set(t.id, idx + 1));

  const n = teams.length;

  const rankings: PowerRanking[] = teams.map((t) => {
    const ap = allPlay.get(t.id) ?? { wins: 0, losses: 0 };
    const apTotal = ap.wins + ap.losses;
    const apWinPct = apTotal > 0 ? ap.wins / apTotal : 0;
    const rRank = recentRank.get(t.id) ?? n;
    const formScore = n > 1 ? 1 - (rRank - 1) / (n - 1) : 1;
    const powerScore = apWinPct * 0.6 + formScore * 0.4;
    return {
      teamId: t.id,
      teamName: t.name,
      logo: t.logo,
      rank: 0,
      powerScore: Math.round(powerScore * 1000) / 10,
      actualWins: t.wins,
      actualLosses: t.losses,
      allPlayWins: ap.wins,
      allPlayLosses: ap.losses,
      avgPointsRecent: Math.round((recentAvg.get(t.id) ?? 0) * 10) / 10,
    };
  });

  rankings.sort((a, b) => b.powerScore - a.powerScore);
  rankings.forEach((r, i) => (r.rank = i + 1));

  return rankings;
}

export async function getPowerRankings(): Promise<{ rankings: PowerRanking[]; weeksConsidered: number[] }> {
  const { teams, matchups, currentMatchupPeriod } = await getLeagueMatchups();
  if (teams.length === 0) return { rankings: [], weeksConsidered: [] };

  const weekScores = buildWeekScores(matchups, currentMatchupPeriod);
  const weeksPlayed = Array.from(weekScores.keys())
    .filter((w) => Array.from(weekScores.get(w)!.values()).some((v) => v > 0))
    .sort((a, b) => a - b);

  const rankings = computePowerRankingsThroughWeek(teams, matchups, currentMatchupPeriod);
  return { rankings, weeksConsidered: weeksPlayed };
}

export interface PowerRankingWeekEntry {
  week: number;
  rank: number;
  powerScore: number;
}

export interface TeamPowerRankingHistory {
  current: PowerRankingWeekEntry | null;
  highest: PowerRankingWeekEntry | null; // best (lowest rank number)
  lowest: PowerRankingWeekEntry | null; // worst (highest rank number)
  totalTeams: number;
  weekly: PowerRankingWeekEntry[];
}

export async function getTeamPowerRankingHistory(teamId: number): Promise<TeamPowerRankingHistory> {
  const { teams, matchups, currentMatchupPeriod } = await getLeagueMatchups();
  if (teams.length === 0) return { current: null, highest: null, lowest: null, totalTeams: 0, weekly: [] };

  const weekScores = buildWeekScores(matchups, currentMatchupPeriod);
  const weeksPlayed = Array.from(weekScores.keys())
    .filter((w) => Array.from(weekScores.get(w)!.values()).some((v) => v > 0))
    .sort((a, b) => a - b);

  const weekly: PowerRankingWeekEntry[] = weeksPlayed.map((week) => {
    const rankings = computePowerRankingsThroughWeek(teams, matchups, week);
    const entry = rankings.find((r) => r.teamId === teamId);
    return { week, rank: entry?.rank ?? teams.length, powerScore: entry?.powerScore ?? 0 };
  });

  if (weekly.length === 0) return { current: null, highest: null, lowest: null, totalTeams: teams.length, weekly: [] };

  const current = weekly[weekly.length - 1];
  const highest = [...weekly].sort((a, b) => a.rank - b.rank || a.week - b.week)[0];
  const lowest = [...weekly].sort((a, b) => b.rank - a.rank || a.week - b.week)[0];

  return { current, highest, lowest, totalTeams: teams.length, weekly };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface TransactionItem {
  type: string; // ADD | DROP | TRADED
  playerName: string;
  playerPosition: string;
  fromTeamName: string | null;
  toTeamName: string | null;
}

export interface Transaction {
  id: string;
  type: string; // WAIVER | FREEAGENT | TRADE
  status: string;
  date: number;
  teamName: string;
  bidAmount: number;
  items: TransactionItem[];
}

const RELEVANT_TRANSACTION_TYPES = new Set(["WAIVER", "FREEAGENT", "TRADE"]);

export async function getTransactions(): Promise<Transaction[]> {
  const data = await fetchLeague(["mTransactions2", "mTeam"], 60);
  if (!data?.transactions) return [];

  const teamNameById = new Map<number, string>();
  for (const t of data.teams ?? []) teamNameById.set(t.id, teamName(t));

  const rawTx: any[] = data.transactions.filter((t: any) => RELEVANT_TRANSACTION_TYPES.has(t.type));

  const playerIds = new Set<number>();
  for (const tx of rawTx) {
    for (const item of tx.items ?? []) {
      if (typeof item.playerId === "number" && item.playerId > 0) playerIds.add(item.playerId);
    }
  }
  const uniqueIds = Array.from(playerIds);
  const athleteDetails = await Promise.all(
    uniqueIds.map((id) =>
      fetchAthleteDetails(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${id}`)
    )
  );
  const athleteById = new Map<number, (typeof athleteDetails)[number]>();
  uniqueIds.forEach((id, i) => athleteById.set(id, athleteDetails[i]));

  const teamName_ = (id: number) => (id > 0 ? teamNameById.get(id) ?? `Team ${id}` : null);

  const transactions: Transaction[] = rawTx
    .map((tx: any) => ({
      id: tx.id,
      type: tx.type,
      status: tx.status,
      date: tx.processDate ?? tx.proposedDate ?? 0,
      teamName: teamNameById.get(tx.teamId) ?? `Team ${tx.teamId}`,
      bidAmount: tx.bidAmount ?? 0,
      items: (tx.items ?? []).map((item: any) => {
        const athlete = athleteById.get(item.playerId);
        return {
          type: item.type,
          playerName: athlete?.name || "Unknown Player",
          playerPosition: athlete?.position ?? "",
          fromTeamName: teamName_(item.fromTeamId),
          toTeamName: teamName_(item.toTeamId),
        };
      }),
    }))
    .sort((a, b) => b.date - a.date);

  return transactions;
}

// ─── League history (championships + owner records across seasons) ────────────

async function fetchSeasonHistory(year: number): Promise<any | null> {
  const cookie = authCookie();
  if (!cookie || !LEAGUE_ID) return null;

  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/leagueHistory/${LEAGUE_ID}?seasonId=${year}&view=mTeam&view=mStandings`;

  try {
    const res = await fetch(url, { headers: { Cookie: cookie }, next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json) ? json[0] : json;
  } catch {
    return null;
  }
}

export interface SeasonFinish {
  teamName: string;
  ownerName: string;
}

export interface SeasonResult {
  year: number;
  numTeams: number;
  champion: SeasonFinish | null;
  runnerUp: SeasonFinish | null;
  thirdPlace: SeasonFinish | null;
}

export interface OwnerHistory {
  ownerId: string;
  ownerName: string;
  seasons: number;
  wins: number;
  losses: number;
  ties: number;
  winPct: number;
  avgPointsPerWeek: number;
  firstPlaceFinishes: number;
  secondPlaceFinishes: number;
  thirdPlaceFinishes: number;
  divisionTitles: number;
}

// previousSeasons only lives on the *live* current-season endpoint response,
// not the leagueHistory endpoint — so this is the one correct place to get it.
export async function getPastSeasonYears(): Promise<number[]> {
  const current = await fetchLeague(["mSettings"], 3600);
  return current?.status?.previousSeasons ?? [];
}

export async function getLeagueHistory(): Promise<{ seasons: SeasonResult[]; owners: OwnerHistory[] }> {
  const years = await getPastSeasonYears();
  if (years.length === 0) return { seasons: [], owners: [] };

  const seasonDataList = await Promise.all(years.map(fetchSeasonHistory));

  const seasonResults: SeasonResult[] = [];
  type OwnerAgg = {
    name: string;
    seasons: Set<number>;
    wins: number;
    losses: number;
    ties: number;
    pointsFor: number;
    games: number;
    firsts: number;
    seconds: number;
    thirds: number;
    divisionTitles: number;
  };
  const ownerAgg = new Map<string, OwnerAgg>();

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const data = seasonDataList[i];
    if (!data?.teams) continue;

    const memberName = new Map<string, string>();
    for (const m of data.members ?? []) {
      const full = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
      memberName.set(m.id, full || m.displayName || "Unknown Owner");
    }

    interface HistoryTeam {
      id: number;
      name: string;
      ownerId: string;
      rank: number;
      divisionId: number;
      wins: number;
      losses: number;
      ties: number;
      pointsFor: number;
    }

    const teams: HistoryTeam[] = data.teams.map((t: any) => ({
      id: t.id,
      name: teamName(t),
      ownerId: t.primaryOwner ?? t.owners?.[0] ?? "",
      rank: t.rankCalculatedFinal ?? 0,
      divisionId: t.divisionId ?? 0,
      wins: t.record?.overall?.wins ?? 0,
      losses: t.record?.overall?.losses ?? 0,
      ties: t.record?.overall?.ties ?? 0,
      pointsFor: t.record?.overall?.pointsFor ?? 0,
    }));

    // A "division title" = best final rank within that season's division —
    // ESPN doesn't expose this as a flag directly, so we derive it.
    const byDivision = new Map<number, HistoryTeam[]>();
    for (const t of teams) {
      if (!byDivision.has(t.divisionId)) byDivision.set(t.divisionId, []);
      byDivision.get(t.divisionId)!.push(t);
    }
    const divisionChampIds = new Set<number>();
    if (byDivision.size > 1) {
      for (const group of byDivision.values()) {
        const champ = group.reduce((best, t) => (t.rank < best.rank ? t : best));
        divisionChampIds.add(champ.id);
      }
    }

    const sorted = [...teams].sort((a, b) => a.rank - b.rank);
    const finishFor = (t: (typeof teams)[number] | undefined): SeasonFinish | null =>
      t ? { teamName: t.name, ownerName: memberName.get(t.ownerId) ?? "Unknown Owner" } : null;

    seasonResults.push({
      year,
      numTeams: teams.length,
      champion: finishFor(sorted[0]),
      runnerUp: finishFor(sorted[1]),
      thirdPlace: finishFor(sorted[2]),
    });

    for (const t of teams) {
      if (!t.ownerId) continue;
      if (!ownerAgg.has(t.ownerId)) {
        ownerAgg.set(t.ownerId, {
          name: memberName.get(t.ownerId) ?? "Unknown Owner",
          seasons: new Set(),
          wins: 0,
          losses: 0,
          ties: 0,
          pointsFor: 0,
          games: 0,
          firsts: 0,
          seconds: 0,
          thirds: 0,
          divisionTitles: 0,
        });
      }
      const agg = ownerAgg.get(t.ownerId)!;
      agg.seasons.add(year);
      agg.wins += t.wins;
      agg.losses += t.losses;
      agg.ties += t.ties;
      agg.pointsFor += t.pointsFor;
      agg.games += t.wins + t.losses + t.ties;
      if (t.rank === 1) agg.firsts++;
      if (t.rank === 2) agg.seconds++;
      if (t.rank === 3) agg.thirds++;
      if (divisionChampIds.has(t.id)) agg.divisionTitles++;
    }
  }

  const owners: OwnerHistory[] = Array.from(ownerAgg.entries())
    .map(([ownerId, agg]) => {
      const totalGames = agg.wins + agg.losses + agg.ties;
      return {
        ownerId,
        ownerName: agg.name,
        seasons: agg.seasons.size,
        wins: agg.wins,
        losses: agg.losses,
        ties: agg.ties,
        winPct: totalGames > 0 ? Math.round(((agg.wins + agg.ties * 0.5) / totalGames) * 1000) / 10 : 0,
        avgPointsPerWeek: agg.games > 0 ? Math.round((agg.pointsFor / agg.games) * 10) / 10 : 0,
        firstPlaceFinishes: agg.firsts,
        secondPlaceFinishes: agg.seconds,
        thirdPlaceFinishes: agg.thirds,
        divisionTitles: agg.divisionTitles,
      };
    })
    .sort((a, b) => b.winPct - a.winPct);

  seasonResults.sort((a, b) => b.year - a.year);

  return { seasons: seasonResults, owners };
}
