import { getRecap, isRecapConfigured } from "@/lib/weeklyRecap";

export async function GET(_req: Request, { params }: { params: Promise<{ year: string; week: string }> }) {
  if (!isRecapConfigured()) {
    return Response.json({ configured: false, recap: null });
  }
  const { year, week } = await params;
  const recap = await getRecap(Number(year), Number(week));
  return Response.json({ configured: true, recap });
}
