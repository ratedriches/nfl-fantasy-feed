"use client";

import { useEffect, useMemo, useState } from "react";
import type { DraftPick, DraftSummary } from "@/lib/espnFantasy";
import type { DraftAnalysis } from "@/lib/draftAnalysis";

function summarizeLineup(startingLineup: string[]): string {
  const counts = new Map<string, number>();
  for (const pos of startingLineup) counts.set(pos, (counts.get(pos) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([pos, count]) => (count > 1 ? `${count} ${pos}` : pos))
    .join(", ");
}

export default function LeagueDraftClient() {
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [summary, setSummary] = useState<DraftSummary | null>(null);
  const [drafted, setDrafted] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [analysis, setAnalysis] = useState<DraftAnalysis | null>(null);
  const [analysisConfigured, setAnalysisConfigured] = useState(true);

  useEffect(() => {
    fetch("/api/league/draft")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setDrafted(Boolean(data.drafted));
        setPicks(Array.isArray(data.picks) ? data.picks : []);
        setSummary(data.summary ?? null);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));

    fetch("/api/league/draft/analysis")
      .then((r) => r.json())
      .then((data) => {
        setAnalysisConfigured(Boolean(data.configured));
        setAnalysis(data.analysis ?? null);
      })
      .catch(() => {});
  }, []);

  const round1Picks = useMemo(
    () => picks.filter((p) => p.round === 1).sort((a, b) => a.roundPick - b.roundPick),
    [picks]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading draft recap...</p>
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

  if (error || picks.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">{drafted === false ? "The draft hasn't happened yet." : "Unable to load draft results."}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {summary && (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
          <h1 className="text-lg font-bold text-white">{summary.leagueName}</h1>
          <p className="text-sm font-semibold text-gray-300">{summary.year} Draft Recap</p>
          <p className="mt-2 text-xs text-gray-400">
            {summary.numTeams} teams · {summary.numRounds} rounds · {summary.numPicks} picks
            {summary.numKeepers > 0 ? ` · ${summary.numKeepers} keepers` : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {summarizeLineup(summary.startingLineup)} · Full PPR · {summary.waiverType}
          </p>

          {summary.highlights.length > 0 && (
            <ul className="mt-3 flex flex-col gap-1 border-t border-gray-800 pt-3 text-xs text-gray-300">
              {summary.highlights.map((h, i) => (
                <li key={i} className="flex gap-1.5">
                  <span className="text-gray-600">•</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Round 1</h2>
        {analysis?.round1Summary && (
          <p className="mb-3 text-sm text-gray-300">{analysis.round1Summary}</p>
        )}
        <div className="flex flex-col gap-1.5">
          {round1Picks.map((p) => (
            <div
              key={p.overallPickNumber}
              className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-900 px-3 py-2"
            >
              <span className="w-8 shrink-0 text-center text-xs font-semibold text-gray-500">
                {p.overallPickNumber}
              </span>
              {p.headshotUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.headshotUrl} alt="" className="h-8 w-8 shrink-0 rounded-full bg-gray-800 object-cover" />
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
                <div className="truncate text-xs text-gray-400">
                  {p.teamName}
                  {p.isKeeper && <span className="ml-1.5 text-amber-500">Keeper</span>}
                  {p.isAutoDraft && <span className="ml-1.5 text-gray-600">Auto</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Team-by-Team Breakdown</h2>
        {!analysisConfigured && (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 text-center">
            <p className="text-gray-300">Draft grades aren&apos;t configured yet.</p>
            <p className="mt-2 text-xs text-gray-500">
              Needs <code className="rounded bg-gray-800 px-1 py-0.5">ANTHROPIC_API_KEY</code>,{" "}
              <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_URL</code>, and{" "}
              <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_TOKEN</code>.
            </p>
          </div>
        )}
        {analysisConfigured && !analysis && (
          <div className="py-6 text-center">
            <p className="text-gray-400">Draft grades haven&apos;t been generated yet.</p>
          </div>
        )}
        {analysis && (
          <div className="flex flex-col gap-4">
            {analysis.teams.map((t) => (
              <div key={t.teamId} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold text-white">
                    {t.teamName} <span className="font-normal text-gray-500">({t.ownerName})</span>
                  </h3>
                  <span className="shrink-0 text-xs text-gray-500">Slot {t.slot}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-gray-200">{t.bestPart}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-400">{t.worstPart}</p>
                <p className="mt-3 border-t border-gray-800 pt-2 text-sm">
                  <span className="font-bold text-emerald-400">Grade: {t.grade}</span>{" "}
                  <span className="text-gray-400">{t.gradeNote}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
