import Link from "next/link";
import { notFound } from "next/navigation";
import { teams } from "@/data/teams";
import TeamResearchTabs from "@/components/TeamResearchTabs";

export async function generateStaticParams() {
  return teams.map((team) => ({ slug: team.slug }));
}

export default async function TeamResearchTeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const team = teams.find((t) => t.slug === slug);
  if (!team) notFound();

  return (
    <div className="min-h-screen bg-gray-950">
      <header
        className="border-b border-gray-800 px-4 pt-4 pb-4"
        style={{ backgroundColor: team.primaryColor + "22" }}
      >
        <Link
          href="/team-research"
          className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 active:text-white"
        >
          ← Team Research
        </Link>
        <div className="flex items-center gap-3">
          <img
            src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev}.png`}
            alt={team.name}
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">{team.name}</h1>
          </div>
        </div>
      </header>

      <main>
        <TeamResearchTabs teamColor={team.primaryColor} />
      </main>
    </div>
  );
}
