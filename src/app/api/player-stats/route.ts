import { getPlayerLeaders } from "@/lib/espn";

export async function GET() {
  const categories = await getPlayerLeaders();
  return Response.json(categories);
}
