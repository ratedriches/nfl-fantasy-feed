"use client";

import { useEffect, useState } from "react";
import type { LeaderCategory, PlayerLeader } from "@/lib/espn";

type Tab = "QB" | "RB" | "WR/TE" | "Defense";

function lookup(categories: LeaderCategory[], name: string): Map<string, string> {
  const map = new Map<string, string>();
  const cat = categories.find((c) => c.name === name);
  for (const l of cat?.leaders ?? []) map.set(l.id, l.displayValue);
  return map;
}

function PlayerRow({
  rank,
  player,
  cells,
}: {
  rank: number;
  player: PlayerLeader;
  cells: string[];
}) {
  return (
    <tr className="border-b border-gray-800">
      <td className="px-2 py-2.5 text-center text-xs text-gray-600">{rank}</td>
      <td className="sticky left-0 bg-gray-950 px-2 py-2.5">
        <div className="flex items-center gap-2">
          {player.headshotUrl ? (
            <img
              src={player.headshotUrl}
              alt={player.shortName}
              className="h-7 w-7 rounded-full object-cover"
            />
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
        <td key={i} className="px-2 py-2.5 text-right text-xs text-gray-300">
          {cell || "—"}
        </td>
      ))}
    </tr>
  );
}

function StatsTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: { player: PlayerLeader; cells: string[] }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="px-2 py-3 text-center text-gray-400">#</th>
            <th className="sticky left-0 bg-gray-900 px-2 py-3 text-left text-gray-400">
              Player
            </th>
            {headers.map((h) => (
              <th key={h} className="px-2 py-3 text-right text-gray-400">
                {h}
              </th>
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
  const [categories, setCategories] = useState<LeaderCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("QB");

  useEffect(() => {
    fetch("/api/player-stats")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
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

  if (error || categories.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load player stats.</p>
        <p className="mt-1 text-xs text-gray-600">ESPN API may be unavailable. Try again later.</p>
      </div>
    );
  }

  // Build lookup maps for cross-referencing stats by player ID
  const passTDs   = lookup(categories, "passingTouchdowns");
  const rating    = lookup(categories, "quarterbackRating");
  const rushYds   = lookup(categories, "rushingYards");
  const rushTDs   = lookup(categories, "rushingTouchdowns");
  const rec       = lookup(categories, "receptions");
  const recYds    = lookup(categories, "receivingYards");
  const recTDs    = lookup(categories, "receivingTouchdowns");
  const tackles   = lookup(categories, "totalTackles");
  const sacks     = lookup(categories, "sacks");
  const ints      = lookup(categories, "interceptions");
  const pd        = lookup(categories, "passesDefended");

  const passYdLeaders  = categories.find((c) => c.name === "passingYards")?.leaders ?? [];
  const rushYdLeaders  = categories.find((c) => c.name === "rushingYards")?.leaders ?? [];
  const recYdLeaders   = categories.find((c) => c.name === "receivingYards")?.leaders ?? [];
  const tackleLeaders  = categories.find((c) => c.name === "totalTackles")?.leaders ?? [];

  const tabs: Tab[] = ["QB", "RB", "WR/TE", "Defense"];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              tab === t
                ? "bg-white text-gray-950"
                : "border border-gray-700 bg-gray-900 text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "QB" && (
        <StatsTable
          headers={["Pass Yds", "TD", "Rating", "Rush Yds"]}
          rows={passYdLeaders.slice(0, 30).map((p) => ({
            player: p,
            cells: [
              p.displayValue,
              passTDs.get(p.id) ?? "—",
              rating.get(p.id) ?? "—",
              rushYds.get(p.id) ?? "—",
            ],
          }))}
        />
      )}

      {tab === "RB" && (
        <StatsTable
          headers={["Rush Yds", "Rush TD", "Rec", "Rec Yds"]}
          rows={rushYdLeaders.slice(0, 30).map((p) => ({
            player: p,
            cells: [
              p.displayValue,
              rushTDs.get(p.id) ?? "—",
              rec.get(p.id) ?? "—",
              recYds.get(p.id) ?? "—",
            ],
          }))}
        />
      )}

      {tab === "WR/TE" && (
        <StatsTable
          headers={["Rec Yds", "Rec", "TD"]}
          rows={recYdLeaders.slice(0, 30).map((p) => ({
            player: p,
            cells: [
              p.displayValue,
              rec.get(p.id) ?? "—",
              recTDs.get(p.id) ?? "—",
            ],
          }))}
        />
      )}

      {tab === "Defense" && (
        <StatsTable
          headers={["Tackles", "Sacks", "INTs", "PD"]}
          rows={tackleLeaders.slice(0, 30).map((p) => ({
            player: p,
            cells: [
              p.displayValue,
              sacks.get(p.id) ?? "—",
              ints.get(p.id) ?? "—",
              pd.get(p.id) ?? "—",
            ],
          }))}
        />
      )}

      <p className="mt-2 text-xs text-gray-600">Top 30 per position · 2025 regular season</p>
    </div>
  );
}
