import Link from "next/link";
import LeagueRecapDetailClient from "@/components/LeagueRecapDetailClient";

export default async function LeagueRecapDetailPage({ params }: { params: Promise<{ year: string; week: string }> }) {
  const { year, week } = await params;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/league/recaps" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Weekly Recaps
        </Link>
      </header>

      <main className="px-4 py-6">
        <LeagueRecapDetailClient year={Number(year)} week={Number(week)} />
      </main>
    </div>
  );
}
