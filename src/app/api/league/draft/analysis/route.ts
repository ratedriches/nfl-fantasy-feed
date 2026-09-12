import { getDraftAnalysis, isDraftAnalysisConfigured } from "@/lib/draftAnalysis";

export async function GET() {
  if (!isDraftAnalysisConfigured()) {
    return Response.json({ configured: false, analysis: null });
  }
  const analysis = await getDraftAnalysis();
  return Response.json({ configured: true, analysis });
}
