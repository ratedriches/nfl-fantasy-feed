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
  pointsFor: number;
  pointsAgainst: number;
  gamesPlayed: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
}

export interface TeamStats extends TeamRecord {
  // Offense (per game)
  netPassingYardsPerGame: number;
  rushingYardsPerGame: number;
  totalOffensiveYardsPerGame: number;
  passingTouchdowns: number;
  rushingTouchdowns: number;
  // Defense (season totals or per game)
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
          const statsMap: Record<string, number | string> = {};
          for (const s of entry.stats ?? []) {
            if (s.value !== undefined) statsMap[s.name] = s.value;
            if (s.displayValue !== undefined) statsMap[`${s.name}_display`] = s.displayValue;
            if (s.summary !== undefined) statsMap[`${s.name}_summary`] = s.summary;
          }

          const wins = Number(statsMap.wins ?? 0);
          const losses = Number(statsMap.losses ?? 0);
          const ties = Number(statsMap.ties ?? 0);
          const gamesPlayed = wins + losses + ties || 17;
          const record = String(statsMap["overall_summary"] ?? `${wins}-${losses}`);
          const pointsFor = Number(statsMap.pointsFor ?? 0);
          const pointsAgainst = Number(statsMap.pointsAgainst ?? 0);

          teams.push({
            id: entry.team.id,
            name: entry.team.displayName,
            abbrev: entry.team.abbreviation,
            wins,
            losses,
            ties,
            record,
            conference: conf.abbreviation ?? conf.name ?? "",
            division: div.name ?? "",
            pointsFor,
            pointsAgainst,
            gamesPlayed,
            avgPointsFor: gamesPlayed > 0 ? pointsFor / gamesPlayed : 0,
            avgPointsAgainst: gamesPlayed > 0 ? pointsAgainst / gamesPlayed : 0,
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
          : parseFloat(String(stat.displayValue ?? "0").replace(/,/g, ""));
        if (!isNaN(val)) map[`${cat.name}__${stat.name}`] = val;
        // also store by stat name alone (last writer wins, fine for unique names)
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

    const netPassYds = s["netPassingYards"] ?? s["passing__netPassingYards"] ?? 0;
    const rushYds = s["rushingYards"] ?? s["rushing__rushingYards"] ?? 0;
    const totalOff = (netPassYds > 0 && rushYds > 0) ? netPassYds + rushYds : 0;

    return {
      ...team,
      netPassingYardsPerGame: g > 0 && netPassYds > 0 ? Math.round(netPassYds / g) : 0,
      rushingYardsPerGame: g > 0 && rushYds > 0 ? Math.round(rushYds / g) : 0,
      totalOffensiveYardsPerGame: g > 0 && totalOff > 0 ? Math.round(totalOff / g) : 0,
      passingTouchdowns: Math.round(s["passingTouchdowns"] ?? s["passing__passingTouchdowns"] ?? 0),
      rushingTouchdowns: Math.round(s["rushingTouchdowns"] ?? s["rushing__rushingTouchdowns"] ?? 0),
      sacks: Math.round(s["sacks"] ?? s["defensive__sacks"] ?? 0),
      defensiveInterceptions: Math.round(s["interceptions"] ?? s["defensiveInterceptions__interceptions"] ?? 0),
      fumblesRecovered: Math.round(s["fumblesRecovered"] ?? s["general__fumblesRecovered"] ?? 0),
      tacklesForLoss: Math.round(s["tacklesForLoss"] ?? s["defensive__tacklesForLoss"] ?? 0),
      passesDefended: Math.round(s["passesDefended"] ?? s["defensive__passesDefended"] ?? 0),
    };
  });
}

// ─── Player leaders ───────────────────────────────────────────────────────────

export async function getPlayerLeaders(): Promise<LeaderCategory[]> {
  try {
    const res = await fetch(
      `${SITE}/statistics?season=${SEASON}&seasontype=${SEASON_TYPE}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();

    const categories: LeaderCategory[] = [];

    // Real structure: data.stats[].categories[].leaders[]
    for (const statGroup of data.stats ?? []) {
      for (const cat of statGroup.categories ?? []) {
        const leaders: PlayerLeader[] = [];
        for (const leader of cat.leaders ?? []) {
          const a = leader.athlete;
          if (!a) continue;
          leaders.push({
            id: a.id ?? "",
            name: a.displayName ?? a.name ?? "",
            shortName: a.shortName ?? a.displayName ?? "",
            position: a.position?.abbreviation ?? a.position?.displayAbbreviation ?? "",
            teamName: (leader.team ?? a.team)?.displayName ?? "",
            teamAbbrev: (leader.team ?? a.team)?.abbreviation ?? "",
            headshotUrl: a.headshot?.href ?? "",
            value: leader.value ?? 0,
            displayValue: leader.displayValue ?? String(leader.value ?? 0),
          });
        }
        if (leaders.length > 0) {
          categories.push({
            name: cat.name ?? "",
            displayName: cat.displayName ?? cat.shortDisplayName ?? cat.name ?? "",
            leaders,
          });
        }
      }
    }
    return categories;
  } catch {
    return [];
  }
}
