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

// ESPN position groupings (confirmed from live API):
// - LB: traditional LBs + edge rushers ESPN classifies as LB (Burns, Parsons, etc.)
// - DE: traditional 4-3 ends (Garrett, Hutchinson, Hunter, etc.)
// - CB: corners — appear in defensiveInterceptions / passesDefended
// - S:  safeties (FS, SS) — appear in defensiveInterceptions / passesDefended
// - DT: not tracked by ESPN in any leader category — excluded
const DEF_POSITIONS = new Set(["DE", "LB", "CB", "FS", "SS", "S", "DB"]);
const S_GROUP       = new Set(["S", "FS", "SS", "DB"]);

export async function GET() {
  try {
    const BASE = `${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders`;
    const OPT  = { next: { revalidate: 3600 } } as const;

    // Fetch targeted category pages:
    // - totalTackles pages 1-3 → LBs
    // - sacks pages 1-2       → DEs (and LBs ESPN classifies as such)
    // - defensiveInterceptions + passesDefended → CBs and Safeties
    const [
      tacklesP1, tacklesP2, tacklesP3,
      sacksP1,   sacksP2,
      intsP1,    pbuP1,
    ] = await Promise.all([
      fetch(`${BASE}?limit=100`,        OPT),
      fetch(`${BASE}?limit=100&page=2`, OPT),
      fetch(`${BASE}?limit=100&page=3`, OPT),
      fetch(`${BASE}?limit=100`,        OPT),
      fetch(`${BASE}?limit=100&page=2`, OPT),
      fetch(`${BASE}?limit=100`,        OPT),
      fetch(`${BASE}?limit=100`,        OPT),
    ]);

    const toJson = (r: Response) => r.ok ? r.json() : Promise.resolve({ categories: [] });
    const [tp1, tp2, tp3, sp1, sp2, ip1, pp1] = await Promise.all([
      toJson(tacklesP1), toJson(tacklesP2), toJson(tacklesP3),
      toJson(sacksP1),   toJson(sacksP2),
      toJson(intsP1),    toJson(pbuP1),
    ]);

    const getCategory = (data: any, name: string) =>
      data.categories?.find((c: any) => c.name === name)?.leaders ?? [];

    // Pool leaders by category
    const tackleLeaders = [
      ...getCategory(tp1, "totalTackles"),
      ...getCategory(tp2, "totalTackles"),
      ...getCategory(tp3, "totalTackles"),
    ];
    const sackLeaders = [
      ...getCategory(sp1, "sacks"),
      ...getCategory(sp2, "sacks"),
    ];
    const intLeaders = getCategory(ip1, "defensiveInterceptions");
    const pbuLeaders = getCategory(pp1, "passesDefended");

    const allLeaders = [...tackleLeaders, ...sackLeaders, ...intLeaders, ...pbuLeaders];

    // Deduplicate by athlete ID
    const seen = new Set<string>();
    const uniqueRefs = new Map<string, { athleteRef: string; statsRef: string }>();
    for (const l of allLeaders) {
      const athleteRef = l.athlete?.$ref;
      const statsRef   = l.statistics?.$ref;
      if (!athleteRef || !statsRef) continue;
      const id = extractId(athleteRef);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      uniqueRefs.set(id, { athleteRef, statsRef });
    }

    // Batch-fetch athlete profiles + stats in parallel
    const ids = Array.from(uniqueRefs.keys());
    const [athletes, statMaps] = await Promise.all([
      Promise.all(ids.map((id) => fetchAthlete(uniqueRefs.get(id)!.athleteRef))),
      Promise.all(ids.map((id) => fetchStats(uniqueRefs.get(id)!.statsRef))),
    ]);

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
        tackles:          s.totalTackles ?? 0,
        tacklesForLoss:   s.tacklesForLoss ?? 0,
        interceptions:    s.defensiveInterceptions ?? 0,
        fumblesForced:    s.fumblesForced ?? 0,
        fumblesRecovered: s.fumblesRecovered ?? 0,
        passBreakups:     s.passesDefended ?? 0,
        sacks:            s.sacks ?? 0,
      });
    });

    const byTackles = (a: DefPlayer, b: DefPlayer) => b.tackles - a.tackles;
    const bySacks   = (a: DefPlayer, b: DefPlayer) => b.sacks - a.tackles;

    return Response.json({
      DEs: defPlayers.filter((p) => p.position === "DE").sort(bySacks),
      LBs: defPlayers.filter((p) => p.position === "LB").sort(byTackles),
      CBs: defPlayers.filter((p) => p.position === "CB").sort(byTackles),
      Ss:  defPlayers.filter((p) => S_GROUP.has(p.position)).sort(byTackles),
    });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
