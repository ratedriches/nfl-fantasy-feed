"use client";

import Link from "next/link";
import { teams } from "@/data/teams";
import { mockTweetsByTeam, type Tweet } from "@/data/mockTweets";

function highlight(text: string, query: string) {
  if (!query) return <>{text}</>;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="rounded bg-yellow-400 px-0.5 text-gray-950">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function timeAgo(timestamp: string): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
}

const teamBySlug = Object.fromEntries(teams.map((t) => [t.slug, t]));

type Result = Tweet & { teamSlug: string };

export default function SearchResults({ query }: { query: string }) {
  const trimmed = query.trim();

  if (!trimmed) return null;

  const results: Result[] = [];

  for (const [slug, tweets] of Object.entries(mockTweetsByTeam)) {
    for (const tweet of tweets) {
      if (tweet.content.toLowerCase().includes(trimmed.toLowerCase())) {
        results.push({ ...tweet, teamSlug: slug });
      }
    }
  }

  results.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  if (results.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-500">
        No tweets mention &ldquo;{trimmed}&rdquo;
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-500">
        {results.length} tweet{results.length !== 1 ? "s" : ""} mentioning &ldquo;{trimmed}&rdquo;
      </p>
      {results.map((tweet) => {
        const team = teamBySlug[tweet.teamSlug];
        if (!team) return null;
        return (
          <Link
            key={tweet.id}
            href={`/team/${tweet.teamSlug}`}
            className="block rounded-xl border border-gray-800 bg-gray-900 p-3.5 active:bg-gray-800"
          >
            {/* Team + author row */}
            <div className="mb-2 flex items-center gap-2">
              <img
                src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev}.png`}
                alt={team.name}
                className="h-5 w-5 object-contain"
              />
              <span className="text-xs font-semibold text-gray-300">
                {team.name}
              </span>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-500">{tweet.authorName}</span>
              <span className="ml-auto shrink-0 text-xs text-gray-600">
                {timeAgo(tweet.timestamp)}
              </span>
            </div>

            {/* Tweet content with highlight */}
            <p className="text-sm leading-relaxed text-gray-200">
              {highlight(tweet.content, trimmed)}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
