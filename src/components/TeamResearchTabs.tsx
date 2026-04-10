"use client";

import { useState } from "react";

type Tab = "coaching" | "offense" | "defense";

const TABS: { id: Tab; label: string }[] = [
  { id: "coaching", label: "Coaching Staff" },
  { id: "offense",  label: "Offense Players" },
  { id: "defense",  label: "Defense Players" },
];

export default function TeamResearchTabs({ teamColor }: { teamColor: string }) {
  const [active, setActive] = useState<Tab>("coaching");

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
      <div className="px-4 py-8">
        {active === "coaching" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <span className="text-5xl">🎙️</span>
            <h2 className="mt-4 text-lg font-bold text-white">Coming Soon</h2>
            <p className="mt-2 text-sm text-gray-400">
              Coaching staff info and breakdowns coming soon.
            </p>
          </div>
        )}
        {active === "offense" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <span className="text-5xl">🏈</span>
            <h2 className="mt-4 text-lg font-bold text-white">Coming Soon</h2>
            <p className="mt-2 text-sm text-gray-400">
              Offensive player roster and breakdowns coming soon.
            </p>
          </div>
        )}
        {active === "defense" && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
            <span className="text-5xl">🛡️</span>
            <h2 className="mt-4 text-lg font-bold text-white">Coming Soon</h2>
            <p className="mt-2 text-sm text-gray-400">
              Defensive player roster and breakdowns coming soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
