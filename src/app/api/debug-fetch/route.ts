// Temporary diagnostic route — remove once the production player-stats
// empty-response issue is understood. Mirrors /api/player-stats exactly but
// reports counts at each stage instead of the final player objects.
import { NFL_SEASON as SEASON } from "@/lib/season";

const CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";
const SEASON_TYPE = 2;

function extractId(ref: string) {
  const m = ref.match(/athletes\/(\d+)/);
  return m ? m[1] : "";
}

async function fetchAthleteOk(ref: string): Promise<boolean> {
  try {
    const res = await fetch(ref, { next: { revalidate: 3600 } });
    if (!res.ok) return false;
    await res.json();
    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const diag: Record<string, unknown> = {};

  const [leadersRes, rushLeadersRes, recLeadersRes] = await Promise.all([
    fetch(`${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders?limit=50`, { next: { revalidate: 3600 } }),
    fetch(`${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders?limit=100`, { next: { revalidate: 3600 } }),
    fetch(`${CORE}/seasons/${SEASON}/types/${SEASON_TYPE}/leaders?limit=200`, { next: { revalidate: 3600 } }),
  ]);
  diag.leadersStatus = { pass: leadersRes.status, rush: rushLeadersRes.status, rec: recLeadersRes.status };

  if (!leadersRes.ok) return Response.json({ diag, stoppedAt: "leadersRes.ok false" });

  const leadersData = await leadersRes.json();
  const rushData = rushLeadersRes.ok ? await rushLeadersRes.json() : leadersData;
  const recData = recLeadersRes.ok ? await recLeadersRes.json() : leadersData;

  const getCategory = (data: any, name: string) => data.categories?.find((c: any) => c.name === name)?.leaders ?? [];

  const passLeaders = getCategory(leadersData, "passingYards");
  const rushLeaders = getCategory(rushData, "rushingYards");
  const recLeaders = getCategory(recData, "receivingYards");
  const tackleLeaders = getCategory(leadersData, "totalTackles");
  diag.leaderCounts = {
    pass: passLeaders.length,
    rush: rushLeaders.length,
    rec: recLeaders.length,
    tackle: tackleLeaders.length,
  };

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
  diag.uniqueRefsCount = uniqueRefs.size;

  const ids = Array.from(uniqueRefs.keys());
  const start = Date.now();
  const [athleteResults, statsResults] = await Promise.all([
    Promise.all(ids.map((id) => fetchAthleteOk(uniqueRefs.get(id)!.athleteRef))),
    Promise.all(ids.map((id) => fetchAthleteOk(uniqueRefs.get(id)!.statsRef))),
  ]);
  diag.combinedFetchMs = Date.now() - start;
  diag.athleteOkCount = athleteResults.filter(Boolean).length;
  diag.statsOkCount = statsResults.filter(Boolean).length;
  diag.total = ids.length;

  return Response.json({ diag });
}
