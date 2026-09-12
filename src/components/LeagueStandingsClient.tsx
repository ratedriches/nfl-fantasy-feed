"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Division, LeagueTeam } from "@/lib/espnFantasy";

export default function LeagueStandingsClient() {
  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/league/standings")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setTeams(Array.isArray(data.standings) ? data.standings : []);
        setDivisions(Array.isArray(data.divisions) ? data.divisions : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading standings...</p>
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

  if (error || teams.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load standings.</p>
        <p className="mt-1 text-xs text-gray-600">Check that your ESPN cookies are still valid.</p>
      </div>
    );
  }

  const groups: { label: string | null; teams: LeagueTeam[] }[] =
    divisions.length > 1
      ? divisions.map((d) => ({
          label: d.name,
          teams: teams.filter((t) => t.divisionId === d.id),
        }))
      : [{ label: null, teams }];

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.label ?? "all"}>
          {group.label && (
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{group.label}</h2>
          )}
          <StandingsTable teams={group.teams} />
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ teams }: { teams: LeagueTeam[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900">
            <th className="px-3 py-3 text-left font-semibold text-gray-400">#</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-400">Team</th>
            <th className="px-3 py-3 text-center font-semibold text-gray-400">W-L-T</th>
            <th className="px-3 py-3 text-right font-semibold text-gray-400">PF</th>
            <th className="px-3 py-3 text-right font-semibold text-gray-400">PA</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => (
            <tr
              key={team.id}
              className={`border-b border-gray-800 ${i % 2 === 0 ? "bg-gray-950" : "bg-gray-900/50"}`}
            >
              <td className="px-3 py-2.5 text-gray-500">{i + 1}</td>
              <td className="px-3 py-2.5">
                <Link href={`/league/team/${team.id}`} className="flex items-center gap-2">
                  {team.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={team.logo} alt="" className="h-5 w-5 rounded-full object-cover" />
                  )}
                  <span className="font-semibold text-white hover:underline">{team.name}</span>
                </Link>
              </td>
              <td className="px-3 py-2.5 text-center text-gray-300">
                {team.wins}-{team.losses}
                {team.ties ? `-${team.ties}` : ""}
              </td>
              <td className="px-3 py-2.5 text-right text-gray-300">{team.pointsFor.toFixed(1)}</td>
              <td className="px-3 py-2.5 text-right text-gray-300">{team.pointsAgainst.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
