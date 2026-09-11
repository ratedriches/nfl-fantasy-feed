"use client";

import { useEffect, useState } from "react";
import type { SeasonResult } from "@/lib/espnFantasy";

export default function LeagueChampionsClient() {
  const [seasons, setSeasons] = useState<SeasonResult[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/league/history")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setSeasons(Array.isArray(data.seasons) ? data.seasons : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading championship history...</p>
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

  if (error || seasons.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">No completed seasons found yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {seasons.map((s) => (
        <div key={s.year} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <div className="mb-2 text-sm font-bold text-white">{s.year}</div>
          <div className="flex flex-col gap-1.5 text-xs">
            {s.champion && (
              <div className="flex items-center gap-2">
                <span className="text-base">🥇</span>
                <span className="text-gray-300">
                  <span className="font-semibold text-white">{s.champion.teamName}</span> — {s.champion.ownerName}
                </span>
              </div>
            )}
            {s.runnerUp && (
              <div className="flex items-center gap-2">
                <span className="text-base">🥈</span>
                <span className="text-gray-400">
                  <span className="font-semibold text-gray-300">{s.runnerUp.teamName}</span> — {s.runnerUp.ownerName}
                </span>
              </div>
            )}
            {s.thirdPlace && (
              <div className="flex items-center gap-2">
                <span className="text-base">🥉</span>
                <span className="text-gray-500">
                  <span className="font-semibold text-gray-400">{s.thirdPlace.teamName}</span> —{" "}
                  {s.thirdPlace.ownerName}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
