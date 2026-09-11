import { fetchAthleteDetails } from "@/lib/espn";

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
  const s2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;
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

export async function getDraftRecap(): Promise<{ picks: DraftPick[]; drafted: boolean; completeDate: number | null }> {
  const data = await fetchLeague(["mDraftDetail", "mTeam"], 3600);
  if (!data?.draftDetail?.picks) return { picks: [], drafted: false, completeDate: null };

  const teamNameById = new Map<number, string>();
  for (const t of data.teams ?? []) teamNameById.set(t.id, teamName(t));

  const rawPicks: any[] = data.draftDetail.picks;
  const athleteDetails = await Promise.all(
    rawPicks.map((p) =>
      fetchAthleteDetails(`https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/athletes/${p.playerId}`)
    )
  );

  const picks: DraftPick[] = rawPicks
    .map((p, i) => ({
      overallPickNumber: p.overallPickNumber,
      round: p.roundId,
      roundPick: p.roundPickNumber,
      teamId: p.teamId,
      teamName: teamNameById.get(p.teamId) ?? `Team ${p.teamId}`,
      playerName: athleteDetails[i].name || "Unknown Player",
      playerPosition: athleteDetails[i].position,
      playerProTeam: athleteDetails[i].teamAbbrev,
      headshotUrl: athleteDetails[i].headshotUrl,
      isKeeper: Boolean(p.keeper),
      isAutoDraft: p.autoDraftTypeId !== 0,
    }))
    .sort((a, b) => a.overallPickNumber - b.overallPickNumber);

  return {
    picks,
    drafted: Boolean(data.draftDetail.drafted),
    completeDate: data.draftDetail.completeDate ?? null,
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

export async function getPowerRankings(): Promise<{ rankings: PowerRanking[]; weeksConsidered: number[] }> {
  const { teams, matchups, currentMatchupPeriod } = await getLeagueMatchups();
  if (teams.length === 0) return { rankings: [], weeksConsidered: [] };

  const weekScores = new Map<number, Map<number, number>>();
  for (const m of matchups) {
    if (m.matchupPeriodId > currentMatchupPeriod) continue;
    if (!weekScores.has(m.matchupPeriodId)) weekScores.set(m.matchupPeriodId, new Map());
    const wm = weekScores.get(m.matchupPeriodId)!;
    if (m.homeTeamId !== null) wm.set(m.homeTeamId, m.homeScore);
    if (m.awayTeamId !== null && m.awayScore !== null) wm.set(m.awayTeamId, m.awayScore);
  }

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

  return { rankings, weeksConsidered: weeksPlayed };
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

export async function getLeagueHistory(): Promise<{ seasons: SeasonResult[]; owners: OwnerHistory[] }> {
  const current = await fetchLeague(["mSettings"], 3600);
  const years: number[] = current?.status?.previousSeasons ?? [];
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
