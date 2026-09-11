import Link from "next/link";
import LeagueChampionsClient from "@/components/LeagueChampionsClient";

export default function LeagueChampionsPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/league" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Rated R League
        </Link>
        <h1 className="text-xl font-bold text-white">Championship Winners</h1>
      </header>

      <main className="px-4 py-6">
        <LeagueChampionsClient />
      </main>
    </div>
  );
}
