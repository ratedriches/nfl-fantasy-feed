"use client";

import { useState } from "react";
import type { TeamStats } from "@/lib/espn";

type SortKey = string;

export default function TeamStatsTable({ teams }: { teams: TeamStats[] }) {
  const [view, setView] = useState<"offense" | "defense">("offense");
  const [sortKey, setSortKey] = useState<SortKey>(view === "offense" ? "avgPointsFor" : "avgPointsAgainst");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "team" ? "asc" : key === "avgPointsAgainst" ? "asc" : "desc");
    }
  }

  function handleViewChange(v: "offense" | "defense") {
    setView(v);
    setSortKey(v === "offense" ? "avgPointsFor" : "avgPointsAgainst");
    setSortDir(v === "offense" ? "desc" : "asc");
  }

  function winPct(record: string): number {
    const [w, l, t] = record.split("-").map(Number);
    const games = (w || 0) + (l || 0) + (t || 0);
    return games > 0 ? ((w || 0) + (t || 0) * 0.5) / games : 0;
  }

  const sorted = [...teams].sort((a, b) => {
    if (sortKey === "team") {
      const cmp = a.abbrev.localeCompare(b.abbrev);
      return sortDir === "asc" ? cmp : -cmp;
    }
    if (sortKey === "record") {
      const cmp = winPct(a.record) - winPct(b.record);
      return sortDir === "desc" ? cmp * -1 : cmp;
    }
    const av = (a as any)[sortKey] ?? 0;
    const bv = (b as any)[sortKey] ?? 0;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  const offenseCols = [
    { key: "avgPointsFor", label: "Pts/G", title: "Points Per Game" },
    { key: "totalOffensiveYardsPerGame", label: "Yds/G", title: "Total Yards Per Game" },
    { key: "netPassingYardsPerGame", label: "Pass/G", title: "Net Passing Yards Per Game" },
    { key: "rushingYardsPerGame", label: "Rush/G", title: "Rushing Yards Per Game" },
    { key: "passingTouchdowns", label: "Pass TD", title: "Passing Touchdowns" },
    { key: "rushingTouchdowns", label: "Rush TD", title: "Rushing Touchdowns" },
  ];

  const defenseCols = [
    { key: "avgPointsAgainst", label: "Pts All/G", title: "Points Allowed Per Game" },
    { key: "sacks", label: "Sacks", title: "Sacks" },
    { key: "defensiveInterceptions", label: "INTs", title: "Defensive Interceptions" },
    { key: "tacklesForLoss", label: "TFL", title: "Tackles For Loss" },
    { key: "passesDefended", label: "PD", title: "Passes Defended" },
    { key: "fumblesRecovered", label: "Fum Rec", title: "Fumbles Recovered" },
  ];

  const cols = view === "offense" ? offenseCols : defenseCols;

  function fmt(val: number, key: string): string {
    if (!val && val !== 0) return "—";
    if (key === "avgPointsFor" || key === "avgPointsAgainst") return val.toFixed(1);
    return val.toLocaleString();
  }

  return (
    <div>
      {/* Offense / Defense toggle */}
      <div className="mb-4 flex rounded-xl border border-gray-800 bg-gray-900 p-1 w-fit">
        {(["offense", "defense"] as const).map((v) => (
          <button
            key={v}
            onClick={() => handleViewChange(v)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
              view === v ? "bg-gray-700 text-white" : "text-gray-400"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              <th
                onClick={() => handleSort("team")}
                className={`sticky left-0 z-10 bg-gray-900 cursor-pointer px-3 py-3 text-left font-semibold transition-colors ${sortKey === "team" ? "text-white" : "text-gray-400"}`}
              >
                Team{sortKey === "team" && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
              </th>
              <th
                onClick={() => handleSort("record")}
                className={`cursor-pointer px-3 py-3 text-center font-semibold transition-colors ${sortKey === "record" ? "text-white" : "text-gray-400"}`}
              >
                W-L{sortKey === "record" && <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
              </th>
              {cols.map((col) => (
                <th
                  key={col.key}
                  title={col.title}
                  onClick={() => handleSort(col.key)}
                  className={`cursor-pointer px-3 py-3 text-right font-semibold transition-colors ${
                    sortKey === col.key ? "text-white" : "text-gray-400"
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((team, i) => (
              <tr
                key={team.id}
                className={`border-b border-gray-800 ${
                  i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/50"
                }`}
              >
                <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev.toLowerCase()}.png`}
                      alt={team.abbrev}
                      className="h-5 w-5 object-contain"
                    />
                    <span className="font-semibold text-white">{team.abbrev}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center text-gray-300">{team.record}</td>
                {cols.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 text-right ${
                      sortKey === col.key ? "font-semibold text-white" : "text-gray-300"
                    }`}
                  >
                    {fmt((team as any)[col.key], col.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-600">Tap a column header to sort · /G = per game average</p>
    </div>
  );
}
