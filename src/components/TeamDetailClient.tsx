"use client";

import { useEffect, useState } from "react";
import type { TeamDetail } from "@/lib/teamDetail";

export default function TeamDetailClient({ teamId }: { teamId: number }) {
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/league/team/${teamId}`)
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setTeam(data.team ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading team...</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-gray-300">ESPN league credentials aren&apos;t set up yet.</p>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Couldn&apos;t find that team.</p>
      </div>
    );
  }

  const rounds = new Map<number, typeof team.draftPicks>();
  for (const p of team.draftPicks) {
    if (!rounds.has(p.round)) rounds.set(p.round, []);
    rounds.get(p.round)!.push(p);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
        {team.logo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={team.logo} alt="" className="h-14 w-14 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-lg font-bold text-white">{team.name}</h1>
          <p className="text-sm text-gray-400">{team.ownerName}</p>
          <p className="mt-1 text-xs text-gray-500">
            {team.wins}-{team.losses}
            {team.ties ? `-${team.ties}` : ""} · {team.pointsFor.toFixed(1)} PF · {team.pointsAgainst.toFixed(1)} PA
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Standings</h2>
          {team.standings ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="text-gray-200">
                <span className="font-bold text-white">#{team.standings.overallRank}</span>{" "}
                <span className="text-gray-500">of {team.standings.totalTeams} overall</span>
              </p>
              {team.standings.divisionName && (
                <p className="text-gray-200">
                  <span className="font-bold text-white">#{team.standings.divisionRank}</span>{" "}
                  <span className="text-gray-500">
                    of {team.standings.divisionTotalTeams} in {team.standings.divisionName}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not available yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Power Ranking</h2>
          {team.powerRanking.current ? (
            <div className="flex flex-col gap-1 text-sm">
              <p className="text-gray-200">
                <span className="font-bold text-white">#{team.powerRanking.current.rank}</span>{" "}
                <span className="text-gray-500">
                  of {team.powerRanking.totalTeams} currently (wk {team.powerRanking.current.week})
                </span>
              </p>
              {team.powerRanking.highest && (
                <p className="text-emerald-400">
                  Best: #{team.powerRanking.highest.rank}{" "}
                  <span className="text-gray-500">(week {team.powerRanking.highest.week})</span>
                </p>
              )}
              {team.powerRanking.lowest && (
                <p className="text-red-400">
                  Worst: #{team.powerRanking.lowest.rank}{" "}
                  <span className="text-gray-500">(week {team.powerRanking.lowest.week})</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Not enough data yet.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Week-by-Week</h2>
        {team.schedule.length === 0 ? (
          <p className="text-sm text-gray-500">No matchups yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {team.schedule.map((s) => (
              <div
                key={s.week}
                className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2 text-sm"
              >
                <span className="w-14 shrink-0 text-xs text-gray-500">Week {s.week}</span>
                {s.opponentLogo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.opponentLogo} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                )}
                <span className="flex-1 truncate text-gray-200">vs {s.opponentName}</span>
                <span className="shrink-0 text-gray-300">
                  {s.teamScore.toFixed(1)}
                  {s.opponentScore !== null ? ` - ${s.opponentScore.toFixed(1)}` : ""}
                </span>
                {s.isLive ? (
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    LIVE
                  </span>
                ) : (
                  <span
                    className={`shrink-0 w-5 text-center text-xs font-bold ${
                      s.result === "W" ? "text-emerald-400" : s.result === "L" ? "text-red-400" : "text-gray-500"
                    }`}
                  >
                    {s.result}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">What They&apos;re Saying</h2>
        {team.chatMentions.length === 0 ? (
          <p className="text-sm text-gray-500">No mentions in the chat yet.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {team.chatMentions.map((m) => (
              <div key={m.id} className="rounded-xl border border-gray-800 bg-gray-900 p-3">
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-xs font-semibold ${m.isBot ? "text-emerald-400" : "text-gray-300"}`}>
                    {m.author}
                    {m.isBot && <span className="ml-1 text-[9px] font-normal text-emerald-600">BOT</span>}
                  </span>
                  <span className="text-[10px] text-gray-600">{new Date(m.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="mt-1 text-sm text-gray-200">{m.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Draft Class</h2>
        {rounds.size === 0 ? (
          <p className="text-sm text-gray-500">No draft data yet.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {Array.from(rounds.entries())
              .sort((a, b) => a[0] - b[0])
              .map(([round, roundPicks]) =>
                roundPicks.map((p) => (
                  <div
                    key={p.overallPickNumber}
                    className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2"
                  >
                    <span className="w-10 shrink-0 text-center text-xs font-semibold text-gray-500">
                      {round}.{p.roundPick}
                    </span>
                    {p.headshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.headshotUrl}
                        alt=""
                        className="h-8 w-8 shrink-0 rounded-full bg-gray-800 object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 shrink-0 rounded-full bg-gray-800" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">
                        {p.playerName}
                        {p.playerPosition && (
                          <span className="ml-1.5 text-xs font-normal text-gray-500">
                            {p.playerPosition}
                            {p.playerProTeam ? ` · ${p.playerProTeam}` : ""}
                          </span>
                        )}
                      </div>
                      {p.isKeeper && <div className="text-xs text-amber-500">Keeper</div>}
                    </div>
                  </div>
                ))
              )}
          </div>
        )}
      </div>
    </div>
  );
}
