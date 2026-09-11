import { getTransactions, isLeagueConfigured } from "@/lib/espnFantasy";

export async function GET() {
  if (!isLeagueConfigured()) {
    return Response.json({ configured: false, transactions: [] });
  }
  const transactions = await getTransactions();
  return Response.json({ configured: true, transactions });
}
