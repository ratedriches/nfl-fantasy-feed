import Link from "next/link";
import { notFound } from "next/navigation";
import { teams } from "@/data/teams";
import { getTweetsForTeam } from "@/lib/twitter";
import TeamFeed from "@/components/TeamFeed";

// Tweets are fetched (or served from a short-lived cache) per request, so
// this route can't be statically generated at build time.
export const dynamic = "force-dynamic";

export default async function TeamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const team = teams.find((t) => t.slug === slug);
  if (!team) notFound();

  const tweets = (await getTweetsForTeam(team)).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header
        className="border-b border-gray-800 px-4 pt-4 pb-4"
        style={{ backgroundColor: team.primaryColor + "22" }}
      >
        <Link
          href="/beat-writers"
          className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 active:text-white"
        >
          ← Beat Writers
        </Link>
        <div className="flex items-center gap-3">
          <img
            src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev}.png`}
            alt={team.name}
            className="h-12 w-12 object-contain"
          />
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">{team.name}</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {team.beatWriters.map((w) => w.name).join(" · ")}
            </p>
          </div>
        </div>
      </header>

      <TeamFeed
        beatWriters={team.beatWriters}
        tweets={tweets}
        teamColor={team.primaryColor}
      />
    </div>
  );
}
