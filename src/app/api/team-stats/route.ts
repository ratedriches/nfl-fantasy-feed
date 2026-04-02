import { getAllTeamStats } from "@/lib/espn";

export async function GET() {
  const teams = await getAllTeamStats();
  return Response.json(teams);
}
