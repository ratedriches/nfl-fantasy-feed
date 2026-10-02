import { fetchAthleteDetails } from "@/lib/espn";
import { mapWithConcurrency } from "@/lib/concurrency";

const CORE = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl";

export interface InjuryReportEntry {
  playerId: string;
  playerName: string;
  position: string;
  headshotUrl: string;
  status: string; // Out | Doubtful | Questionable | Injured Reserve | Active
  injuryType: string;
  comment: string;
  date: string;
}

// Lower = more severe / more newsworthy. "Active" means the player has
// effectively cleared the injury report, so it sorts last.
const SEVERITY: Record<string, number> = {
  "Out": 0,
  "Injured Reserve": 1,
  "Doubtful": 2,
  "Questionable": 3,
  "Active": 5,
};

export async function getTeamInjuryReport(espnTeamId: number): Promise<InjuryReportEntry[]> {
  try {
    const listRes = await fetch(`${CORE}/teams/${espnTeamId}/injuries?limit=100`, { next: { revalidate: 1800 } });
    if (!listRes.ok) return [];
    const listData = await listRes.json();
    const refs: string[] = (listData.items ?? []).map((i: any) => i.$ref).filter(Boolean);
    if (refs.length === 0) return [];

    const details = await mapWithConcurrency(refs, 20, async (ref) => {
      try {
        const res = await fetch(ref, { next: { revalidate: 1800 } });
        if (!res.ok) return null;
        return await res.json();
      } catch {
        return null;
      }
    });

    // ESPN returns every weekly report all season — keep only each player's
    // most recent entry so this reads as "this week's report", not a log.
    const latestByPlayer = new Map<string, any>();
    for (const d of details) {
      const athleteRef: string | undefined = d?.athlete?.$ref;
      if (!athleteRef) continue;
      const athleteId = athleteRef.match(/athletes\/(\d+)/)?.[1];
      if (!athleteId) continue;
      const existing = latestByPlayer.get(athleteId);
      if (!existing || new Date(d.date).getTime() > new Date(existing.date).getTime()) {
        latestByPlayer.set(athleteId, d);
      }
    }

    const entries = Array.from(latestByPlayer.entries());
    const athleteDetails = await mapWithConcurrency(entries, 20, ([, d]) => fetchAthleteDetails(d.athlete.$ref));

    const report: InjuryReportEntry[] = entries.map(([playerId, d], i) => ({
      playerId,
      playerName: athleteDetails[i].name || "Unknown Player",
      position: athleteDetails[i].position,
      headshotUrl: athleteDetails[i].headshotUrl,
      status: d.status ?? "Unknown",
      injuryType: d.type?.description ?? "",
      comment: d.shortComment ?? d.longComment ?? "",
      date: d.date,
    }));

    report.sort((a, b) => {
      const sevDiff = (SEVERITY[a.status] ?? 4) - (SEVERITY[b.status] ?? 4);
      if (sevDiff !== 0) return sevDiff;
      return a.playerName.localeCompare(b.playerName);
    });

    return report;
  } catch {
    return [];
  }
}
