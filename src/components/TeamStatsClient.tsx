"use client";

import { useEffect, useState } from "react";
import type { TeamStats } from "@/lib/espn";
import TeamStatsTable from "@/components/TeamStatsTable";

const NFL_TEAMS = [
  { id: "22", abbrev: "ARI" }, { id: "1", abbrev: "ATL" }, { id: "33", abbrev: "BAL" },
  { id: "2", abbrev: "BUF" }, { id: "29", abbrev: "CAR" }, { id: "3", abbrev: "CHI" },
  { id: "4", abbrev: "CIN" }, { id: "5", abbrev: "CLE" }, { id: "6", abbrev: "DAL" },
  { id: "7", abbrev: "DEN" }, { id: "8", abbrev: "DET" }, { id: "9", abbrev: "GB" },
  { id: "34", abbrev: "HOU" }, { id: "11", abbrev: "IND" }, { id: "30", abbrev: "JAX" },
  { id: "12", abbrev: "KC" },  { id: "13", abbrev: "LV" },  { id: "24", abbrev: "LAC" },
  { id: "14", abbrev: "LAR" }, { id: "15", abbrev: "MIA" }, { id: "16", abbrev: "MIN" },
  { id: "17", abbrev: "NE" },  { id: "18", abbrev: "NO" },  { id: "19", abbrev: "NYG" },
  { id: "20", abbrev: "NYJ" }, { id: "21", abbrev: "PHI" }, { id: "23", abbrev: "PIT" },
  { id: "25", abbrev: "SF" },  { id: "26", abbrev: "SEA" }, { id: "27", abbrev: "TB" },
  { id: "10", abbrev: "TEN" }, { id: "28", abbrev: "WAS" },
];

async function fetchOneTeam(id: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}/statistics`
    );
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, number> = {};
    for (const cat of data.results?.stats?.categories ?? []) {
      for (const stat of cat.stats ?? []) {
        if (typeof stat.value === "number") map[stat.name] = stat.value;
        if (typeof stat.perGameValue === "number") map[`${stat.name}_pg`] = stat.perGameValue;
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function fetchStandings(): Promise<any[]> {
  try {
    const res = await fetch(
      `https://site.web.api.espn.com/apis/v2/sports/football/nfl/standings?season=2025&seasontype=2`
    );
    if (!res.ok) return [];
    const data = await res.json();
    const teams: any[] = [];
    for (const conf of data.children ?? []) {
      for (const div of conf.children ?? []) {
        for (const entry of div.standings?.entries ?? []) {
          const sm: Record<string, any> = {};
          for (const s of entry.stats ?? []) {
            sm[s.name] = s.value;
            if (s.summary) sm[`${s.name}_summary`] = s.summary;
          }
          const wins = Number(sm.wins ?? 0);
          const losses = Number(sm.losses ?? 0);
          const ties = Number(sm.ties ?? 0);
          const gamesPlayed = wins + losses + ties || 17;
          const pointsFor = Number(sm.pointsFor ?? 0);
          const pointsAgainst = Number(sm.pointsAgainst ?? 0);
          teams.push({
            id: entry.team.id,
            name: entry.team.displayName,
            abbrev: entry.team.abbreviation,
            wins, losses, ties, gamesPlayed,
            record: String(sm["overall_summary"] ?? `${wins}-${losses}`),
            avgPointsFor: gamesPlayed > 0 ? Math.round((pointsFor / gamesPlayed) * 10) / 10 : 0,
            avgPointsAgainst: gamesPlayed > 0 ? Math.round((pointsAgainst / gamesPlayed) * 10) / 10 : 0,
          });
        }
      }
    }
    return teams.sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  } catch {
    return [];
  }
}

export default function TeamStatsClient() {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [standings, ...allStats] = await Promise.all([
          fetchStandings(),
          ...NFL_TEAMS.map((t) => fetchOneTeam(t.id)),
        ]);

        if (standings.length === 0) { setError(true); setLoading(false); return; }

        const statsById: Record<string, Record<string, number>> = {};
        NFL_TEAMS.forEach((t, i) => { statsById[t.id] = allStats[i]; });

        const result: TeamStats[] = standings.map((team) => {
          const s = statsById[team.id] ?? {};
          const g = team.gamesPlayed;
          const get = (k: string) => s[k] ?? 0;
          const pg = (k: string) => s[`${k}_pg`] ?? 0;

          const passYdsPG = get("netPassingYardsPerGame") || get("passingYardsPerGame") || pg("netPassingYards") || (get("netPassingYards") > 0 ? Math.round(get("netPassingYards") / g) : 0);
          const rushYdsPG = pg("rushingYards") || (get("rushingYards") > 0 ? Math.round(get("rushingYards") / g) : 0);

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

        setTeams(result);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading team stats...</p>
      </div>
    );
  }

  if (error || teams.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load team stats.</p>
        <p className="mt-1 text-xs text-gray-600">ESPN API may be unavailable. Try again later.</p>
      </div>
    );
  }

  return <TeamStatsTable teams={teams} />;
}
