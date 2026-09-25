// Temporary diagnostic route — remove once the production player-stats
// empty-response issue is understood.
export async function GET() {
  const targets = [
    "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/leaders?limit=5",
    "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/athletes/4360689?lang=en&region=us",
    "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/athletes/4360689/statistics/0?lang=en&region=us",
  ];

  const results = await Promise.all(
    targets.map(async (url) => {
      try {
        const res = await fetch(url, { next: { revalidate: 0 } });
        const text = await res.text();
        return { url, status: res.status, contentType: res.headers.get("content-type"), bodyPreview: text.slice(0, 200) };
      } catch (e) {
        return { url, error: String(e) };
      }
    })
  );

  // Also try a burst of 30 concurrent, like the real route does at scale.
  let burstOk = 0;
  let burstFail: any[] = [];
  try {
    const leadersRes = await fetch(
      "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/2026/types/2/leaders?limit=100",
      { next: { revalidate: 0 } }
    );
    const leadersData = await leadersRes.json();
    const cat = leadersData.categories?.find((c: any) => c.name === "receivingYards");
    const refs: string[] = (cat?.leaders ?? []).slice(0, 60).map((l: any) => l.athlete?.$ref).filter(Boolean);
    const burst = await Promise.all(
      refs.map(async (r) => {
        try {
          const res = await fetch(r, { next: { revalidate: 0 } });
          return { ok: res.ok, status: res.status };
        } catch (e) {
          return { ok: false, error: String(e) };
        }
      })
    );
    burstOk = burst.filter((b) => b.ok).length;
    burstFail = burst.filter((b) => !b.ok).slice(0, 5);
  } catch (e) {
    burstFail = [{ topLevelError: String(e) }];
  }

  return Response.json({ results, burst: { total: 60, ok: burstOk, sampleFailures: burstFail } });
}
