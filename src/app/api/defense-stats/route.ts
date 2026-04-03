// Defensive player stats via ESPN — separate route from /api/player-stats
// Uses defensive leader categories (tackles, sacks, INTs) instead of offensive ones
// Completely isolated: no shared state, no shared fetch calls with the offensive route

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

export interface DefPlayer {
  id: string;
  name: string;
  team: string;
  position: string;
  tackles: number;
  tacklesForLoss: number;
  interceptions: number;
  fumblesForced: number;
  fumblesRecovered: number;
  passBreakups: number;
  sacks: number;
}

function extractId(ref: string) {
  const m = ref.match(/athletes\/(\d+)/);
  return m ? m[1] : "";
}

function teamIdFromRef(ref: string) {
  const m = ref.match(/teams\/(\d+)/);
  return m ? m[1] : "";
}

async function fetchAthlete(ref: string) {
  try {
    const res = await fetch(ref, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const d = await res.json();
    const teamId = teamIdFromRef(d.team?.$ref ?? "");
    return {
      id: String(d.id ?? extractId(ref)),
      name: d.displayName ?? "",
      team: TEAM_ID_TO_ABBREV[teamId] ?? "",
      position: d.position?.abbreviation ?? "",
    };
  } catch { return null; }
}

async function fetchStats(statsRef: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(statsRef, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const d = await res.json();
    const categories: any[] =
      d.splits?.categories ??
      d.results?.stats?.categories ??
      d.categories ??
      [];
    const map: Record<string, number> = {};
    for (const cat of categories) {
      for (const s of cat.stats ?? []) {
        if (typeof s.value === "number" && !map[s.name]) {
          map[s.name] = s.value;
        }
      }
    }
    return map;
  } catch { return {}; }
}

const DEF_POSITIONS = new Set(["DT", "DE", "LB", "OLB", "MLB", "ILB", "CB", "FS", "SS", "S", "DB"]);
const LB_GROUP      = new Set(["LB", "OLB", "MLB", "ILB"]);
const S_GROUP       = new Set(["S", "FS", "SS", "DB"]);

export async function GET() {
  try {
    const BASE = `${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders`;
    const OPT  = { next: { revalidate: 3600 } } as const;

    // Fetch 6 pages of leaders — each page contains ALL categories including
    // totalTackles, sacks, and defensiveInterceptions.
    // This pools enough players across all defensive positions.
    const pageResponses = await Promise.all([
      fetch(`${BASE}?limit=100`, OPT),
      fetch(`${BASE}?limit=100&page=2`, OPT),
      fetch(`${BASE}?limit=100&page=3`, OPT),
      fetch(`${BASE}?limit=100&page=4`, OPT),
      fetch(`${BASE}?limit=100&page=5`, OPT),
      fetch(`${BASE}?limit=100&page=6`, OPT),
    ]);

    const pages = await Promise.all(
      pageResponses.map((r) => r.ok ? r.json() : Promise.resolve({ categories: [] }))
    );

    const getCategory = (data: any, name: string) =>
      data.categories?.find((c: any) => c.name === name)?.leaders ?? [];

    // Pull defensive leader categories from every page and deduplicate
    const DEF_CATS = ["totalTackles", "sacks", "defensiveInterceptions"];
    const seen = new Set<string>();
    const uniqueRefs = new Map<string, { athleteRef: string; statsRef: string }>();

    for (const page of pages) {
      for (const cat of DEF_CATS) {
        for (const l of getCategory(page, cat)) {
          const athleteRef = l.athlete?.$ref;
          const statsRef   = l.statistics?.$ref;
          if (!athleteRef || !statsRef) continue;
          const id = extractId(athleteRef);
          if (!id || seen.has(id)) continue;
          seen.add(id);
          uniqueRefs.set(id, { athleteRef, statsRef });
        }
      }
    }

    // Batch-fetch athlete profiles + stats in parallel
    const ids = Array.from(uniqueRefs.keys());
    const [athletes, statMaps] = await Promise.all([
      Promise.all(ids.map((id) => fetchAthlete(uniqueRefs.get(id)!.athleteRef))),
      Promise.all(ids.map((id) => fetchStats(uniqueRefs.get(id)!.statsRef))),
    ]);

    // Build player objects — only keep defensive positions
    const defPlayers: DefPlayer[] = [];
    ids.forEach((id, i) => {
      const athlete = athletes[i];
      if (!athlete || !DEF_POSITIONS.has(athlete.position)) return;
      const s = statMaps[i];
      defPlayers.push({
        id,
        name:             athlete.name,
        team:             athlete.team,
        position:         athlete.position,
        tackles:          s.totalTackles ?? s.tackles ?? 0,
        tacklesForLoss:   s.tacklesForLoss ?? 0,
        interceptions:    s.defensiveInterceptions ?? s.interceptions ?? 0,
        fumblesForced:    s.fumblesForced ?? 0,
        fumblesRecovered: s.fumblesRecovered ?? 0,
        passBreakups:     s.passesDefended ?? s.passBreakups ?? 0,
        sacks:            s.sacks ?? 0,
      });
    });

    const byTackles = (a: DefPlayer, b: DefPlayer) => b.tackles - a.tackles;

    return Response.json({
      DTs: defPlayers.filter((p) => p.position === "DT").sort(byTackles),
      DEs: defPlayers.filter((p) => p.position === "DE").sort(byTackles),
      LBs: defPlayers.filter((p) => LB_GROUP.has(p.position)).sort(byTackles),
      CBs: defPlayers.filter((p) => p.position === "CB").sort(byTackles),
      Ss:  defPlayers.filter((p) => S_GROUP.has(p.position)).sort(byTackles),
    });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
