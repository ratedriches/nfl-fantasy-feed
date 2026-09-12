import { getRecapIndex, isRecapConfigured } from "@/lib/weeklyRecap";

export async function GET() {
  if (!isRecapConfigured()) {
    return Response.json({ configured: false, recaps: [] });
  }
  const recaps = await getRecapIndex();
  return Response.json({ configured: true, recaps });
}
