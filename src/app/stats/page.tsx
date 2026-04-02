import Link from "next/link";

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Home
        </Link>
        <h1 className="text-xl font-bold text-white">NFL Stats</h1>
        <p className="mt-0.5 text-xs text-gray-400">2025 season</p>
      </header>

      <main className="px-4 py-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/stats/teams"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">🏟️</span>
            <div>
              <h2 className="text-lg font-bold text-white">Team Stats</h2>
              <p className="mt-0.5 text-sm text-gray-400">
                Offense & defense for all 32 teams
              </p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/stats/players"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">🏃</span>
            <div>
              <h2 className="text-lg font-bold text-white">Player Stats</h2>
              <p className="mt-0.5 text-sm text-gray-400">
                Leaders by position — QB, RB, WR/TE, Defense
              </p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
