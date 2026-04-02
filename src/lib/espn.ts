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
  conference: string;
  division: string;
  avgPointsFor: number;
  avgPointsAgainst: number;
  gamesPlayed: number;
}

export interface TeamStats extends TeamRecord {
  // Offense
  netPassingYards: number;
  rushingYards: number;
  totalOffensiveYards: number;
  passingTouchdowns: number;
  rushingTouchdowns: number;
  // Defense
  sacks: number;
  defensiveInterceptions: number;
  fumblesRecovered: number;
  yardsAllowed: number;
  // raw stat map for debugging
  _raw: Record<string, number>;
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

function pick(map: Record<string, number>, ...keys: string[]): number {
  for (const k of keys) {
    if (map[k] !== undefined && map[k] !== null) return map[k];
  }
  return 0;
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
          const statsMap: Record<string, number> = {};
          for (const s of entry.stats ?? []) {
            statsMap[s.name] = typeof s.value === "number" ? s.value : parseFloat(s.displayValue ?? "0");
          }
          const wins = statsMap.wins ?? 0;
          const losses = statsMap.losses ?? 0;
          const ties = statsMap.ties ?? 0;
          const gamesPlayed = wins + losses + ties || 17;
          teams.push({
            id: entry.team.id,
            name: entry.team.displayName,
            abbrev: entry.team.abbreviation,
            wins,
            losses,
            ties,
            record: ties > 0 ? `${wins}-${losses}-${ties}` : `${wins}-${losses}`,
            conference: conf.abbreviation ?? conf.name ?? "",
            division: div.name ?? "",
            avgPointsFor: statsMap.avgPointsFor ?? 0,
            avgPointsAgainst: statsMap.avgPointsAgainst ?? 0,
            gamesPlayed,
          });
        }
      }
    }
    return teams.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  } catch {
    return [];
  }
}

// ─── Core team stats ──────────────────────────────────────────────────────────

async function getCoreTeamStats(espnTeamId: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/teams/${espnTeamId}/statistics`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, number> = {};
    for (const cat of data.splits?.categories ?? []) {
      for (const stat of cat.stats ?? []) {
        const val = typeof stat.value === "number"
          ? stat.value
          : parseFloat(stat.displayValue?.replace(/,/g, "") ?? "0");
        if (!isNaN(val)) map[stat.name] = val;
      }
    }
    return map;
  } catch {
    return {};
  }
}

export async function getAllTeamStats(): Promise<TeamStats[]> {
  const standings = await getStandings();
  if (standings.length === 0) return [];

  const rawStats = await Promise.all(standings.map((t) => getCoreTeamStats(t.id)));

  return standings.map((team, i) => {
    const s = rawStats[i];
    const g = team.gamesPlayed;

    const netPassYds = pick(s, "netPassingYards", "passingYards", "passYards");
    const rushYds = pick(s, "rushingYards", "rushYards");
    const totalOff = pick(s, "totalOffensiveYards", "totalYards", "grossTotalYards");
    const yardsAllowed = pick(s, "totalYardsAllowed", "defensiveYardsAllowed", "yardsAllowed");

    return {
      ...team,
      netPassingYards: netPassYds > 0 ? Math.round(netPassYds / g) : 0,
      rushingYards: rushYds > 0 ? Math.round(rushYds / g) : 0,
      totalOffensiveYards: totalOff > 0 ? Math.round(totalOff / g) : 0,
      passingTouchdowns: Math.round(pick(s, "passingTouchdowns", "passTouchdowns")),
      rushingTouchdowns: Math.round(pick(s, "rushingTouchdowns", "rushTouchdowns")),
      sacks: Math.round(pick(s, "sacks", "defensiveSacks", "sacksYardsLost")),
      defensiveInterceptions: Math.round(pick(s, "defensiveInterceptions", "interceptions", "passInterceptions")),
      fumblesRecovered: Math.round(pick(s, "fumblesRecovered", "defensiveFumblesRecovered")),
      yardsAllowed: yardsAllowed > 0 ? Math.round(yardsAllowed / g) : 0,
      _raw: s,
    };
  });
}

// ─── Player leaders ───────────────────────────────────────────────────────────

export async function getPlayerLeaders(): Promise<LeaderCategory[]> {
  try {
    const res = await fetch(
      `${SITE}/statistics?season=${SEASON}&seasontype=${SEASON_TYPE}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const categories: LeaderCategory[] = [];
    for (const stat of data.stats ?? []) {
      const leaders: PlayerLeader[] = [];
      for (const leader of stat.leaders ?? []) {
        const a = leader.athlete;
        if (!a) continue;
        leaders.push({
          id: a.id ?? "",
          name: a.displayName ?? a.name ?? "",
          shortName: a.shortName ?? a.displayName ?? "",
          position: a.position?.abbreviation ?? a.position?.displayAbbreviation ?? "",
          teamName: a.team?.displayName ?? "",
          teamAbbrev: a.team?.abbreviation ?? "",
          headshotUrl: a.headshot?.href ?? "",
          value: leader.value ?? 0,
          displayValue: leader.displayValue ?? String(leader.value ?? 0),
        });
      }
      if (leaders.length > 0) {
        categories.push({
          name: stat.name ?? "",
          displayName: stat.displayName ?? stat.shortDisplayName ?? stat.name ?? "",
          leaders,
        });
      }
    }
    return categories;
  } catch {
    return [];
  }
}
