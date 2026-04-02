"use client";

import { useEffect, useState } from "react";
import type { TeamStats } from "@/lib/espn";
import TeamStatsTable from "@/components/TeamStatsTable";

export default function TeamStatsClient() {
  const [teams, setTeams] = useState<TeamStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/team-stats")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeams(data);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading team stats...</p>
      </div>
    );
  }

  if (error || teams.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load team stats.</p>
        <p className="mt-1 text-xs text-gray-600">ESPN API may be unavailable. Try again later.</p>
      </div>
    );
  }

  return <TeamStatsTable teams={teams} />;
}
