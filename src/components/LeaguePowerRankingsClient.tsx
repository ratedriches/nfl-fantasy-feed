"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PowerRanking } from "@/lib/espnFantasy";

export default function LeaguePowerRankingsClient() {
  const [rankings, setRankings] = useState<PowerRanking[]>([]);
  const [weeksConsidered, setWeeksConsidered] = useState<number[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/league/power-rankings")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setRankings(Array.isArray(data.rankings) ? data.rankings : []);
        setWeeksConsidered(Array.isArray(data.weeksConsidered) ? data.weeksConsidered : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading power rankings...</p>
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

  if (error || rankings.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">No games have been played yet this season.</p>
        <p className="mt-1 text-xs text-gray-600">Power rankings will appear once week 1 kicks off.</p>
      </div>
    );
  }

  const lastWeek = weeksConsidered[weeksConsidered.length - 1];

  return (
    <div>
      <p className="mb-4 text-xs text-gray-500">
        Through week {lastWeek}
        {weeksConsidered.length < 3 ? " (season just started — rankings will stabilize)" : ""} · 60% all-play
        record + 40% recent scoring form
      </p>
      <div className="flex flex-col gap-2">
        {rankings.map((r) => (
          <div key={r.teamId} className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-3">
            <span className="w-6 shrink-0 text-center text-lg font-bold text-gray-500">{r.rank}</span>
            {r.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={r.logo} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 shrink-0 rounded-full bg-gray-800" />
            )}
            <div className="min-w-0 flex-1">
              <Link
                href={`/league/team/${r.teamId}`}
                className="block truncate text-sm font-semibold text-white hover:underline"
              >
                {r.teamName}
              </Link>
              <div className="truncate text-xs text-gray-500">
                {r.actualWins}-{r.actualLosses} actual · {r.allPlayWins}-{r.allPlayLosses} all-play ·{" "}
                {r.avgPointsRecent.toFixed(1)} avg (L3)
              </div>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-400">{r.powerScore.toFixed(1)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
