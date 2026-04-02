import Link from "next/link";
import { getPlayerLeaders } from "@/lib/espn";
import PlayerStatsTabs from "@/components/PlayerStatsTabs";

export const revalidate = 3600;

export default async function PlayerStatsPage() {
  const categories = await getPlayerLeaders();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/stats" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← NFL Stats
        </Link>
        <h1 className="text-xl font-bold text-white">Player Stats</h1>
        <p className="mt-0.5 text-xs text-gray-400">2025 NFL Season</p>
      </header>

      <main className="px-4 py-5">
        {categories.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-400">Unable to load player stats.</p>
            <p className="mt-1 text-xs text-gray-600">ESPN API may be unavailable. Try again later.</p>
          </div>
        ) : (
          <PlayerStatsTabs categories={categories} />
        )}
      </main>
    </div>
  );
}
