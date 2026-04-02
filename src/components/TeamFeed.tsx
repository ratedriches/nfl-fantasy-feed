"use client";

import { useState } from "react";
import type { BeatWriter } from "@/data/teams";
import type { Tweet } from "@/data/mockTweets";
import TweetCard from "@/components/TweetCard";

export default function TeamFeed({
  beatWriters,
  tweets,
  teamColor,
}: {
  beatWriters: BeatWriter[];
  tweets: Tweet[];
  teamColor: string;
}) {
  const [activeHandle, setActiveHandle] = useState<string | null>(null);

  const filtered =
    activeHandle === null
      ? tweets
      : tweets.filter((t) => t.authorHandle === activeHandle);

  return (
    <>
      {/* Beat writer filter chips */}
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-2.5">
        <div className="flex flex-wrap gap-2">
          {/* "All" chip */}
          <button
            onClick={() => setActiveHandle(null)}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              activeHandle === null
                ? "border-transparent text-white"
                : "border-gray-700 bg-gray-800 text-gray-400"
            }`}
            style={
              activeHandle === null
                ? { backgroundColor: teamColor, borderColor: teamColor }
                : {}
            }
          >
            All
          </button>

          {beatWriters.map((writer) => {
            const isActive = activeHandle === writer.handle;
            return (
              <button
                key={writer.handle}
                onClick={() =>
                  setActiveHandle(isActive ? null : writer.handle)
                }
                className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  isActive
                    ? "border-transparent text-white"
                    : "border-gray-700 bg-gray-800 text-gray-400"
                }`}
                style={
                  isActive
                    ? { backgroundColor: teamColor, borderColor: teamColor }
                    : {}
                }
              >
                {writer.name}
                <span className={isActive ? "text-white/70" : "text-gray-600"}>
                  {" "}
                  · {writer.outlet}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tweets */}
      <main className="px-4 py-4">
        {filtered.length === 0 ? (
          <p className="py-10 text-center text-gray-500">No tweets found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((tweet) => (
              <TweetCard key={tweet.id} tweet={tweet} teamColor={teamColor} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
