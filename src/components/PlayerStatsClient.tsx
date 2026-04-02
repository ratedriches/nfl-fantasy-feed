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

function fmt(val: number | undefined, decimals = 0): string {
  if (!val && val !== 0) return "—";
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString();
}

function PlayerRow({ rank, player, cells }: { rank: number; player: EnrichedPlayer; cells: string[] }) {
  return (
    <tr className="border-b border-gray-800">
      <td className="px-2 py-2.5 text-center text-xs text-gray-600">{rank}</td>
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
      {cells.map((cell, i) => (
        <td key={i} className="px-2 py-2.5 text-right text-xs text-gray-300">{cell || "—"}</td>
      ))}
    </tr>
  );
}

function StatsTable({ headers, rows }: { headers: string[]; rows: { player: EnrichedPlayer; cells: string[] }[] }) {
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-gray-500">No data available.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="px-2 py-3 text-center text-gray-400">#</th>
            <th className="sticky left-0 bg-gray-900 px-2 py-3 text-left text-gray-400">Player</th>
            {headers.map((h) => (
              <th key={h} className="px-2 py-3 text-right text-gray-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ player, cells }, i) => (
            <PlayerRow key={player.id} rank={i + 1} player={player} cells={cells} />
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

      {tab === "QB" && (
        <StatsTable
          headers={["Pass Yds", "TD", "INT", "Comp%", "Rating", "Rush Yds"]}
          rows={data.passers.slice(0, 25).map((p) => ({  // top 25
            player: p,
            cells: [
              fmt(p.passingYards),
              fmt(p.passingTouchdowns),
              fmt(p.interceptions),
              fmt(p.completionPct, 1),
              fmt(p.QBRating, 1),
              fmt(p.rushingYards),
            ],
          }))}
        />
      )}

      {tab === "RB" && (
        <StatsTable
          headers={["Rush Yds", "Att", "Rush TD", "Rec", "Rec Yds", "Rec TD"]}
          rows={data.rushers.slice(0, 50).map((p) => ({  // top 50
            player: p,
            cells: [
              fmt(p.rushingYards),
              fmt(p.rushingAttempts),
              fmt(p.rushingTouchdowns),
              fmt(p.receptions),
              fmt(p.receivingYards),
              fmt(p.receivingTouchdowns),
            ],
          }))}
        />
      )}

      {tab === "WR" && (
        <StatsTable
          headers={["Rec Yds", "Rec", "Targets", "TD", "Yds/Rec"]}
          rows={data.wideReceivers.slice(0, 100).map((p) => ({  // top 100
            player: p,
            cells: [
              fmt(p.receivingYards),
              fmt(p.receptions),
              fmt(p.receivingTargets),
              fmt(p.receivingTouchdowns),
              p.receptions > 0 ? fmt(p.receivingYards / p.receptions, 1) : "—",
            ],
          }))}
        />
      )}

      {tab === "TE" && (
        <StatsTable
          headers={["Rec Yds", "Rec", "Targets", "TD", "Yds/Rec"]}
          rows={data.tightEnds.slice(0, 25).map((p) => ({  // top 25
            player: p,
            cells: [
              fmt(p.receivingYards),
              fmt(p.receptions),
              fmt(p.receivingTargets),
              fmt(p.receivingTouchdowns),
              p.receptions > 0 ? fmt(p.receivingYards / p.receptions, 1) : "—",
            ],
          }))}
        />
      )}

      {tab === "Defense" && (
        <StatsTable
          headers={["Tackles", "Sacks", "TFL", "INTs", "PD"]}
          rows={data.defenders.slice(0, 25).map((p) => ({  // top 25
            player: p,
            cells: [
              fmt(p.totalTackles),
              fmt(p.sacks),
              fmt(p.tacklesForLoss),
              fmt(p.defensiveInterceptions),
              fmt(p.passesDefended),
            ],
          }))}
        />
      )}

      <p className="mt-2 text-xs text-gray-600">QB: top 25 · RB: top 50 · WR: top 100 · TE: top 25 · Defense: top 25 · 2025 regular season</p>
    </div>
  );
}
