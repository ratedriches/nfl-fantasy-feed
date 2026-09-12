import { Redis } from "@upstash/redis";
import Anthropic from "@anthropic-ai/sdk";
import { getDraftRecap } from "@/lib/espnFantasy";

const LEAGUE_ID = process.env.ESPN_LEAGUE_ID ?? "";

function authCookie(): string | null {
  const s2 = process.env.ESPN_S2?.trim();
  const swid = process.env.ESPN_SWID?.trim();
  if (!s2 || !swid) return null;
  return `espn_s2=${s2}; SWID=${swid}`;
}

function isRedisConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

let redisClient: Redis | null = null;
function getRedis(): Redis | null {
  if (!isRedisConfigured()) return null;
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    });
  }
  return redisClient;
}

function analysisKey(year: number) {
  return `league:draftAnalysis:${year}`;
}

export function isDraftAnalysisConfigured(): boolean {
  return isRedisConfigured() && Boolean(authCookie()) && Boolean(LEAGUE_ID) && Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface TeamDraftAnalysis {
  teamId: number;
  teamName: string;
  ownerName: string;
  slot: number;
  bestPart: string;
  worstPart: string;
  grade: string;
  gradeNote: string;
}

export interface DraftAnalysis {
  year: number;
  generatedAt: number;
  round1Summary: string;
  teams: TeamDraftAnalysis[];
}

export async function getDraftAnalysis(): Promise<DraftAnalysis | null> {
  const redis = getRedis();
  if (!redis) return null;
  const year = Number(process.env.ESPN_SEASON ?? new Date().getFullYear());
  return redis.get<DraftAnalysis>(analysisKey(year));
}

async function fetchOwnerNames(): Promise<Map<number, { teamName: string; ownerName: string }>> {
  const cookie = authCookie();
  const season = process.env.ESPN_SEASON ?? "2025";
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?view=mTeam`;
  const res = await fetch(url, { headers: { Cookie: cookie ?? "" }, cache: "no-store" });
  const data = await res.json();

  const memberName = new Map<string, string>();
  for (const m of data.members ?? []) {
    const full = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
    memberName.set(m.id, full || m.displayName || "Unknown Owner");
  }

  const result = new Map<number, { teamName: string; ownerName: string }>();
  for (const t of data.teams ?? []) {
    const ownerId = t.primaryOwner ?? t.owners?.[0] ?? "";
    const name = t.name ?? `${t.location ?? ""} ${t.nickname ?? ""}`.trim() ?? `Team ${t.id}`;
    result.set(t.id, { teamName: name, ownerName: memberName.get(ownerId) ?? "Unknown Owner" });
  }
  return result;
}

// Claude often wraps JSON in a ```json fence despite instructions not to.
function extractJson(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return fenced ? fenced[1] : trimmed;
}

export async function buildAndStoreDraftAnalysis(): Promise<{ ok: boolean; reason?: string }> {
  if (!process.env.ANTHROPIC_API_KEY) return { ok: false, reason: "no_api_key" };
  const redis = getRedis();
  if (!redis) return { ok: false, reason: "no_redis" };

  const { picks, drafted, summary } = await getDraftRecap();
  if (!drafted || picks.length === 0 || !summary) return { ok: false, reason: "not_drafted" };

  const ownerNames = await fetchOwnerNames();

  const byTeam = new Map<number, typeof picks>();
  for (const p of picks) {
    if (!byTeam.has(p.teamId)) byTeam.set(p.teamId, []);
    byTeam.get(p.teamId)!.push(p);
  }

  const teamBlocks = Array.from(byTeam.entries()).map(([teamId, teamPicks]) => {
    const sorted = [...teamPicks].sort((a, b) => a.overallPickNumber - b.overallPickNumber);
    const slot = sorted[0]?.roundPick ?? 0;
    const owner = ownerNames.get(teamId);
    const pickLines = sorted
      .map(
        (p) =>
          `${p.round}.${p.roundPick} ${p.playerName} (${p.playerPosition}${p.playerProTeam ? `, ${p.playerProTeam}` : ""})${p.isKeeper ? " [KEEPER]" : ""}`
      )
      .join("\n");
    return { teamId, teamName: owner?.teamName ?? `Team ${teamId}`, ownerName: owner?.ownerName ?? "Unknown Owner", slot, pickLines };
  });

  const leagueFormat = `${summary.numTeams}-team league, ${summary.startingLineup.join(", ")} starting lineup, Full PPR, ${summary.waiverType}.`;

  const teamsPromptSection = teamBlocks
    .map((t) => `--- Team ${t.teamId}: "${t.teamName}" (owner: ${t.ownerName}, slot ${t.slot}) ---\n${t.pickLines}`)
    .join("\n\n");

  const client = new Anthropic();
  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 16000,
    system: `You are a sharp, opinionated fantasy football draft analyst grading every team in a real league's just-finished draft. Use ONLY the real players, rounds, and picks given below — never invent a player, stat, or ADP figure. Each pick below is already labeled "Round.PickInRound" (e.g. "3.9" means round 3, the 9th pick of that round — NOT the overall pick number). When you reference a pick, copy that exact "Round.PickInRound" label verbatim from the data — do not compute or substitute the overall pick number. League format: ${leagueFormat}

For EACH team, write:
- "bestPart": 3-5 sentences on the strongest part of their draft/roster, citing specific real picks by name and pick number.
- "worstPart": 3-5 sentences on the weakest part or biggest risk, citing specific real picks.
- "grade": a letter grade (A+ through F, plus/minus allowed).
- "gradeNote": one punchy sentence explaining the grade.

Grade teams relative to each other, not in isolation — calibrate so grades actually differentiate the best and worst drafts in this league.

Also write "round1Summary": 1-2 sentences on how round 1 unfolded overall (position runs, notable picks, reaches or falls).

Respond with ONLY this JSON shape, nothing else, no markdown fences:
{"round1Summary": "...", "teams": [{"teamId": <number>, "bestPart": "...", "worstPart": "...", "grade": "...", "gradeNote": "..."}]}
Include exactly one entry per team listed below, using the exact teamId numbers given.`,
    messages: [{ role: "user", content: teamsPromptSection }],
  });

  const response = await stream.finalMessage();
  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) return { ok: false, reason: "no_response" };

  let parsed: { round1Summary?: string; teams?: any[] };
  try {
    parsed = JSON.parse(extractJson(textBlock.text));
  } catch {
    return { ok: false, reason: "bad_json" };
  }
  if (!parsed.round1Summary || !Array.isArray(parsed.teams)) return { ok: false, reason: "incomplete_response" };

  const teamMetaById = new Map(teamBlocks.map((t) => [t.teamId, t]));
  const teams: TeamDraftAnalysis[] = parsed.teams
    .map((t) => {
      const meta = teamMetaById.get(t.teamId);
      if (!meta) return null;
      return {
        teamId: t.teamId,
        teamName: meta.teamName,
        ownerName: meta.ownerName,
        slot: meta.slot,
        bestPart: t.bestPart ?? "",
        worstPart: t.worstPart ?? "",
        grade: t.grade ?? "",
        gradeNote: t.gradeNote ?? "",
      };
    })
    .filter((t): t is TeamDraftAnalysis => t !== null)
    .sort((a, b) => a.slot - b.slot);

  const analysis: DraftAnalysis = {
    year: summary.year,
    generatedAt: Date.now(),
    round1Summary: parsed.round1Summary,
    teams,
  };

  await redis.set(analysisKey(summary.year), JSON.stringify(analysis));
  return { ok: true };
}
