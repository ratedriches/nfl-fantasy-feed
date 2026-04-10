"use client";

import { useState, useEffect } from "react";

type Tab = "coaching" | "offense" | "defense";

const TABS: { id: Tab; label: string }[] = [
  { id: "coaching", label: "Coaching Staff" },
  { id: "offense",  label: "Offense Players" },
  { id: "defense",  label: "Defense Players" },
];

interface OffenseData {
  sectionTitle: string;
  rows: { category: string; grade: string; notes: string }[];
  rating: string;
  summary: string[];
}

function gradeColor(grade: string) {
  const g = grade.charAt(0).toUpperCase();
  if (g === "A") return "text-green-400";
  if (g === "B") return "text-blue-400";
  if (g === "C") return "text-yellow-400";
  if (g === "D") return "text-orange-400";
  return "text-red-500";
}

function gradeBg(grade: string) {
  const g = grade.charAt(0).toUpperCase();
  if (g === "A") return "bg-green-400/10";
  if (g === "B") return "bg-blue-400/10";
  if (g === "C") return "bg-yellow-400/10";
  if (g === "D") return "bg-orange-400/10";
  return "bg-red-500/10";
}

export default function TeamResearchTabs({
  teamColor,
  teamName,
}: {
  teamColor: string;
  teamName: string;
}) {
  const [active, setActive] = useState<Tab>("coaching");
  const [offenseData, setOffenseData] = useState<OffenseData | null>(null);
  const [offenseLoading, setOffenseLoading] = useState(false);
  const [offenseError, setOffenseError] = useState(false);

  useEffect(() => {
    if (active !== "offense" || offenseData) return;
    setOffenseLoading(true);
    setOffenseError(false);
    fetch(`/api/team-research/offense?team=${encodeURIComponent(teamName)}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { setOffenseData(data); setOffenseLoading(false); })
      .catch(() => { setOffenseError(true); setOffenseLoading(false); });
  }, [active, teamName, offenseData]);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-800 bg-gray-900">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors ${
              active === tab.id
                ? "border-b-2 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
            style={active === tab.id ? { borderColor: teamColor } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4 py-6">

        {/* COACHING STAFF */}
        {active === "coaching" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <span className="text-5xl">🎙️</span>
            <h2 className="mt-4 text-lg font-bold text-white">Coming Soon</h2>
            <p className="mt-2 text-sm text-gray-400">Coaching staff info and breakdowns coming soon.</p>
          </div>
        )}

        {/* OFFENSE PLAYERS */}
        {active === "offense" && (
          <>
            {offenseLoading && (
              <div className="py-16 text-center text-sm text-gray-500">Loading...</div>
            )}
            {offenseError && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
                <p className="text-sm text-gray-400">No offense data available for this team yet.</p>
              </div>
            )}
            {offenseData && (
              <div className="flex flex-col gap-5">
                {/* Section title */}
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  {offenseData.sectionTitle}
                </h2>

                {/* Grades table */}
                <div className="overflow-hidden rounded-xl border border-gray-800">
                  {/* Header row */}
                  <div className="grid grid-cols-[1fr_3rem_auto] gap-0 border-b border-gray-800 bg-gray-900 px-4 py-2">
                    <span className="text-xs font-semibold text-gray-500">Category</span>
                    <span className="text-center text-xs font-semibold text-gray-500">Grade</span>
                    <span className="hidden text-xs font-semibold text-gray-500 sm:block">Notes</span>
                  </div>

                  {offenseData.rows.map((row, i) => (
                    <div
                      key={i}
                      className="border-b border-gray-800 last:border-0 bg-gray-900/50 px-4 py-3"
                    >
                      {/* Mobile: stacked */}
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{row.category}</span>
                        <span
                          className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${gradeColor(row.grade)} ${gradeBg(row.grade)}`}
                        >
                          {row.grade}
                        </span>
                      </div>
                      {row.notes && (
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{row.notes}</p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Overall rating */}
                {offenseData.rating && (
                  <div
                    className="rounded-xl border border-gray-700 px-4 py-3 text-center text-sm font-bold text-white"
                    style={{ backgroundColor: teamColor + "22", borderColor: teamColor + "55" }}
                  >
                    {offenseData.rating}
                  </div>
                )}

                {/* Summary paragraphs */}
                {offenseData.summary.length > 0 && (
                  <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
                    {offenseData.summary.map((para, i) => (
                      <p key={i} className="text-xs leading-relaxed text-gray-400">{para}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* DEFENSE PLAYERS */}
        {active === "defense" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <span className="text-5xl">🛡️</span>
            <h2 className="mt-4 text-lg font-bold text-white">Coming Soon</h2>
            <p className="mt-2 text-sm text-gray-400">Defensive player roster and breakdowns coming soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
