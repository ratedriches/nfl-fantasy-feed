import Link from "next/link";
import NavTabs from "@/components/NavTabs";

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <h1 className="text-xl font-bold tracking-tight text-white">🏈 NFL Fantasy Feed</h1>
        <p className="mt-0.5 text-xs text-gray-400">Beat writers & stats for all 32 teams</p>
      </header>

      <NavTabs />

      <main className="px-4 py-6">
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-gray-500">
          2025 Season Stats
        </p>
        <div className="flex flex-col gap-4">
          <Link
            href="/stats/teams"
            className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-5 active:scale-95 transition-transform"
          >
            <div className="mb-3 text-3xl">🏟️</div>
            <h2 className="text-lg font-bold text-white">Team Stats</h2>
            <p className="mt-1 text-sm text-gray-400">
              Offensive & defensive stats for all 32 teams — yards, points, sacks, turnovers and more.
            </p>
            <span className="mt-4 inline-block text-xs font-medium text-gray-500 group-hover:text-gray-300">
              View →
            </span>
          </Link>

          <Link
            href="/stats/players"
            className="group relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-5 active:scale-95 transition-transform"
          >
            <div className="mb-3 text-3xl">🏃</div>
            <h2 className="text-lg font-bold text-white">Player Stats</h2>
            <p className="mt-1 text-sm text-gray-400">
              Individual leaders by position — QB, RB, WR/TE, and defensive players.
            </p>
            <span className="mt-4 inline-block text-xs font-medium text-gray-500 group-hover:text-gray-300">
              View →
            </span>
          </Link>
        </div>
      </main>
    </div>
  );
}
