import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-5">
        <h1 className="text-2xl font-bold tracking-tight text-white">🏈 NFL Fantasy Feed</h1>
        <p className="mt-0.5 text-xs text-gray-400">Your edge for the 2025 season</p>
      </header>

      {/* Two main nav cards */}
      <main className="flex flex-1 flex-col justify-center gap-4 px-4 py-8">
        <Link
          href="/beat-writers"
          className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
        >
          <span className="text-4xl">📰</span>
          <div>
            <h2 className="text-lg font-bold text-white">Beat Writers</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              Latest tweets from reporters covering all 32 teams
            </p>
          </div>
          <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
        </Link>

        <Link
          href="/stats"
          className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
        >
          <span className="text-4xl">📊</span>
          <div>
            <h2 className="text-lg font-bold text-white">NFL Stats</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              2025 season team and player statistics
            </p>
          </div>
          <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
        </Link>
      </main>
    </div>
  );
}
