"use client";

import { useEffect, useState } from "react";
import type { WeeklyRecap } from "@/lib/weeklyRecap";

export default function LeagueRecapDetailClient({ year, week }: { year: number; week: number }) {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/league/recaps/${year}/${week}`)
      .then((r) => r.json())
      .then((data) => setRecap(data.recap ?? null))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [year, week]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading recap...</p>
      </div>
    );
  }

  if (error || !recap) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Couldn&apos;t find that recap.</p>
      </div>
    );
  }

  return (
    <article>
      <h1 className="text-lg font-bold text-white">{recap.headline}</h1>
      <p className="mt-1 text-xs text-gray-500">
        {recap.year} · Week {recap.week}
      </p>
      <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-gray-200">
        {recap.body.split("\n\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </article>
  );
}
