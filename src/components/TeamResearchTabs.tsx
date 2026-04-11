"use client";

import { useState, useEffect } from "react";

type Tab = "coaching" | "offense" | "defense";

const TABS: { id: Tab; label: string }[] = [
  { id: "coaching", label: "Coaching Staff" },
  { id: "offense",  label: "Offense Players" },
  { id: "defense",  label: "Defense Players" },
];

interface RosterData {
  sectionTitle?: string;
  rows: { category: string; grade?: string; notes?: string; score?: string }[];
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

function scoreColor(score: string) {
  const n = parseFloat(score);
  if (isNaN(n)) return "text-gray-400";
  if (n >= 8) return "text-green-400";
  if (n >= 6) return "text-blue-400";
  if (n >= 4) return "text-yellow-400";
  return "text-orange-400";
}

function scoreBg(score: string) {
  const n = parseFloat(score);
  if (isNaN(n)) return "bg-gray-700/30";
  if (n >= 8) return "bg-green-400/10";
  if (n >= 6) return "bg-blue-400/10";
  if (n >= 4) return "bg-yellow-400/10";
  return "bg-orange-400/10";
}

function RatingBar({
  teamColor,
  rating,
}: {
  teamColor: string;
  rating: string;
}) {
  return (
    <div
      className="rounded-xl border px-4 py-3 text-center text-sm font-bold text-white"
      style={{ backgroundColor: teamColor + "22", borderColor: teamColor + "55" }}
    >
      {rating}
    </div>
  );
}

function SummaryBlock({ summary }: { summary: string[] }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4">
      {summary.map((para, i) => (
        <p key={i} className="text-xs leading-relaxed text-gray-400">{para}</p>
      ))}
    </div>
  );
}

export default function TeamResearchTabs({
  teamColor,
  teamName,
}: {
  teamColor: string;
  teamName: string;
}) {
  const [active, setActive] = useState<Tab>("coaching");

  const [coachingData, setCoachingData] = useState<RosterData | null>(null);
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [coachingError, setCoachingError] = useState(false);

  const [offenseData, setOffenseData] = useState<RosterData | null>(null);
  const [offenseLoading, setOffenseLoading] = useState(false);
  const [offenseError, setOffenseError] = useState(false);

  const [defenseData, setDefenseData] = useState<RosterData | null>(null);
  const [defenseLoading, setDefenseLoading] = useState(false);
  const [defenseError, setDefenseError] = useState(false);

  useEffect(() => {
    if (active !== "coaching" || coachingData) return;
    setCoachingLoading(true);
    setCoachingError(false);
    fetch(`/api/team-research/coaching?team=${encodeURIComponent(teamName)}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { setCoachingData(data); setCoachingLoading(false); })
      .catch(() => { setCoachingError(true); setCoachingLoading(false); });
  }, [active, teamName, coachingData]);

  useEffect(() => {
    if (active !== "offense" || offenseData) return;
    setOffenseLoading(true);
    setOffenseError(false);
    fetch(`/api/team-research/offense?team=${encodeURIComponent(teamName)}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { setOffenseData(data); setOffenseLoading(false); })
      .catch(() => { setOffenseError(true); setOffenseLoading(false); });
  }, [active, teamName, offenseData]);

  useEffect(() => {
    if (active !== "defense" || defenseData) return;
    setDefenseLoading(true);
    setDefenseError(false);
    fetch(`/api/team-research/defense?team=${encodeURIComponent(teamName)}`)
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((data) => { setDefenseData(data); setDefenseLoading(false); })
      .catch(() => { setDefenseError(true); setDefenseLoading(false); });
  }, [active, teamName, defenseData]);

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
          <>
            {coachingLoading && (
              <div className="py-16 text-center text-sm text-gray-500">Loading...</div>
            )}
            {coachingError && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
                <p className="text-sm text-gray-400">No coaching staff data available for this team yet.</p>
              </div>
            )}
            {coachingData && (
              <div className="flex flex-col gap-5">
                <div className="overflow-hidden rounded-xl border border-gray-800">
                  <div className="grid grid-cols-[1fr_4rem] border-b border-gray-800 bg-gray-900 px-4 py-2">
                    <span className="text-xs font-semibold text-gray-500">Category</span>
                    <span className="text-center text-xs font-semibold text-gray-500">Score</span>
                  </div>
                  {coachingData.rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-[1fr_4rem] items-center border-b border-gray-800 last:border-0 bg-gray-900/50 px-4 py-3">
                      <span className="text-sm font-semibold text-white">{row.category}</span>
                      <div className="flex justify-center">
                        {row.score ? (
                          <span className={`rounded-md px-2 py-0.5 text-xs font-bold ${scoreColor(row.score)} ${scoreBg(row.score)}`}>
                            {row.score}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {coachingData.rating && <RatingBar teamColor={teamColor} rating={coachingData.rating} />}
                {coachingData.summary.length > 0 && <SummaryBlock summary={coachingData.summary} />}
              </div>
            )}
          </>
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
                {offenseData.sectionTitle && (
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {offenseData.sectionTitle}
                  </h2>
                )}
                <div className="overflow-hidden rounded-xl border border-gray-800">
                  <div className="grid grid-cols-[1fr_3rem] border-b border-gray-800 bg-gray-900 px-4 py-2">
                    <span className="text-xs font-semibold text-gray-500">Category</span>
                    <span className="text-center text-xs font-semibold text-gray-500">Grade</span>
                  </div>
                  {offenseData.rows.map((row, i) => (
                    <div key={i} className="border-b border-gray-800 last:border-0 bg-gray-900/50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{row.category}</span>
                        {row.grade && (
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${gradeColor(row.grade)} ${gradeBg(row.grade)}`}>
                            {row.grade}
                          </span>
                        )}
                      </div>
                      {row.notes && (
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{row.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
                {offenseData.rating && <RatingBar teamColor={teamColor} rating={offenseData.rating} />}
                {offenseData.summary.length > 0 && <SummaryBlock summary={offenseData.summary} />}
              </div>
            )}
          </>
        )}

        {/* DEFENSE PLAYERS */}
        {active === "defense" && (
          <>
            {defenseLoading && (
              <div className="py-16 text-center text-sm text-gray-500">Loading...</div>
            )}
            {defenseError && (
              <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
                <p className="text-sm text-gray-400">No defense data available for this team yet.</p>
              </div>
            )}
            {defenseData && (
              <div className="flex flex-col gap-5">
                {defenseData.sectionTitle && (
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                    {defenseData.sectionTitle}
                  </h2>
                )}
                <div className="overflow-hidden rounded-xl border border-gray-800">
                  <div className="grid grid-cols-[1fr_3rem] border-b border-gray-800 bg-gray-900 px-4 py-2">
                    <span className="text-xs font-semibold text-gray-500">Category</span>
                    <span className="text-center text-xs font-semibold text-gray-500">Grade</span>
                  </div>
                  {defenseData.rows.map((row, i) => (
                    <div key={i} className="border-b border-gray-800 last:border-0 bg-gray-900/50 px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm font-semibold text-white">{row.category}</span>
                        {row.grade && (
                          <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${gradeColor(row.grade)} ${gradeBg(row.grade)}`}>
                            {row.grade}
                          </span>
                        )}
                      </div>
                      {row.notes && (
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{row.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
                {defenseData.rating && <RatingBar teamColor={teamColor} rating={defenseData.rating} />}
                {defenseData.summary.length > 0 && <SummaryBlock summary={defenseData.summary} />}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
