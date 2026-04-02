import Link from "next/link";
import TeamStatsClient from "@/components/TeamStatsClient";

export default function TeamStatsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/stats" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← NFL Stats
        </Link>
        <h1 className="text-xl font-bold text-white">Team Stats</h1>
        <p className="mt-0.5 text-xs text-gray-400">2025 NFL Season</p>
      </header>

      <main className="px-4 py-5">
        <TeamStatsClient />
      </main>
    </div>
  );
}
