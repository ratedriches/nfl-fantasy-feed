"use client";

import { useState } from "react";
import Link from "next/link";
import { teams } from "@/data/teams";
import SearchResults from "@/components/SearchResults";
import NavTabs from "@/components/NavTabs";

export default function Home() {
  const [query, setQuery] = useState("");

  const divisions = [
    { name: "AFC East", teams: ["buffalo-bills", "miami-dolphins", "new-england-patriots", "new-york-jets"] },
    { name: "AFC North", teams: ["baltimore-ravens", "cincinnati-bengals", "cleveland-browns", "pittsburgh-steelers"] },
    { name: "AFC South", teams: ["houston-texans", "indianapolis-colts", "jacksonville-jaguars", "tennessee-titans"] },
    { name: "AFC West", teams: ["denver-broncos", "kansas-city-chiefs", "las-vegas-raiders", "los-angeles-chargers"] },
    { name: "NFC East", teams: ["dallas-cowboys", "new-york-giants", "philadelphia-eagles", "washington-commanders"] },
    { name: "NFC North", teams: ["chicago-bears", "detroit-lions", "green-bay-packers", "minnesota-vikings"] },
    { name: "NFC South", teams: ["atlanta-falcons", "carolina-panthers", "new-orleans-saints", "tampa-bay-buccaneers"] },
    { name: "NFC West", teams: ["arizona-cardinals", "los-angeles-rams", "san-francisco-49ers", "seattle-seahawks"] },
  ];

  const teamsBySlug = Object.fromEntries(teams.map((t) => [t.slug, t]));
  const isSearching = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* App header */}
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight text-white">🏈 NFL Fantasy Feed</h1>
        <p className="mt-0.5 text-xs text-gray-400">Beat writers & stats for all 32 teams</p>
      </header>

      {/* Tab nav */}
      <NavTabs />

      {/* Search bar */}
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search player or coach name..."
            className="w-full rounded-xl border border-gray-700 bg-gray-800 py-2.5 pl-9 pr-10 text-sm text-white placeholder-gray-500 outline-none focus:border-gray-500"
          />
          {isSearching && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-5">
        {isSearching ? (
          <SearchResults query={query} />
        ) : (
          <div className="flex flex-col gap-6">
            {divisions.map((division) => (
              <div key={division.name}>
                <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                  {division.name}
                </h2>
                <div className="grid grid-cols-2 gap-2.5">
                  {division.teams.map((slug) => {
                    const team = teamsBySlug[slug];
                    if (!team) return null;
                    return (
                      <Link
                        key={slug}
                        href={`/team/${slug}`}
                        className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-3 active:scale-95 transition-transform"
                      >
                        <div
                          className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                          style={{ backgroundColor: team.primaryColor }}
                        />
                        <div className="pl-2">
                          <img
                            src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev}.png`}
                            alt={team.name}
                            className="mb-2 h-9 w-9 object-contain"
                          />
                          <p className="text-xs font-semibold leading-tight text-white">
                            {team.name}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500">
                            {team.beatWriters.length} writers
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
