"use client";

import { useEffect, useMemo, useState } from "react";
import type { OwnerHistory, SeasonResult } from "@/lib/espnFantasy";

type SortKey =
  | "ownerName"
  | "seasons"
  | "wins"
  | "winPct"
  | "avgPointsPerWeek"
  | "firstPlaceFinishes"
  | "secondPlaceFinishes"
  | "thirdPlaceFinishes"
  | "divisionTitles";

const COLUMNS: { key: SortKey; label: string; align: "left" | "center" | "right" }[] = [
  { key: "ownerName", label: "Owner", align: "left" },
  { key: "seasons", label: "Seasons", align: "center" },
  { key: "wins", label: "W-L-T", align: "center" },
  { key: "winPct", label: "Win%", align: "right" },
  { key: "avgPointsPerWeek", label: "Avg Pts", align: "right" },
  { key: "firstPlaceFinishes", label: "🥇", align: "center" },
  { key: "secondPlaceFinishes", label: "🥈", align: "center" },
  { key: "thirdPlaceFinishes", label: "🥉", align: "center" },
  { key: "divisionTitles", label: "Div", align: "center" },
];

export default function LeagueHistoryClient() {
  const [owners, setOwners] = useState<OwnerHistory[]>([]);
  const [seasons, setSeasons] = useState<SeasonResult[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("winPct");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetch("/api/league/history")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setOwners(Array.isArray(data.owners) ? data.owners : []);
        setSeasons(Array.isArray(data.seasons) ? data.seasons : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir(key === "ownerName" ? "asc" : "desc");
    }
  }

  const sortedOwners = useMemo(() => {
    return [...owners].sort((a, b) => {
      let cmp: number;
      if (sortKey === "ownerName") {
        cmp = a.ownerName.localeCompare(b.ownerName);
      } else {
        cmp = a[sortKey] - b[sortKey];
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [owners, sortKey, sortDir]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading league history...</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-gray-300">ESPN league credentials aren&apos;t set up yet.</p>
        <p className="mt-2 text-xs text-gray-500">
          Add <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_LEAGUE_ID</code>,{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_SEASON</code>,{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_S2</code> and{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_SWID</code> to{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">.env.local</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  if (error || owners.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">No completed seasons found yet.</p>
      </div>
    );
  }

  const seasonsAsc = [...seasons].sort((a, b) => a.year - b.year);

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border border-gray-800">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 bg-gray-900">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  title={`Sort by ${col.label}`}
                  className={`cursor-pointer select-none px-3 py-3 font-semibold transition-colors ${
                    col.align === "left" ? "text-left" : col.align === "right" ? "text-right" : "text-center"
                  } ${sortKey === col.key ? "text-white" : "text-gray-400"}`}
                >
                  {col.label}
                  {sortKey === col.key && <span className="ml-1">{sortDir === "desc" ? "↓" : "↑"}</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedOwners.map((o, i) => (
              <tr
                key={o.ownerId}
                className={`border-b border-gray-800 ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/50"}`}
              >
                <td className="px-3 py-2.5 font-semibold text-white">{o.ownerName}</td>
                <td className="px-3 py-2.5 text-center text-gray-300">{o.seasons}</td>
                <td className="px-3 py-2.5 text-center text-gray-300">
                  {o.wins}-{o.losses}
                  {o.ties ? `-${o.ties}` : ""}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-300">{o.winPct.toFixed(1)}%</td>
                <td className="px-3 py-2.5 text-right text-gray-300">{o.avgPointsPerWeek.toFixed(1)}</td>
                <td className="px-3 py-2.5 text-center text-gray-300">{o.firstPlaceFinishes || "—"}</td>
                <td className="px-3 py-2.5 text-center text-gray-300">{o.secondPlaceFinishes || "—"}</td>
                <td className="px-3 py-2.5 text-center text-gray-300">{o.thirdPlaceFinishes || "—"}</td>
                <td className="px-3 py-2.5 text-center text-gray-300">{o.divisionTitles || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-gray-800 px-3 py-2 text-[11px] text-gray-600">Tap a column header to sort</p>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Seasons on Record</h2>
        <div className="flex flex-wrap gap-2">
          {seasonsAsc.map((s) => (
            <div
              key={s.year}
              className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-1.5 text-xs text-gray-300"
            >
              <span className="font-semibold text-white">{s.year}</span>{" "}
              <span className="text-gray-500">· {s.numTeams} teams</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
