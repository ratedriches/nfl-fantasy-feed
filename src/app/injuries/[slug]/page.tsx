import Link from "next/link";
import { notFound } from "next/navigation";
import { teams } from "@/data/teams";
import TeamInjuryReportClient from "@/components/TeamInjuryReportClient";

export default async function TeamInjuryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const team = teams.find((t) => t.slug === slug);
  if (!team) notFound();

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 px-4 pt-4 pb-4" style={{ backgroundColor: team.primaryColor + "22" }}>
        <Link href="/injuries" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 active:text-white">
          ← Injury Report
        </Link>
        <div className="flex items-center gap-3">
          <img
            src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev}.png`}
            alt={team.name}
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-white">{team.name}</h1>
            <p className="text-xs text-gray-400">Injury Report</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-5">
        <TeamInjuryReportClient slug={slug} />
      </main>
    </div>
  );
}
