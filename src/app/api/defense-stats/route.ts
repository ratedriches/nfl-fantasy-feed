// Defensive player stats from NFLverse (free, GitHub-hosted CSV, no auth required)
// Completely separate from ESPN — won't affect other tabs
const NFLVERSE_DEF =
  "https://github.com/nflverse/nflverse-data/releases/download/player_stats/player_stats_def_2025.csv";

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

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (values[i] ?? "").trim().replace(/"/g, "");
    });
    return row;
  });
}

function num(val: string | undefined): number {
  const n = parseFloat(val ?? "0");
  return isNaN(n) ? 0 : n;
}

const LB_POSITIONS = new Set(["LB", "OLB", "MLB", "ILB"]);
const S_POSITIONS  = new Set(["FS", "SS", "S", "DB"]);

export async function GET() {
  try {
    const res = await fetch(NFLVERSE_DEF, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`NFLverse fetch failed: ${res.status}`);

    const text = await res.text();
    const rows = parseCSV(text);

    // Aggregate weekly rows into season totals per player
    const playerMap = new Map<string, DefPlayer>();
    for (const row of rows) {
      const id = row.player_id;
      if (!id) continue;
      if (!playerMap.has(id)) {
        playerMap.set(id, {
          id,
          name: row.player_display_name || row.player_name || "",
          team: row.recent_team || row.team || "",
          position: row.position || "",
          tackles: 0,
          tacklesForLoss: 0,
          interceptions: 0,
          fumblesForced: 0,
          fumblesRecovered: 0,
          passBreakups: 0,
          sacks: 0,
        });
      }
      const p = playerMap.get(id)!;
      p.tackles         += num(row.def_tackles);
      p.tacklesForLoss  += num(row.def_tackles_for_loss);
      p.interceptions   += num(row.def_interceptions);
      p.fumblesForced   += num(row.def_fumbles_forced);
      p.fumblesRecovered += num(row.def_fumbles_recovered ?? row.def_fumbles);
      p.passBreakups    += num(row.def_pass_defended);
      p.sacks           += num(row.def_sacks);
      // keep most recent team
      if (row.recent_team) p.team = row.recent_team;
    }

    const all = Array.from(playerMap.values()).filter((p) => p.tackles > 0 || p.sacks > 0 || p.interceptions > 0);

    const byTackles = (a: DefPlayer, b: DefPlayer) => b.tackles - a.tackles;

    const DTs = all.filter((p) => p.position === "DT").sort(byTackles);
    const DEs = all.filter((p) => p.position === "DE").sort(byTackles);
    const LBs = all.filter((p) => LB_POSITIONS.has(p.position)).sort(byTackles);
    const CBs = all.filter((p) => p.position === "CB").sort(byTackles);
    const Ss  = all.filter((p) => S_POSITIONS.has(p.position)).sort(byTackles);

    return Response.json({ DTs, DEs, LBs, CBs, Ss });
  } catch (e: any) {
    return Response.json({ error: e?.message ?? "Internal error" }, { status: 500 });
  }
}
