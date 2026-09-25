"use client";

import { useEffect, useState } from "react";
import type { RecordBook } from "@/lib/recordBook";

const POSITION_ORDER = ["QB", "RB", "WR", "TE", "K", "P", "D/ST", "DT", "DE", "LB", "CB", "S", "DB"];

export default function LeagueRecordsClient() {
  const [recordBook, setRecordBook] = useState<RecordBook | null>(null);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activePosition, setActivePosition] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/league/records")
      .then((r) => r.json())
      .then((data) => {
        setConfigured(Boolean(data.configured));
        setRecordBook(data.recordBook ?? null);
        if (data.recordBook?.topPlayersByPosition) {
          const firstPos = POSITION_ORDER.find((p) => data.recordBook.topPlayersByPosition[p]?.length);
          setActivePosition(firstPos ?? null);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-white" />
        <p className="text-sm text-gray-400">Loading record book...</p>
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
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_S2</code>,{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">ESPN_SWID</code>,{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_URL</code>, and{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">KV_REST_API_TOKEN</code> to{" "}
          <code className="rounded bg-gray-800 px-1 py-0.5">.env.local</code>.
        </p>
      </div>
    );
  }

  if (error || !recordBook) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-400">The record book hasn&apos;t been built yet.</p>
        <p className="mt-1 text-xs text-gray-600">
          It builds automatically once a week. This takes a few minutes the first time since it pulls every past
          season&apos;s box scores.
        </p>
      </div>
    );
  }

  const positions = POSITION_ORDER.filter((p) => recordBook.topPlayersByPosition[p]?.length);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-xs text-gray-600">
        Covering {recordBook.seasonsCovered[0]}–{recordBook.seasonsCovered[recordBook.seasonsCovered.length - 1]} ·
        last updated {new Date(recordBook.computedAt).toLocaleDateString()}
      </p>

      <Section title="Top 10 Weekly Team Scores">
        <ol className="flex flex-col gap-1.5">
          {recordBook.topWeeklyTeamScores.map((s, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-gray-900 px-3 py-2 text-sm">
              <span className="text-gray-500 w-5">{i + 1}.</span>
              <span className="flex-1 text-gray-200">
                <span className="font-semibold text-white">{s.teamName}</span> ({s.ownerName}) — {s.year} Wk {s.week}
              </span>
              <span className="font-bold text-emerald-400">{s.score.toFixed(1)}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Closest Matchups">
        <ol className="flex flex-col gap-1.5">
          {recordBook.closestMatchups.map((m, i) => (
            <li key={i} className="rounded-lg bg-gray-900 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 w-5">{i + 1}.</span>
                <span className="flex-1 text-gray-200">
                  {m.teamA} {m.scoreA.toFixed(1)} — {m.teamB} {m.scoreB.toFixed(1)}
                </span>
                <span className="font-bold text-blue-400">{m.margin.toFixed(2)}</span>
              </div>
              <div className="ml-5 text-xs text-gray-600">
                {m.year} Wk {m.week}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Biggest Blowouts">
        <ol className="flex flex-col gap-1.5">
          {recordBook.biggestBlowouts.map((m, i) => (
            <li key={i} className="rounded-lg bg-gray-900 px-3 py-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 w-5">{i + 1}.</span>
                <span className="flex-1 text-gray-200">
                  {m.teamA} {m.scoreA.toFixed(1)} — {m.teamB} {m.scoreB.toFixed(1)}
                </span>
                <span className="font-bold text-red-400">{m.margin.toFixed(2)}</span>
              </div>
              <div className="ml-5 text-xs text-gray-600">
                {m.year} Wk {m.week}
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Most Championship Wins">
        <ol className="flex flex-col gap-1.5">
          {(recordBook.mostChampionships ?? []).map((c, i) => (
            <li key={i} className="flex items-center justify-between rounded-lg bg-gray-900 px-3 py-2 text-sm">
              <span className="text-gray-500 w-5">{i + 1}.</span>
              <span className="flex-1 font-semibold text-white">{c.ownerName}</span>
              <span className="font-bold text-amber-400">
                {c.championships} 🏆{c.championships === 1 ? "" : "s"}
              </span>
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
        <Section title="Best Single-Season Records">
          <ol className="flex flex-col gap-1.5">
            {recordBook.bestSeasonRecords.map((s, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-gray-900 px-3 py-2 text-sm">
                <span className="text-gray-500 w-5">{i + 1}.</span>
                <span className="flex-1 text-gray-200">
                  <span className="font-semibold text-white">{s.teamName}</span> ({s.ownerName}) — {s.year}
                </span>
                <span className="font-bold text-emerald-400">
                  {s.wins}-{s.losses}
                  {s.ties ? `-${s.ties}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Worst Single-Season Records">
          <ol className="flex flex-col gap-1.5">
            {recordBook.worstSeasonRecords.map((s, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-gray-900 px-3 py-2 text-sm">
                <span className="text-gray-500 w-5">{i + 1}.</span>
                <span className="flex-1 text-gray-200">
                  <span className="font-semibold text-white">{s.teamName}</span> ({s.ownerName}) — {s.year}
                </span>
                <span className="font-bold text-red-400">
                  {s.wins}-{s.losses}
                  {s.ties ? `-${s.ties}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Section title="Best Weekly Individual Scores by Position">
        <div className="mb-3 flex flex-wrap gap-2">
          {positions.map((p) => (
            <button
              key={p}
              onClick={() => setActivePosition(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activePosition === p ? "bg-gray-700 text-white" : "bg-gray-900 text-gray-400 border border-gray-800"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {activePosition && (
          <ol className="flex flex-col gap-1.5">
            {recordBook.topPlayersByPosition[activePosition].map((p, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-gray-900 px-3 py-2 text-sm">
                <span className="text-gray-500 w-5">{i + 1}.</span>
                <span className="flex-1 text-gray-200">
                  <span className="font-semibold text-white">{p.playerName}</span> — {p.teamName} ({p.ownerName}),{" "}
                  {p.year} Wk {p.week}
                </span>
                <span className="font-bold text-emerald-400">{p.points.toFixed(1)}</span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">{title}</h2>
      {children}
    </div>
  );
}
