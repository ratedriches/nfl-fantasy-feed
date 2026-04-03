"use client";

import { useEffect, useState } from "react";
import type { DefPlayer } from "@/app/api/defense-stats/route";

type DefTab = "DE" | "LB" | "CB" | "S";

interface DefData {
  DEs: DefPlayer[];
  LBs: DefPlayer[];
  CBs: DefPlayer[];
  Ss:  DefPlayer[];
}

interface Col {
  label: string;
  key: keyof DefPlayer;
  decimals?: number;
}

const LIMITS: Record<DefTab, number> = { DE: 50, LB: 100, CB: 50, S: 50 };

function fmt(val: number, decimals = 0): string {
  if (val === undefined || val === null || isNaN(val)) return "—";
  return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toString();
}

function lastName(name: string): string {
  const parts = name.trim().split(" ");
  return parts[parts.length - 1].toLowerCase();
}

const cols: Col[] = [
  { label: "Tackles", key: "tackles" },
  { label: "TFL",     key: "tacklesForLoss" },
  { label: "INTs",    key: "interceptions" },
  { label: "FF",      key: "fumblesForced" },
  { label: "FR",      key: "fumblesRecovered" },
  { label: "PBU",     key: "passBreakups" },
];

function SortableTable({ players }: { players: DefPlayer[] }) {
  const [sortKey, setSortKey] = useState<keyof DefPlayer | "name">("tackles");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  function handleSort(key: keyof DefPlayer | "name") {
    if (key === sortKey) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  const sorted = [...players].sort((a, b) => {
    if (sortKey === "name") {
      const cmp = lastName(a.name).localeCompare(lastName(b.name));
      return sortDir === "asc" ? cmp : -cmp;
    }
    const av = a[sortKey as keyof DefPlayer] as number ?? 0;
    const bv = b[sortKey as keyof DefPlayer] as number ?? 0;
    return sortDir === "desc" ? bv - av : av - bv;
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th
              onClick={() => handleSort("name")}
              className={`sticky left-0 z-10 cursor-pointer bg-gray-900 px-3 py-3 text-left font-semibold transition-colors ${sortKey === "name" ? "text-white" : "text-gray-400"}`}
            >
              Player{sortKey === "name" && <span className="ml-1">{sortDir === "asc" ? "↑" : "↓"}</span>}
            </th>
            <th className="px-2 py-3 text-left text-gray-500 font-normal">Tm</th>
            {cols.map((col) => (
              <th
                key={col.key}
                onClick={() => handleSort(col.key)}
                className={`cursor-pointer px-3 py-3 text-right font-semibold transition-colors ${sortKey === col.key ? "text-white" : "text-gray-400"}`}
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
            <tr
              key={player.id}
              className={`border-b border-gray-800 ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/50"}`}
            >
              <td className="sticky left-0 z-10 bg-inherit px-3 py-2.5 font-semibold text-white">
                {player.name}
              </td>
              <td className="px-2 py-2.5 text-gray-500">{player.team}</td>
              {cols.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2.5 text-right ${sortKey === col.key ? "font-semibold text-white" : "text-gray-300"}`}
                >
                  {fmt(player[col.key] as number, col.decimals)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DefenseStatsClient() {
  const [data, setData]     = useState<DefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);
  const [tab, setTab] = useState<DefTab>("LB");

  useEffect(() => {
    fetch("/api/defense-stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(true);
        else setData(d);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading defense stats...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load defense stats.</p>
        <p className="mt-1 text-xs text-gray-600">Data source may be unavailable. Try again later.</p>
      </div>
    );
  }

  const tabData: Record<DefTab, DefPlayer[]> = {
    DE: data.DEs.slice(0, LIMITS.DE),
    LB: data.LBs.slice(0, LIMITS.LB),
    CB: data.CBs.slice(0, LIMITS.CB),
    S:  data.Ss.slice(0,  LIMITS.S),
  };

  return (
    <div>
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {(["DE", "LB", "CB", "S"] as DefTab[]).map((t) => (
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

      <SortableTable players={tabData[tab]} />

      <p className="mt-2 text-xs text-gray-600">
        Tap a column to sort · DE 50 · LB 100 · CB 50 · S 50 · 2025 season
      </p>
    </div>
  );
}
