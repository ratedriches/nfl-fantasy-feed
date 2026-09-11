// Temporary diagnostic route — remove once the production ESPN fetch issue is resolved.
export async function GET() {
  const s2 = process.env.ESPN_S2;
  const swid = process.env.ESPN_SWID;
  const leagueId = process.env.ESPN_LEAGUE_ID;
  const season = process.env.ESPN_SEASON;

  if (!s2 || !swid || !leagueId) {
    return Response.json({ error: "missing env vars", hasS2: !!s2, hasSwid: !!swid, hasLeagueId: !!leagueId });
  }

  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${leagueId}?view=mTeam`;
  try {
    const res = await fetch(url, {
      headers: { Cookie: `espn_s2=${s2}; SWID=${swid}` },
      cache: "no-store",
    });
    const text = await res.text();
    return Response.json({
      status: res.status,
      contentType: res.headers.get("content-type"),
      bodyPreview: text.slice(0, 300),
      s2Length: s2.length,
      swidLength: swid.length,
      swidHasBraces: swid.startsWith("{") && swid.endsWith("}"),
    });
  } catch (e) {
    return Response.json({ error: String(e) });
  }
}
