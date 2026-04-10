import Link from "next/link";

export default function TeamResearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-5">
        <Link href="/" className="mb-2 inline-block text-xs text-gray-500 hover:text-gray-300">
          ← Home
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">Team Research</h1>
        <p className="mt-0.5 text-xs text-gray-400">In-depth scouting and roster breakdowns</p>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-4 px-4 py-8">
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center">
          <span className="text-5xl">🔍</span>
          <h2 className="mt-4 text-lg font-bold text-white">Coming Soon</h2>
          <p className="mt-2 text-sm text-gray-400">
            Team Research is under construction. Check back soon for roster breakdowns, coaching staff info, and more.
          </p>
        </div>
      </main>
    </div>
  );
}
