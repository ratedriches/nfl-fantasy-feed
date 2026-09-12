import { getRecordBook, isRecordBookConfigured } from "@/lib/recordBook";

export async function GET() {
  if (!isRecordBookConfigured()) {
    return Response.json({ configured: false, recordBook: null });
  }
  const recordBook = await getRecordBook();
  return Response.json({ configured: true, recordBook });
}
