import { getTeamInjuryReport } from "@/lib/injuries";
import { TEAM_ID_TO_ABBREV } from "@/lib/espn";
import { teams } from "@/data/teams";

const ABBREV_TO_ESPN_ID: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_ID_TO_ABBREV).map(([id, abbrev]) => [abbrev.toLowerCase(), id])
);

export async function GET(_req: Request, { params }: { params: Promise<{ team: string }> }) {
  const { team: slug } = await params;
  const team = teams.find((t) => t.slug === slug);
  if (!team) return Response.json({ error: "Unknown team" }, { status: 404 });

  const espnId = ABBREV_TO_ESPN_ID[team.abbrev.toLowerCase()];
  if (!espnId) return Response.json({ error: "No ESPN team mapping" }, { status: 404 });

  const report = await getTeamInjuryReport(Number(espnId));
  return Response.json({ teamName: team.name, report });
}
