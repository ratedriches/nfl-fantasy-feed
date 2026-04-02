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

    const parseEntries = (entries: any[]) => {
      for (const entry of entries) {
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
    };

    for (const conf of data.children ?? []) {
      // Structure varies — sometimes conf > div > entries, sometimes conf > entries directly
      if (conf.children?.length > 0) {
        for (const div of conf.children) {
          parseEntries(div.standings?.entries ?? []);
        }
      } else {
        parseEntries(conf.standings?.entries ?? []);
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

// ─── Player leaders (core API — real full-season data) ────────────────────────

// ESPN team ID → abbreviation
const TEAM_ID_TO_ABBREV: Record<string, string> = {
  "1":"ATL","2":"BUF","3":"CHI","4":"CIN","5":"CLE","6":"DAL","7":"DEN",
  "8":"DET","9":"GB","10":"TEN","11":"IND","12":"KC","13":"LV","14":"LAR",
  "15":"MIA","16":"MIN","17":"NE","18":"NO","19":"NYG","20":"NYJ","21":"PHI",
  "22":"ARI","23":"PIT","24":"LAC","25":"SF","26":"SEA","27":"TB","28":"WAS",
  "29":"CAR","30":"JAX","33":"BAL","34":"HOU",
};

function teamIdFromRef(ref: string): string {
  const m = ref.match(/teams\/(\d+)/);
  return m ? m[1] : "";
}

async function fetchAthleteDetails(athleteRef: string): Promise<{
  id: string; name: string; shortName: string; position: string;
  teamAbbrev: string; headshotUrl: string;
}> {
  try {
    const res = await fetch(athleteRef, { next: { revalidate: 3600 } });
    if (!res.ok) return { id: "", name: "", shortName: "", position: "", teamAbbrev: "", headshotUrl: "" };
    const d = await res.json();
    const teamId = teamIdFromRef(d.team?.$ref ?? "");
    return {
      id: d.id ?? "",
      name: d.displayName ?? "",
      shortName: d.shortName ?? d.displayName ?? "",
      position: d.position?.abbreviation ?? "",
      teamAbbrev: TEAM_ID_TO_ABBREV[teamId] ?? "",
      headshotUrl: d.headshot?.href ?? "",
    };
  } catch {
    return { id: "", name: "", shortName: "", position: "", teamAbbrev: "", headshotUrl: "" };
  }
}

export async function getPlayerLeaders(): Promise<LeaderCategory[]> {
  try {
    const res = await fetch(
      `${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data = await res.json();

    // Collect all unique athlete $refs across all categories
    const categories = data.categories ?? [];
    const refToValue = new Map<string, { value: number; displayValue: string }[]>();
    const catData: { name: string; leaders: { ref: string; value: number; displayValue: string }[] }[] = [];

    for (const cat of categories) {
      const catLeaders: { ref: string; value: number; displayValue: string }[] = [];
      for (const leader of cat.leaders ?? []) {
        const ref = leader.athlete?.$ref;
        if (!ref) continue;
        catLeaders.push({ ref, value: leader.value ?? 0, displayValue: leader.displayValue ?? "" });
        if (!refToValue.has(ref)) refToValue.set(ref, []);
      }
      catData.push({ name: cat.name ?? "", leaders: catLeaders });
    }

    // Batch fetch all unique athletes in parallel
    const uniqueRefs = Array.from(refToValue.keys());
    const athleteDetails = await Promise.all(uniqueRefs.map(fetchAthleteDetails));
    const refToAthleteMap = new Map<string, typeof athleteDetails[0]>();
    uniqueRefs.forEach((ref, i) => refToAthleteMap.set(ref, athleteDetails[i]));

    // Category display names
    const CAT_NAMES: Record<string, string> = {
      passingYards: "Passing Yards", rushingYards: "Rushing Yards",
      receivingYards: "Receiving Yards", totalTackles: "Total Tackles",
      sacks: "Sacks", interceptions: "Interceptions",
      passingTouchdowns: "Passing TDs", rushingTouchdowns: "Rushing TDs",
      receivingTouchdowns: "Receiving TDs", receptions: "Receptions",
      quarterbackRating: "QB Rating", passesDefended: "Passes Defended",
      totalTouchdowns: "Total TDs", totalPoints: "Total Points",
    };

    const result: LeaderCategory[] = [];
    for (const cat of catData) {
      const leaders: PlayerLeader[] = [];
      for (const l of cat.leaders) {
        const athlete = refToAthleteMap.get(l.ref);
        if (!athlete?.id) continue;
        leaders.push({
          id: athlete.id,
          name: athlete.name,
          shortName: athlete.shortName,
          position: athlete.position,
          teamName: athlete.teamAbbrev,
          teamAbbrev: athlete.teamAbbrev,
          headshotUrl: athlete.headshotUrl,
          value: l.value,
          displayValue: l.displayValue,
        });
      }
      if (leaders.length > 0) {
        result.push({
          name: cat.name,
          displayName: CAT_NAMES[cat.name] ?? cat.name,
          leaders,
        });
      }
    }
    return result;
  } catch {
    return [];
  }
}
