"use client";

import { useEffect, useState } from "react";
import type { EnrichedPlayer } from "@/app/api/player-stats/route";

type Tab = "QB" | "RB" | "WR" | "TE" | "Defense";

interface StatsData {
  passers: EnrichedPlayer[];
  rushers: EnrichedPlayer[];
  wideReceivers: EnrichedPlayer[];
  tightEnds: EnrichedPlayer[];
  defenders: EnrichedPlayer[];
}

interface Col {
  label: string;
  key: keyof EnrichedPlayer;
  decimals?: number;
  compute?: (p: EnrichedPlayer) => number;
}

function fmt(val: number | undefined, decimals = 0): string {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
}

function SortableTable({
  cols,
  players,
  defaultSortKey,
}: {
  cols: Col[];
  players: EnrichedPlayer[];
  defaultSortKey: keyof EnrichedPlayer;
}) {
  const [sortKey, setSortKey] = useState<keyof EnrichedPlayer>(defaultSortKey);
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  function handleSort(key: keyof EnrichedPlayer) {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const colForKey = (key: keyof EnrichedPlayer) => cols.find((c) => c.key === key);

  const sorted = [...players].sort((a, b) => {
    const col = colForKey(sortKey);
    const av = col?.compute ? col.compute(a) : (a[sortKey] as number) ?? 0;
    const bv = col?.compute ? col.compute(b) : (b[sortKey] as number) ?? 0;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  function cellValue(p: EnrichedPlayer, col: Col): string {
    if (col.compute) return fmt(col.compute(p), col.decimals ?? 0);
    return fmt(p[col.key] as number, col.decimals ?? 0);
  }

  if (players.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No data available.</p>;

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="px-2 py-3 text-center text-gray-400">#</th>
            <th className="sticky left-0 bg-gray-900 px-2 py-3 text-left text-gray-400">Player</th>
            {cols.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`cursor-pointer px-2 py-3 text-right font-semibold transition-colors ${
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
          {sorted.map((player, i) => (
            <tr key={player.id} className="border-b border-gray-800">
              <td className="px-2 py-2.5 text-center text-xs text-gray-600">{i + 1}</td>
              <td className="sticky left-0 bg-gray-950 px-2 py-2.5">
                <div className="flex items-center gap-2">
                  {player.headshotUrl ? (
                    <img src={player.headshotUrl} alt={player.shortName} className="h-7 w-7 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-gray-400">
                      {player.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-white">{player.shortName}</p>
                    <p className="text-xs text-gray-500">{player.teamAbbrev}</p>
                  </div>
                </div>
              </td>
              {cols.map((col) => (
                <td
                  key={col.key}
                  className={`px-2 py-2.5 text-right text-xs ${
                    sortKey === col.key ? "font-semibold text-white" : "text-gray-300"
                  }`}
                >
                  {cellValue(player, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PlayerStatsClient() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("QB");

  useEffect(() => {
    fetch("/api/player-stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.passers?.length > 0) setData(d);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading player stats...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load player stats.</p>
        <p className="mt-1 text-xs text-gray-600">ESPN API may be unavailable. Try again later.</p>
      </div>
    );
  }

  const tabs: Tab[] = ["QB", "RB", "WR", "TE", "Defense"];

  const qbCols: Col[] = [
    { label: "Pass Yds", key: "passingYards" },
    { label: "TD",       key: "passingTouchdowns" },
    { label: "INT",      key: "interceptions" },
    { label: "Comp%",    key: "completionPct", decimals: 1 },
    { label: "Rating",   key: "QBRating", decimals: 1 },
    { label: "Rush Yds", key: "rushingYards" },
  ];

  const rbCols: Col[] = [
    { label: "Rush Yds", key: "rushingYards" },
    { label: "Att",      key: "rushingAttempts" },
    { label: "Rush TD",  key: "rushingTouchdowns" },
    { label: "Rec",      key: "receptions" },
    { label: "Rec Yds",  key: "receivingYards" },
    { label: "Rec TD",   key: "receivingTouchdowns" },
  ];

  const recCols: Col[] = [
    { label: "Rec Yds",  key: "receivingYards" },
    { label: "Rec",      key: "receptions" },
    { label: "Targets",  key: "receivingTargets" },
    { label: "TD",       key: "receivingTouchdowns" },
    {
      label: "Yds/Rec",
      key: "receivingYards",
      decimals: 1,
      compute: (p) => (p.receptions > 0 ? p.receivingYards / p.receptions : 0),
    },
  ];

  const defCols: Col[] = [
    { label: "Tackles", key: "totalTackles" },
    { label: "Sacks",   key: "sacks" },
    { label: "TFL",     key: "tacklesForLoss" },
    { label: "INTs",    key: "defensiveInterceptions" },
    { label: "PD",      key: "passesDefended" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t ? "bg-white text-gray-950" : "border border-gray-700 bg-gray-900 text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "QB"      && <SortableTable cols={qbCols}  players={data.passers.slice(0, 25)}          defaultSortKey="passingYards" />}
      {tab === "RB"      && <SortableTable cols={rbCols}  players={data.rushers.slice(0, 50)}          defaultSortKey="rushingYards" />}
      {tab === "WR"      && <SortableTable cols={recCols} players={data.wideReceivers.slice(0, 100)}   defaultSortKey="receivingYards" />}
      {tab === "TE"      && <SortableTable cols={recCols} players={data.tightEnds.slice(0, 25)}        defaultSortKey="receivingYards" />}
      {tab === "Defense" && <SortableTable cols={defCols} players={data.defenders.slice(0, 25)}        defaultSortKey="totalTackles" />}

      <p className="mt-2 text-xs text-gray-600">Tap a column to sort · QB 25 · RB 50 · WR 100 · TE 25 · DEF 25 · 2025 season</p>
    </div>
  );
}
