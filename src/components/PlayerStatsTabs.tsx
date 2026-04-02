"use client";

import { useState } from "react";
import type { LeaderCategory, PlayerLeader } from "@/lib/espn";

type Position = "QB" | "RB" | "WR/TE" | "Defense";

interface QBRow extends PlayerLeader {
  passTDs: string;
  rating: string;
  rushYds: string;
}

interface RBRow extends PlayerLeader {
  rushTDs: string;
  receptions: string;
  recYds: string;
}

interface RecRow extends PlayerLeader {
  recTDs: string;
  targets: string;
}

interface DefRow extends PlayerLeader {
  sacks: string;
  ints: string;
  pd: string;
}

function buildLookup(categories: LeaderCategory[], name: string): Map<string, PlayerLeader> {
  const cat = categories.find((c) => c.name === name);
  const map = new Map<string, PlayerLeader>();
  for (const leader of cat?.leaders ?? []) {
    map.set(leader.id, leader);
  }
  return map;
}

function StatRow({ rank, player, cells }: { rank: number; player: PlayerLeader; cells: string[] }) {
  return (
    <tr className="border-b border-gray-800">
      <td className="px-2 py-2.5 text-center text-gray-600">{rank}</td>
      <td className="sticky left-0 bg-gray-950 px-2 py-2.5">
        <div className="flex items-center gap-2">
          {player.headshotUrl ? (
            <img src={player.headshotUrl} alt={player.shortName} className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-gray-400">
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

export default function PlayerStatsTabs({ categories }: { categories: LeaderCategory[] }) {
  const [pos, setPos] = useState<Position>("QB");

  const positions: Position[] = ["QB", "RB", "WR/TE", "Defense"];

  // Build lookup maps
  const passTDsMap = buildLookup(categories, "passingTouchdowns");
  const ratingMap = buildLookup(categories, "quarterbackRating");
  const rushYdsMap = buildLookup(categories, "rushingYards");
  const rushTDsMap = buildLookup(categories, "rushingTouchdowns");
  const recMap = buildLookup(categories, "receptions");
  const recYdsMap = buildLookup(categories, "receivingYards");
  const recTDsMap = buildLookup(categories, "receivingTouchdowns");
  const tacklesMap = buildLookup(categories, "totalTackles");
  const sacksMap = buildLookup(categories, "sacks");
  const intsMap = buildLookup(categories, "interceptions");
  const pdMap = buildLookup(categories, "passesDefended");

  // QB table — primary sort: passing yards
  const qbPlayers = (categories.find((c) => c.name === "passingYards")?.leaders ?? [])
    .slice(0, 30)
    .map((p): QBRow => ({
      ...p,
      passTDs: passTDsMap.get(p.id)?.displayValue ?? "—",
      rating: ratingMap.get(p.id)?.displayValue ?? "—",
      rushYds: rushYdsMap.get(p.id)?.displayValue ?? "—",
    }));

  // RB table — primary sort: rushing yards
  const rbPlayers = (categories.find((c) => c.name === "rushingYards")?.leaders ?? [])
    .slice(0, 30)
    .map((p): RBRow => ({
      ...p,
      rushTDs: rushTDsMap.get(p.id)?.displayValue ?? "—",
      receptions: recMap.get(p.id)?.displayValue ?? "—",
      recYds: recYdsMap.get(p.id)?.displayValue ?? "—",
    }));

  // WR/TE table — primary sort: receiving yards
  const recPlayers = (categories.find((c) => c.name === "receivingYards")?.leaders ?? [])
    .slice(0, 30)
    .map((p): RecRow => ({
      ...p,
      recTDs: recTDsMap.get(p.id)?.displayValue ?? "—",
      targets: "—", // not available in leaders endpoint
    }));

  // Defense — primary sort: tackles
  const defPlayers = (categories.find((c) => c.name === "totalTackles")?.leaders ?? [])
    .slice(0, 30)
    .map((p): DefRow => ({
      ...p,
      sacks: sacksMap.get(p.id)?.displayValue ?? "—",
      ints: intsMap.get(p.id)?.displayValue ?? "—",
      pd: pdMap.get(p.id)?.displayValue ?? "—",
    }));

  return (
    <div>
      {/* Position tabs */}
      <div className="mb-4 flex gap-1 overflow-x-auto">
        {positions.map((p) => (
          <button
            key={p}
            onClick={() => setPos(p)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              pos === p
                ? "bg-white text-gray-950"
                : "border border-gray-700 bg-gray-900 text-gray-400"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-800">
        {pos === "QB" && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-2 py-3 text-center text-gray-400">#</th>
                <th className="sticky left-0 bg-gray-900 px-2 py-3 text-left text-gray-400">Player</th>
                <th className="px-2 py-3 text-right text-gray-400">Pass Yds</th>
                <th className="px-2 py-3 text-right text-gray-400">Pass TD</th>
                <th className="px-2 py-3 text-right text-gray-400">Rating</th>
                <th className="px-2 py-3 text-right text-gray-400">Rush Yds</th>
              </tr>
            </thead>
            <tbody>
              {qbPlayers.map((p, i) => (
                <StatRow
                  key={p.id}
                  rank={i + 1}
                  player={p}
                  cells={[p.displayValue, p.passTDs, p.rating, p.rushYds]}
                />
              ))}
            </tbody>
          </table>
        )}

        {pos === "RB" && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-2 py-3 text-center text-gray-400">#</th>
                <th className="sticky left-0 bg-gray-900 px-2 py-3 text-left text-gray-400">Player</th>
                <th className="px-2 py-3 text-right text-gray-400">Rush Yds</th>
                <th className="px-2 py-3 text-right text-gray-400">Rush TD</th>
                <th className="px-2 py-3 text-right text-gray-400">Rec</th>
                <th className="px-2 py-3 text-right text-gray-400">Rec Yds</th>
              </tr>
            </thead>
            <tbody>
              {rbPlayers.map((p, i) => (
                <StatRow
                  key={p.id}
                  rank={i + 1}
                  player={p}
                  cells={[p.displayValue, p.rushTDs, p.receptions, p.recYds]}
                />
              ))}
            </tbody>
          </table>
        )}

        {pos === "WR/TE" && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-2 py-3 text-center text-gray-400">#</th>
                <th className="sticky left-0 bg-gray-900 px-2 py-3 text-left text-gray-400">Player</th>
                <th className="px-2 py-3 text-right text-gray-400">Rec Yds</th>
                <th className="px-2 py-3 text-right text-gray-400">Rec</th>
                <th className="px-2 py-3 text-right text-gray-400">Rec TD</th>
              </tr>
            </thead>
            <tbody>
              {recPlayers.map((p, i) => (
                <StatRow
                  key={p.id}
                  rank={i + 1}
                  player={p}
                  cells={[p.displayValue, recMap.get(p.id)?.displayValue ?? "—", p.recTDs]}
                />
              ))}
            </tbody>
          </table>
        )}

        {pos === "Defense" && (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900">
                <th className="px-2 py-3 text-center text-gray-400">#</th>
                <th className="sticky left-0 bg-gray-900 px-2 py-3 text-left text-gray-400">Player</th>
                <th className="px-2 py-3 text-right text-gray-400">Tackles</th>
                <th className="px-2 py-3 text-right text-gray-400">Sacks</th>
                <th className="px-2 py-3 text-right text-gray-400">INTs</th>
                <th className="px-2 py-3 text-right text-gray-400">PD</th>
              </tr>
            </thead>
            <tbody>
              {defPlayers.map((p, i) => (
                <StatRow
                  key={p.id}
                  rank={i + 1}
                  player={p}
                  cells={[p.displayValue, p.sacks, p.ints, p.pd]}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-600">Top 30 per position · 2025 regular season</p>
    </div>
  );
}
