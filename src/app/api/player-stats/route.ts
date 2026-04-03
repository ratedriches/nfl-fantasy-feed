const CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";
const SEASON = 2025;
const SEASON_TYPE = 2;

const TEAM_ID_TO_ABBREV: Record<string, string> = {
  "1":"ATL","2":"BUF","3":"CHI","4":"CIN","5":"CLE","6":"DAL","7":"DEN",
  "8":"DET","9":"GB","10":"TEN","11":"IND","12":"KC","13":"LV","14":"LAR",
  "15":"MIA","16":"MIN","17":"NE","18":"NO","19":"NYG","20":"NYJ","21":"PHI",
  "22":"ARI","23":"PIT","24":"LAC","25":"SF","26":"SEA","27":"TB","28":"WAS",
  "29":"CAR","30":"JAX","33":"BAL","34":"HOU",
};

function teamIdFromRef(ref: string) {
  const m = ref.match(/teams\/(\d+)/);
  return m ? m[1] : "";
}

function extractId(ref: string) {
  const m = ref.match(/athletes\/(\d+)/);
  return m ? m[1] : "";
}

// Fetch athlete profile (name, position, headshot, team)
async function fetchAthlete(ref: string) {
  try {
    const res = await fetch(ref, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const d = await res.json();
    const teamId = teamIdFromRef(d.team?.$ref ?? "");
    return {
      id: d.id ?? extractId(ref),
      name: d.displayName ?? "",
      shortName: d.shortName ?? d.displayName ?? "",
      position: d.position?.abbreviation ?? "",
      teamAbbrev: TEAM_ID_TO_ABBREV[teamId] ?? "",
      headshotUrl: d.headshot?.href ?? "",
    };
  } catch { return null; }
}

// Fetch full individual stats for a player, return flat stat map
async function fetchPlayerStats(statsRef: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(statsRef, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const d = await res.json();
    const map: Record<string, number> = {};
    for (const cat of d.splits?.categories ?? []) {
      for (const s of cat.stats ?? []) {
        if (typeof s.value === "number" && !map[s.name]) {
          map[s.name] = s.value;
        }
      }
      // scoring category has authoritative TDs — prefix to avoid collisions
      if (cat.name === "scoring") {
        for (const s of cat.stats ?? []) {
          if (typeof s.value === "number") map[`scoring_${s.name}`] = s.value;
        }
      }
    }
    return map;
  } catch { return {}; }
}

export interface EnrichedPlayer {
  id: string;
  name: string;
  shortName: string;
  position: string;
  teamAbbrev: string;
  headshotUrl: string;
  // passing
  passingYards: number;
  passingTouchdowns: number;
  interceptions: number;
  completionPct: number;
  QBRating: number;
  fumbles: number;
  // rushing
  rushingYards: number;
  rushingTouchdowns: number;
  rushingAttempts: number;
  // receiving
  receivingYards: number;
  receptions: number;
  receivingTouchdowns: number;
  receivingTargets: number;
  // defense
  totalTackles: number;
  sacks: number;
  defensiveInterceptions: number;
  passesDefended: number;
  tacklesForLoss: number;
}

function buildPlayer(
  athleteData: NonNullable<Awaited<ReturnType<typeof fetchAthlete>>>,
  stats: Record<string, number>
): EnrichedPlayer {
  return {
    ...athleteData,
    passingYards: stats.netPassingYards ?? stats.passingYards ?? 0,
    passingTouchdowns: stats.scoring_passingTouchdowns ?? stats.passingTouchdowns ?? 0,
    interceptions: stats.interceptions ?? 0,
    completionPct: parseFloat((stats.completionPct ?? 0).toFixed(1)),
    QBRating: parseFloat((stats.QBRating ?? stats.quarterbackRating ?? 0).toFixed(1)),
    fumbles: stats.fumbles ?? 0,
    rushingYards: stats.rushingYards ?? 0,
    rushingTouchdowns: stats.scoring_rushingTouchdowns ?? stats.rushingTouchdowns ?? 0,
    rushingAttempts: stats.rushingAttempts ?? 0,
    receivingYards: stats.receivingYards ?? 0,
    receptions: stats.receptions ?? 0,
    receivingTouchdowns: stats.scoring_receivingTouchdowns ?? stats.receivingTouchdowns ?? 0,
    receivingTargets: stats.receivingTargets ?? 0,
    totalTackles: stats.totalTackles ?? 0,
    sacks: stats.sacks ?? 0,
    defensiveInterceptions: stats.defensiveInterceptions ?? stats.interceptions ?? 0,
    passesDefended: stats.passesDefended ?? 0,
    tacklesForLoss: stats.tacklesForLoss ?? 0,
  };
}

export async function GET() {
  try {
    // pass=50, rush=100, rec=200 (to capture 50+ TEs)
    const [leadersRes, rushLeadersRes, recLeadersRes] = await Promise.all([
      fetch(`${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders?limit=50`, { next: { revalidate: 3600 } }),
      fetch(`${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders?limit=100`, { next: { revalidate: 3600 } }),
      fetch(`${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders?limit=200`, { next: { revalidate: 3600 } }),
    ]);

    if (!leadersRes.ok) return Response.json({ error: "Failed to fetch leaders" }, { status: 500 });

    const leadersData = await leadersRes.json();
    const rushData = rushLeadersRes.ok ? await rushLeadersRes.json() : leadersData;
    const recData  = recLeadersRes.ok  ? await recLeadersRes.json()  : leadersData;

    const getCategory = (data: any, name: string) =>
      data.categories?.find((c: any) => c.name === name)?.leaders ?? [];

    const passLeaders   = getCategory(leadersData, "passingYards");
    const rushLeaders   = getCategory(rushData,    "rushingYards");   // limit=50
    const recLeaders    = getCategory(recData,     "receivingYards"); // limit=200
    const tackleLeaders = getCategory(leadersData, "totalTackles");

    // Collect all unique athletes needed (by athlete ref)
    const allLeaders = [...passLeaders, ...rushLeaders, ...recLeaders, ...tackleLeaders];
    const uniqueRefs = new Map<string, { athleteRef: string; statsRef: string }>();
    for (const l of allLeaders) {
      const athleteRef = l.athlete?.$ref;
      const statsRef = l.statistics?.$ref;
      if (athleteRef && statsRef) {
        const id = extractId(athleteRef);
        if (!uniqueRefs.has(id)) uniqueRefs.set(id, { athleteRef, statsRef });
      }
    }

    // Batch fetch all athletes and their stats in parallel
    const ids = Array.from(uniqueRefs.keys());
    const [athletes, playerStats] = await Promise.all([
      Promise.all(ids.map((id) => fetchAthlete(uniqueRefs.get(id)!.athleteRef))),
      Promise.all(ids.map((id) => fetchPlayerStats(uniqueRefs.get(id)!.statsRef))),
    ]);

    const playerMap = new Map<string, EnrichedPlayer>();
    ids.forEach((id, i) => {
      const athlete = athletes[i];
      if (athlete) playerMap.set(id, buildPlayer(athlete, playerStats[i]));
    });

    // Build sorted tables
    const toPlayers = (leaders: any[]) =>
      leaders
        .map((l: any) => playerMap.get(extractId(l.athlete?.$ref ?? "")))
        .filter(Boolean) as EnrichedPlayer[];

    const passers   = toPlayers(passLeaders).sort((a, b) => b.passingYards - a.passingYards);
    const rushers   = toPlayers(rushLeaders).sort((a, b) => b.rushingYards - a.rushingYards);
    const allReceivers = toPlayers(recLeaders).sort((a, b) => b.receivingYards - a.receivingYards);
    const wideReceivers = allReceivers.filter((p) => p.position === "WR");
    const tightEnds     = allReceivers.filter((p) => p.position === "TE");
    const defenders  = toPlayers(tackleLeaders).sort((a, b) => b.totalTackles - a.totalTackles);

    return Response.json({ passers, rushers, wideReceivers, tightEnds, defenders });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
