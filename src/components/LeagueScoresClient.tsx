"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LeagueTeam, Matchup } from "@/lib/espnFantasy";

const POLL_INTERVAL_MS = 20_000;

export default function LeagueScoresClient() {
  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [week, setWeek] = useState<number | null>(null);
  const [currentMatchupPeriod, setCurrentMatchupPeriod] = useState(1);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const hasPickedDefaultWeek = useRef(false);

  const load = useCallback(() => {
    return fetch("/api/league/scores")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        const t: LeagueTeam[] = Array.isArray(data.teams) ? data.teams : [];
        const m: Matchup[] = Array.isArray(data.matchups) ? data.matchups : [];
        const cur: number = data.currentMatchupPeriod ?? 1;
        setTeams(t);
        setMatchups(m);
        setCurrentMatchupPeriod(cur);
        setLastUpdated(new Date());
        setError(false);

        // Only pick the default week once, on first load — don't override the
        // user's selection on subsequent polls.
        if (!hasPickedDefaultWeek.current) {
          hasPickedDefaultWeek.current = true;
          setWeek(cur);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") load();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  const teamById = useMemo(() => {
    const map = new Map<number, LeagueTeam>();
    teams.forEach((t) => map.set(t.id, t));
    return map;
  }, [teams]);

  const weeks = useMemo(
    () => Array.from(new Set(matchups.map((m) => m.matchupPeriodId))).sort((a, b) => a - b),
    [matchups]
  );

  const weekMatchups = useMemo(
    () => matchups.filter((m) => m.matchupPeriodId === week),
    [matchups, week]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading scores...</p>
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

  if (error || weeks.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load scores.</p>
        <p className="mt-1 text-xs text-gray-600">Check that your ESPN cookies are still valid.</p>
      </div>
    );
  }

  function teamLabel(id: number | null): { name: string; logo: string } {
    if (id === null) return { name: "BYE", logo: "" };
    const t = teamById.get(id);
    return { name: t?.name ?? `Team ${id}`, logo: t?.logo ?? "" };
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-gray-500">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
        Live · updates every 20s
        {lastUpdated && <span className="ml-auto">Updated {lastUpdated.toLocaleTimeString()}</span>}
      </div>

      {/* Week selector */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {weeks.map((w) => (
          <button
            key={w}
            onClick={() => setWeek(w)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              week === w ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-400 border border-gray-800"
            }`}
          >
            Week {w}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {weekMatchups.map((m, i) => {
          const home = teamLabel(m.homeTeamId);
          const away = teamLabel(m.awayTeamId);
          const homeWon = m.winner === "HOME";
          const awayWon = m.winner === "AWAY";
          const showLive = m.isLive && m.matchupPeriodId === currentMatchupPeriod;
          return (
            <div key={i} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
              {showLive && (
                <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  LIVE
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {home.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={home.logo} alt="" className="h-6 w-6 rounded-full object-cover" />
                  )}
                  <span className={`text-sm ${homeWon ? "font-bold text-white" : "text-gray-300"}`}>
                    {home.name}
                  </span>
                </div>
                <span className={`text-sm ${homeWon ? "font-bold text-white" : "text-gray-400"}`}>
                  {m.homeScore.toFixed(1)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {away.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={away.logo} alt="" className="h-6 w-6 rounded-full object-cover" />
                  )}
                  <span className={`text-sm ${awayWon ? "font-bold text-white" : "text-gray-300"}`}>
                    {away.name}
                  </span>
                </div>
                <span className={`text-sm ${awayWon ? "font-bold text-white" : "text-gray-400"}`}>
                  {m.awayScore === null ? "—" : m.awayScore.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
