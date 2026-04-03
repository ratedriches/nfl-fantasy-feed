// Defensive player stats via ESPN — separate route from /api/player-stats
// DEs/LBs/CBs/S: pulled from ESPN leader categories (tackles, sacks, INTs, PBU)
// DTs: pulled from all 32 team rosters (DTs never top leader categories)
// Completely isolated from the offensive route.

const CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";
const SITE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const SEASON = 2025;
const SEASON_TYPE = 2;

const TEAM_IDS = [
  1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,
  17,18,19,20,21,22,23,24,25,26,27,28,29,30,33,34,
];

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

async function fetchStats(athleteId: string): Promise<Record<string, number>> {
  try {
    const url = `${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/athletes/${athleteId}/statistics/0`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return {};
    const d = await res.json();
    const categories: any[] = d.splits?.categories ?? d.categories ?? [];
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

// Fetch players of given positions from all 32 team rosters
async function fetchFromRosters(positions: string[]): Promise<{ id: string; name: string; team: string; position: string }[]> {
  const posSet = new Set(positions);
  const rosterResponses = await Promise.all(
    TEAM_IDS.map((id) =>
      fetch(`${SITE}/teams/${id}/roster`, { next: { revalidate: 3600 } })
        .then((r) => r.ok ? r.json() : null)
        .catch(() => null)
    )
  );

  const players: { id: string; name: string; team: string; position: string }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < TEAM_IDS.length; i++) {
    const data = rosterResponses[i];
    if (!data) continue;
    const teamAbbrev = TEAM_ID_TO_ABBREV[String(TEAM_IDS[i])] ?? "";
    const groups: any[] = data.athletes ?? [];
    for (const group of groups) {
      for (const athlete of group.items ?? []) {
        const pos = athlete.position?.abbreviation ?? "";
        const id = String(athlete.id);
        if (posSet.has(pos) && !seen.has(id)) {
          seen.add(id);
          players.push({ id, name: athlete.displayName ?? "", team: teamAbbrev, position: pos });
        }
      }
    }
  }
  return players;
}

const S_GROUP = new Set(["S", "FS", "SS", "DB"]);

export async function GET() {
  try {
    const BASE = `${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders`;
    const OPT  = { next: { revalidate: 3600 } } as const;

    // Fetch leader pages + DT/DE rosters in parallel
    const [
      tp1, tp2, tp3,
      ip1, ip2,
      pp1, pp2,
      dlinemenRoster,
    ] = await Promise.all([
      fetch(`${BASE}?limit=100`,        OPT).then((r) => r.ok ? r.json() : { categories: [] }),
      fetch(`${BASE}?limit=100&page=2`, OPT).then((r) => r.ok ? r.json() : { categories: [] }),
      fetch(`${BASE}?limit=100&page=3`, OPT).then((r) => r.ok ? r.json() : { categories: [] }),
      fetch(`${BASE}?limit=100`,        OPT).then((r) => r.ok ? r.json() : { categories: [] }),
      fetch(`${BASE}?limit=100&page=2`, OPT).then((r) => r.ok ? r.json() : { categories: [] }),
      fetch(`${BASE}?limit=100`,        OPT).then((r) => r.ok ? r.json() : { categories: [] }),
      fetch(`${BASE}?limit=100&page=2`, OPT).then((r) => r.ok ? r.json() : { categories: [] }),
      fetchFromRosters(["DT", "DE"]),
    ]);

    const getCategory = (data: any, name: string) =>
      data.categories?.find((c: any) => c.name === name)?.leaders ?? [];

    // LB, CB, S — still from leader categories
    const tackleLeaders = [
      ...getCategory(tp1, "totalTackles"),
      ...getCategory(tp2, "totalTackles"),
      ...getCategory(tp3, "totalTackles"),
    ];
    const intLeaders = [...getCategory(ip1, "defensiveInterceptions"), ...getCategory(ip2, "defensiveInterceptions")];
    const pbuLeaders = [...getCategory(pp1, "passesDefended"), ...getCategory(pp2, "passesDefended")];
    const allLeaders = [...tackleLeaders, ...intLeaders, ...pbuLeaders];

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

    const leaderIds = Array.from(uniqueRefs.keys());
    const [leaderAthletes, leaderStatMaps] = await Promise.all([
      Promise.all(leaderIds.map((id) => fetchAthlete(uniqueRefs.get(id)!.athleteRef))),
      Promise.all(leaderIds.map((id) => fetchStats(id))),
    ]);

    const LB_CB_S = new Set(["LB", "CB", "S", "FS", "SS", "DB"]);
    const leaderPlayers: DefPlayer[] = [];
    leaderIds.forEach((id, i) => {
      const athlete = leaderAthletes[i];
      if (!athlete || !LB_CB_S.has(athlete.position)) return;
      const s = leaderStatMaps[i];
      leaderPlayers.push({
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

    // DT + DE — fetched from all 32 rosters for complete coverage
    const dlinemenStats = await Promise.all(dlinemenRoster.map((p) => fetchStats(p.id)));
    const dlinemenPlayers: DefPlayer[] = dlinemenRoster
      .map((p, i) => {
        const s = dlinemenStats[i];
        if (!s.totalTackles && !s.sacks && !s.tacklesForLoss) return null;
        return {
          id:               p.id,
          name:             p.name,
          team:             p.team,
          position:         p.position,
          tackles:          s.totalTackles ?? 0,
          tacklesForLoss:   s.tacklesForLoss ?? 0,
          interceptions:    s.defensiveInterceptions ?? 0,
          fumblesForced:    s.fumblesForced ?? 0,
          fumblesRecovered: s.fumblesRecovered ?? 0,
          passBreakups:     s.passesDefended ?? 0,
          sacks:            s.sacks ?? 0,
        } as DefPlayer;
      })
      .filter(Boolean) as DefPlayer[];

    const byTackles = (a: DefPlayer, b: DefPlayer) => b.tackles - a.tackles;
    const bySacks   = (a: DefPlayer, b: DefPlayer) => b.sacks - a.sacks;

    return Response.json({
      DTs: dlinemenPlayers.filter((p) => p.position === "DT").sort(byTackles),
      DEs: dlinemenPlayers.filter((p) => p.position === "DE").sort(bySacks),
      LBs: leaderPlayers.filter((p) => p.position === "LB").sort(byTackles),
      CBs: leaderPlayers.filter((p) => p.position === "CB").sort(byTackles),
      Ss:  leaderPlayers.filter((p) => S_GROUP.has(p.position)).sort(byTackles),
    });
  } catch {
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
