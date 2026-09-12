"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { RecapSummary } from "@/lib/weeklyRecap";

export default function LeagueRecapsClient() {
  const [recaps, setRecaps] = useState<RecapSummary[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/league/recaps")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setRecaps(Array.isArray(data.recaps) ? data.recaps : []);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading recaps...</p>
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
        <p className="text-gray-300">Recaps aren&apos;t configured yet.</p>
        <p className="mt-2 text-xs text-gray-500">
          Needs <code className="rounded bg-gray-800 px-1 py-0.5">ANTHROPIC_API_KEY</code>,{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_URL</code>, and{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_TOKEN</code>.
        </p>
      </div>
    );
  }

  if (error || recaps.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">No recaps yet.</p>
        <p className="mt-1 text-xs text-gray-600">
          A new recap is written automatically once each week&apos;s games finish.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {recaps.map((r) => (
        <Link
          key={`${r.year}-${r.week}`}
          href={`/league/recaps/${r.year}/${r.week}`}
          className="group flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4 active:scale-95 transition-transform"
        >
          <div className="min-w-0 flex-1">
            <div className="text-xs text-gray-500">
              {r.year} · Week {r.week}
            </div>
            <div className="mt-0.5 truncate text-sm font-semibold text-white">{r.headline}</div>
          </div>
          <span className="text-gray-600 group-hover:text-gray-300">→</span>
        </Link>
      ))}
    </div>
  );
}
