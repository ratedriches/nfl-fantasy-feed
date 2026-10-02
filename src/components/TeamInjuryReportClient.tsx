"use client";

import { useEffect, useMemo, useState } from "react";
import type { InjuryReportEntry } from "@/lib/injuries";

const STATUS_STYLES: Record<string, string> = {
  Out: "bg-red-500/15 text-red-400",
  "Injured Reserve": "bg-red-500/15 text-red-400",
  Doubtful: "bg-orange-500/15 text-orange-400",
  Questionable: "bg-yellow-500/15 text-yellow-400",
  Active: "bg-emerald-500/15 text-emerald-400",
};

// Real position abbreviations ESPN returns, bucketed into the requested
// group order. "Other" catches anything unexpected so a new abbreviation
// never silently disappears from the report.
const GROUP_ORDER = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "CB", "S", "K", "P", "Other"];

const POSITION_TO_GROUP: Record<string, string> = {
  QB: "QB",
  RB: "RB",
  FB: "RB",
  WR: "WR",
  TE: "TE",
  OT: "OL",
  G: "OL",
  C: "OL",
  DT: "DL",
  DE: "DL",
  LB: "LB",
  CB: "CB",
  S: "S",
  PK: "K",
  P: "P",
  LS: "Other",
};

function groupFor(position: string): string {
  return POSITION_TO_GROUP[position] ?? "Other";
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export default function TeamInjuryReportClient({ slug }: { slug: string }) {
  const [report, setReport] = useState<InjuryReportEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/injuries/${slug}`)
      .then((r) => r.json())
      .then((data) => setReport(Array.isArray(data.report) ? data.report : []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const groups = useMemo(() => {
    const byGroup = new Map<string, InjuryReportEntry[]>();
    for (const p of report) {
      const g = groupFor(p.position);
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(p);
    }
    // Report itself already comes severity-sorted from the API; preserve
    // that order within each position group rather than re-sorting.
    return GROUP_ORDER.map((g) => ({ group: g, players: byGroup.get(g) ?? [] })).filter((g) => g.players.length > 0);
  }, [report]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading injury report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">Unable to load the injury report.</p>
        <p className="mt-1 text-xs text-gray-600">ESPN API may be unavailable. Try again later.</p>
      </div>
    );
  }

  if (report.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">No players currently on the injury report.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map(({ group, players }) => (
        <div key={group}>
          <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{group}</h2>
          <div className="flex flex-col gap-2">
            {players.map((p) => (
              <div key={p.playerId} className="rounded-xl border border-gray-800 bg-gray-900 p-3">
                <div className="flex items-start gap-3">
                  {p.headshotUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.headshotUrl} alt="" className="h-10 w-10 shrink-0 rounded-full bg-gray-800 object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-full bg-gray-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {p.playerName}
                        {p.position && <span className="ml-1.5 text-xs font-normal text-gray-500">{p.position}</span>}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          STATUS_STYLES[p.status] ?? "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                    {p.injuryType && <p className="mt-0.5 text-xs capitalize text-gray-500">{p.injuryType}</p>}
                    {p.comment && <p className="mt-1 text-xs leading-relaxed text-gray-400">{p.comment}</p>}
                    {p.date && <p className="mt-1 text-[10px] text-gray-600">Updated {formatDate(p.date)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
