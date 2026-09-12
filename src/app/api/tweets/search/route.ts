import { teams } from "@/data/teams";
import { getCachedTweetsForTeam } from "@/lib/twitter";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!query) return Response.json({ results: [] });

  const perTeam = await Promise.all(
    teams.map(async (team) => {
      const tweets = await getCachedTweetsForTeam(team);
      return tweets
        .filter((t) => t.content.toLowerCase().includes(query))
        .map((t) => ({ ...t, teamSlug: team.slug }));
    })
  );

  const results = perTeam
    .flat()
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return Response.json({ results });
}
