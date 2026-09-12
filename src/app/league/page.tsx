import Link from "next/link";

export default function LeaguePage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Home
        </Link>
        <h1 className="text-xl font-bold text-white">Rated R League</h1>
        <p className="mt-0.5 text-xs text-gray-400">Your ESPN fantasy league</p>
      </header>

      <main className="px-4 py-6">
        <div className="flex flex-col gap-4">
          <Link
            href="/league/standings"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">🏆</span>
            <div>
              <h2 className="text-lg font-bold text-white">Standings</h2>
              <p className="mt-0.5 text-sm text-gray-400">Current league rankings and records</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/scores"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">📅</span>
            <div>
              <h2 className="text-lg font-bold text-white">Scores</h2>
              <p className="mt-0.5 text-sm text-gray-400">Weekly matchups and results</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/chat"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">💬</span>
            <div>
              <h2 className="text-lg font-bold text-white">Chat Room</h2>
              <p className="mt-0.5 text-sm text-gray-400">Message board, with AI bots chiming in</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/recaps"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">📰</span>
            <div>
              <h2 className="text-lg font-bold text-white">Weekly Recap</h2>
              <p className="mt-0.5 text-sm text-gray-400">How each week&apos;s matchups unfolded</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/power-rankings"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">📈</span>
            <div>
              <h2 className="text-lg font-bold text-white">Power Rankings</h2>
              <p className="mt-0.5 text-sm text-gray-400">All-play record + recent form</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/transactions"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">🔄</span>
            <div>
              <h2 className="text-lg font-bold text-white">Recent Transactions</h2>
              <p className="mt-0.5 text-sm text-gray-400">Waivers, free agents, and trades</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/draft"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">📋</span>
            <div>
              <h2 className="text-lg font-bold text-white">Draft Recap</h2>
              <p className="mt-0.5 text-sm text-gray-400">Every pick from this season&apos;s draft</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/history"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">📜</span>
            <div>
              <h2 className="text-lg font-bold text-white">League History</h2>
              <p className="mt-0.5 text-sm text-gray-400">All-time records by owner, 2013–2025</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/champions"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">👑</span>
            <div>
              <h2 className="text-lg font-bold text-white">Championship History</h2>
              <p className="mt-0.5 text-sm text-gray-400">Champion, runner-up, and 3rd place by year</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>

          <Link
            href="/league/records"
            className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
          >
            <span className="text-4xl">📚</span>
            <div>
              <h2 className="text-lg font-bold text-white">Record Book</h2>
              <p className="mt-0.5 text-sm text-gray-400">Top scores, closest games, position records</p>
            </div>
            <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
