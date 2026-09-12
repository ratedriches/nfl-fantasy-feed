import { getLeagueMatchups, getDraftRecap, isLeagueConfigured } from "@/lib/espnFantasy";
import { getMessages, type ChatMessage } from "@/lib/leagueChat";

const LEAGUE_ID = process.env.ESPN_LEAGUE_ID ?? "";

function authCookie(): string | null {
  const s2 = process.env.ESPN_S2?.trim();
  const swid = process.env.ESPN_SWID?.trim();
  if (!s2 || !swid) return null;
  return `espn_s2=${s2}; SWID=${swid}`;
}

async function fetchOwnerNames(): Promise<Map<number, string>> {
  const cookie = authCookie();
  if (!cookie || !LEAGUE_ID) return new Map();
  const season = process.env.ESPN_SEASON ?? "2025";
  const url = `https://lm-api-reads.fantasy.espn.com/apis/v3/games/ffl/seasons/${season}/segments/0/leagues/${LEAGUE_ID}?view=mTeam`;
  const res = await fetch(url, { headers: { Cookie: cookie }, cache: "no-store" });
  const data = await res.json();

  const memberName = new Map<string, string>();
  for (const m of data.members ?? []) {
    const full = [m.firstName, m.lastName].filter(Boolean).join(" ").trim();
    memberName.set(m.id, full || m.displayName || "Unknown Owner");
  }

  const result = new Map<number, string>();
  for (const t of data.teams ?? []) {
    const ownerId = t.primaryOwner ?? t.owners?.[0] ?? "";
    result.set(t.id, memberName.get(ownerId) ?? "Unknown Owner");
  }
  return result;
}

export interface TeamScheduleEntry {
  week: number;
  opponentId: number | null;
  opponentName: string;
  opponentLogo: string;
  teamScore: number;
  opponentScore: number | null;
  result: "W" | "L" | "T" | "-";
  isLive: boolean;
}

export interface TeamDraftPick {
  round: number;
  roundPick: number;
  overallPickNumber: number;
  playerName: string;
  playerPosition: string;
  playerProTeam: string;
  headshotUrl: string;
  isKeeper: boolean;
}

export interface TeamDetail {
  id: number;
  name: string;
  ownerName: string;
  logo: string;
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  schedule: TeamScheduleEntry[];
  draftPicks: TeamDraftPick[];
  chatMentions: ChatMessage[];
}

export async function getTeamDetail(teamId: number): Promise<TeamDetail | null> {
  if (!isLeagueConfigured()) return null;

  const { teams, matchups, currentMatchupPeriod } = await getLeagueMatchups();
  const team = teams.find((t) => t.id === teamId);
  if (!team) return null;

  const [ownerNames, { picks }, allMessages] = await Promise.all([
    fetchOwnerNames(),
    getDraftRecap(),
    getMessages(150),
  ]);

  const teamById = new Map(teams.map((t) => [t.id, t]));

  const schedule: TeamScheduleEntry[] = matchups
    .filter((m) => (m.homeTeamId === teamId || m.awayTeamId === teamId) && m.matchupPeriodId <= currentMatchupPeriod)
    .sort((a, b) => a.matchupPeriodId - b.matchupPeriodId)
    .map((m) => {
      const isHome = m.homeTeamId === teamId;
      const opponentId = isHome ? m.awayTeamId : m.homeTeamId;
      const teamScore = isHome ? m.homeScore : (m.awayScore ?? 0);
      const opponentScore = isHome ? m.awayScore : m.homeScore;
      const opponent = opponentId !== null ? teamById.get(opponentId) : null;

      let result: TeamScheduleEntry["result"] = "-";
      if (!m.isLive && opponentScore !== null) {
        if (teamScore > opponentScore) result = "W";
        else if (teamScore < opponentScore) result = "L";
        else result = "T";
      }

      return {
        week: m.matchupPeriodId,
        opponentId,
        opponentName: opponent?.name ?? "BYE",
        opponentLogo: opponent?.logo ?? "",
        teamScore,
        opponentScore,
        result,
        isLive: m.isLive,
      };
    });

  const draftPicks: TeamDraftPick[] = picks
    .filter((p) => p.teamId === teamId)
    .sort((a, b) => a.overallPickNumber - b.overallPickNumber)
    .map((p) => ({
      round: p.round,
      roundPick: p.roundPick,
      overallPickNumber: p.overallPickNumber,
      playerName: p.playerName,
      playerPosition: p.playerPosition,
      playerProTeam: p.playerProTeam,
      headshotUrl: p.headshotUrl,
      isKeeper: p.isKeeper,
    }));

  const teamNameLower = team.name.toLowerCase();
  const ownerNameLower = (ownerNames.get(teamId) ?? "").toLowerCase();
  const chatMentions = allMessages
    .filter((m) => {
      const text = m.text.toLowerCase();
      return (teamNameLower && text.includes(teamNameLower)) || (ownerNameLower && text.includes(ownerNameLower));
    })
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  return {
    id: team.id,
    name: team.name,
    ownerName: ownerNames.get(teamId) ?? "Unknown Owner",
    logo: team.logo,
    wins: team.wins,
    losses: team.losses,
    ties: team.ties,
    pointsFor: team.pointsFor,
    pointsAgainst: team.pointsAgainst,
    schedule,
    draftPicks,
    chatMentions,
  };
}
