const CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";
const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const SEASON = 2025;
const SEASON_TYPE = 2;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TeamRecord {
  id: string;
  name: string;
  abbrev: string;
  wins: number;
  losses: number;
  ties: number;
  record: string;
  gamesPlayed: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
}

export interface TeamStats extends TeamRecord {
  // Offense per game
  netPassingYardsPerGame: number;
  rushingYardsPerGame: number;
  totalOffensiveYardsPerGame: number;
  passingTouchdowns: number;
  rushingTouchdowns: number;
  // Defense season totals
  sacks: number;
  defensiveInterceptions: number;
  fumblesRecovered: number;
  tacklesForLoss: number;
  passesDefended: number;
}

export interface PlayerLeader {
  id: string;
  name: string;
  shortName: string;
  position: string;
  teamName: string;
  teamAbbrev: string;
  headshotUrl: string;
  value: number;
  displayValue: string;
}

export interface LeaderCategory {
  name: string;
  displayName: string;
  leaders: PlayerLeader[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statMap(categories: any[]): Record<string, { value: number; perGame: number }> {
  const map: Record<string, { value: number; perGame: number }> = {};
  for (const cat of categories ?? []) {
    for (const stat of cat.stats ?? []) {
      map[stat.name] = {
        value: typeof stat.value === "number" ? stat.value : parseFloat(String(stat.displayValue ?? "0").replace(/,/g, "")),
        perGame: typeof stat.perGameValue === "number" ? stat.perGameValue : 0,
      };
    }
  }
  return map;
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function getStandings(): Promise<TeamRecord[]> {
  try {
    const res = await fetch(
      `https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings?season=${SEASON}&seasontype=${SEASON_TYPE}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const teams: TeamRecord[] = [];
    for (const conf of data.children ?? []) {
      for (const div of conf.children ?? []) {
        for (const entry of div.standings?.entries ?? []) {
          const sm: Record<string, number | string> = {};
          for (const s of entry.stats ?? []) {
            if (s.value !== undefined) sm[s.name] = s.value;
            if (s.summary !== undefined) sm[`${s.name}_summary`] = s.summary;
          }
          const wins = Number(sm.wins ?? 0);
          const losses = Number(sm.losses ?? 0);
          const ties = Number(sm.ties ?? 0);
          const gamesPlayed = wins + losses + ties || 17;
          const record = String(sm["overall_summary"] ?? `${wins}-${losses}`);
          const pointsFor = Number(sm.pointsFor ?? 0);
          const pointsAgainst = Number(sm.pointsAgainst ?? 0);
          teams.push({
            id: entry.team.id,
            name: entry.team.displayName,
            abbrev: entry.team.abbreviation,
            wins, losses, ties, record, gamesPlayed,
            avgPointsFor: gamesPlayed > 0 ? Math.round((pointsFor / gamesPlayed) * 10) / 10 : 0,
            avgPointsAgainst: gamesPlayed > 0 ? Math.round((pointsAgainst / gamesPlayed) * 10) / 10 : 0,
          });
        }
      }
    }
    return teams.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  } catch {
    return [];
  }
}

// ─── Team stats (uses /teams/{id}/statistics — perGameValue built in) ─────────

async function fetchTeamStats(espnTeamId: string): Promise<Record<string, { value: number; perGame: number }>> {
  try {
    // This endpoint returns data.results.stats.categories with perGameValue on each stat
    const res = await fetch(
      `${SITE}/teams/${espnTeamId}/statistics`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const categories = data.results?.stats?.categories ?? data.splits?.categories ?? [];
    return statMap(categories);
  } catch {
    return {};
  }
}

export async function getAllTeamStats(): Promise<TeamStats[]> {
  const standings = await getStandings();
  if (standings.length === 0) return [];

  const allStats = await Promise.all(standings.map((t) => fetchTeamStats(t.id)));

  return standings.map((team, i) => {
    const s = allStats[i];

    const get = (key: string) => s[key]?.value ?? 0;
    const pg = (key: string) => s[key]?.perGame ?? 0;

    const passYdsPG = get("netPassingYardsPerGame") || get("passingYardsPerGame") || pg("netPassingYards") || (get("netPassingYards") > 0 ? Math.round(get("netPassingYards") / team.gamesPlayed) : 0);
    const rushYdsPG = pg("rushingYards") || (get("rushingYards") > 0 ? Math.round(get("rushingYards") / team.gamesPlayed) : 0);

    return {
      ...team,
      netPassingYardsPerGame: Math.round(passYdsPG),
      rushingYardsPerGame: Math.round(rushYdsPG),
      totalOffensiveYardsPerGame: Math.round(passYdsPG + rushYdsPG),
      passingTouchdowns: Math.round(get("passingTouchdowns")),
      rushingTouchdowns: Math.round(get("rushingTouchdowns")),
      sacks: Math.round(get("sacks")),
      defensiveInterceptions: Math.round(get("interceptions") || get("defensiveInterceptions")),
      fumblesRecovered: Math.round(get("fumblesRecovered")),
      tacklesForLoss: Math.round(get("tacklesForLoss")),
      passesDefended: Math.round(get("passesDefended")),
    };
  });
}

// ─── Player leaders ───────────────────────────────────────────────────────────
// data.stats is an OBJECT (not array) with a .categories array inside

export async function getPlayerLeaders(): Promise<LeaderCategory[]> {
  try {
    const res = await fetch(
      `${SITE}/statistics?season=${SEASON}&seasontype=${SEASON_TYPE}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();

    // stats is a single object: { id, name, abbreviation, categories: [...] }
    const categories = data.stats?.categories ?? [];
    const result: LeaderCategory[] = [];

    for (const cat of categories) {
      const leaders: PlayerLeader[] = [];
      for (const leader of cat.leaders ?? []) {
        const a = leader.athlete;
        if (!a) continue;
        leaders.push({
          id: a.id ?? "",
          name: a.displayName ?? "",
          shortName: a.shortName ?? a.displayName ?? "",
          position: a.position?.abbreviation ?? "",
          teamName: (leader.team ?? a.team)?.displayName ?? "",
          teamAbbrev: (leader.team ?? a.team)?.abbreviation ?? "",
          headshotUrl: a.headshot?.href ?? "",
          value: leader.value ?? 0,
          displayValue: leader.displayValue ?? String(leader.value ?? 0),
        });
      }
      if (leaders.length > 0) {
        result.push({
          name: cat.name ?? "",
          displayName: cat.displayName ?? cat.shortDisplayName ?? cat.name ?? "",
          leaders,
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}
