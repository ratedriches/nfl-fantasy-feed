# NFL Fantasy Feed — Developer Handoff Document

## Overview
A Next.js web app with two main features:
1. **Beat Writers** — Curated tweet feed from NFL beat reporters, organized by all 32 teams
2. **NFL Stats** — Real-time 2025 season stats for Team Stats and Player Stats (Offense + Defense), pulled live from ESPN's API

**Live URL:** https://nfl-fantasy-feed.vercel.app  
**GitHub Repo:** https://github.com/ratedriches/nfl-fantasy-feed  
**Deployed via:** Vercel (auto-deploys on every push to `main`)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.2.2 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Hosting | Vercel (free tier) |
| Data | ESPN unofficial API (no API key required) |
| React | v19 |

---

## Version Bookmarks (Git Tags)

| Tag | Description |
|-----|-------------|
| `v1` | Beat writers feed only — no stats |
| `v2` | Beat writers + Team Stats + Player Stats (basic) |
| `v2.0` | Stable checkpoint with offense player stats working |
| `v2.1` | Added Offense/Defense top-level toggle on player stats |
| `v2.2` | Defense tab with DT/DE/LB/CB/S positions, rank column |

To revert to any version: `git checkout v2.1`

---

## Project Structure

```
nfl-fantasy-feed/
├── src/
│   ├── app/                          # Next.js App Router pages
│   │   ├── page.tsx                  # Home page (two cards: Beat Writers / NFL Stats)
│   │   ├── layout.tsx                # Root layout (dark theme, font)
│   │   ├── globals.css               # Global styles
│   │   ├── beat-writers/
│   │   │   └── page.tsx              # Beat writers grid — all 32 teams by division
│   │   ├── team/[slug]/
│   │   │   └── page.tsx              # Individual team tweet feed page
│   │   ├── stats/
│   │   │   ├── page.tsx              # Stats landing (two cards: Team / Player)
│   │   │   ├── teams/
│   │   │   │   └── page.tsx          # Team stats page shell
│   │   │   └── players/
│   │   │       └── page.tsx          # Player stats page shell
│   │   └── api/                      # Server-side API proxy routes (bypasses CORS)
│   │       ├── team-stats/
│   │       │   └── route.ts          # Proxies ESPN team stats → /api/team-stats
│   │       ├── player-stats/
│   │       │   └── route.ts          # Proxies ESPN offensive player stats → /api/player-stats
│   │       └── defense-stats/
│   │           └── route.ts          # Proxies ESPN defensive player stats → /api/defense-stats
│   ├── components/                   # React components
│   │   ├── TeamFeed.tsx              # Beat writer tweet feed with filter chips per writer
│   │   ├── TweetCard.tsx             # Individual tweet card (avatar, content, time, engagement)
│   │   ├── SearchResults.tsx         # Search across all 32 teams' tweets
│   │   ├── TeamStatsClient.tsx       # Fetches /api/team-stats, renders TeamStatsTable
│   │   ├── TeamStatsTable.tsx        # Sortable offense/defense team stats table
│   │   ├── PlayerStatsClient.tsx     # Fetches /api/player-stats, renders offense tabs
│   │   └── DefenseStatsClient.tsx    # Fetches /api/defense-stats, renders defense tabs
│   ├── data/
│   │   ├── teams.ts                  # All 32 NFL teams (name, slug, colors, beat writers)
│   │   └── mockTweets.ts             # Mock tweet data (5 tweets per team)
│   └── lib/
│       └── espn.ts                   # Server-side ESPN helpers (standings, team stats)
```

---

## Key Files Explained

### `src/data/teams.ts`
Defines all 32 NFL teams. Each team has:
- `name`, `slug` (URL-safe), `abbrev`, `primaryColor`, `secondaryColor`
- `beatWriters`: array of `{ name, handle, twitterUrl }`

To add/edit beat writers, edit this file directly.

### `src/data/mockTweets.ts`
Mock tweet data keyed by team slug (e.g. `"chiefs"`). Each tweet has:
`{ id, authorName, authorHandle, content, timestamp, likes, retweets, replies }`

Currently placeholder data. To wire up real tweets, replace this with a Twitter/X API call.

### `src/app/api/team-stats/route.ts`
- Calls `getAllTeamStats()` from `src/lib/espn.ts`
- Returns JSON with all 32 teams' offense and defense stats
- Cached 1 hour (`revalidate: 3600`)

### `src/app/api/player-stats/route.ts`
**Offensive player stats.** Fetches from ESPN leaders endpoint:
- `passingYards` leaders (6 pages) → QBs
- `rushingYards` leaders → RBs  
- `receivingYards` leaders (6 pages) → WRs + TEs (split by position)

Returns: `{ passers, rushers, wideReceivers, tightEnds, defenders }`

**Limits:** QB 50 · RB 100 · WR 100 · TE 50

### `src/app/api/defense-stats/route.ts`
**Defensive player stats.** Two separate sourcing strategies:
- **DT + DE:** Fetched from all 32 team rosters (they don't appear in leader categories), then individual stats pulled per player
- **LB + CB + S:** Fetched from `totalTackles`, `defensiveInterceptions`, `passesDefended` leader categories

Returns: `{ DTs, DEs, LBs, CBs, Ss }`

**Limits:** DT 50 · DE 50 · LB 100 · CB 100 · S 100

### `src/components/PlayerStatsClient.tsx`
Main offense stats UI. Has:
- **Offense / Defense** top-level toggle
- When Offense: **QB / RB / WR / TE** sub-tabs with sortable columns
- When Defense: renders `<DefenseStatsClient />`
- All columns sortable; Player column sorts alphabetically by last name

### `src/components/DefenseStatsClient.tsx`
Defense stats UI. Has:
- **DT / DE / LB / CB / S** tabs
- Rank `#` column, sortable stat columns
- Player column sorts alphabetically by last name

### `src/components/TeamStatsTable.tsx`
- **Offense / Defense** toggle
- Sortable columns including **Team** (alphabetical) and **W-L** (win percentage)

---

## ESPN API — How Data Is Fetched

All ESPN calls are made **server-side** inside the `/api/` routes. This avoids CORS blocks that would occur if the browser called ESPN directly.

### Base URLs
```
CORE = https://sports.core.api.espn.com/v2/sports/football/leagues/nfl
SITE = https://site.api.espn.com/apis/site/v2/sports/football/nfl
```

### Key Endpoints Used

| Endpoint | Used For |
|----------|----------|
| `CORE/seasons/2025/types/2/leaders?limit=100&page=N` | Offensive + defensive leader lists |
| `CORE/seasons/2025/types/2/athletes/{id}/statistics/0` | Individual player season stats |
| `CORE/seasons/2025/standings` | Team win/loss records |
| `CORE/teams/{id}/statistics` | Team-level offense/defense stats |
| `SITE/teams/{id}/roster` | Team rosters (used for DT/DE) |

### Season Parameters
- `seasons/2025` = 2025 NFL regular season
- `types/2` = regular season (type 4 = off-season, avoid this)

### CORS Solution
ESPN blocks browser requests. The fix is Next.js API routes — the browser calls `/api/team-stats`, which runs server-side and calls ESPN, then returns JSON to the browser.

---

## Player Stats Columns

### Offense

| Tab | Columns |
|-----|---------|
| QB | Pass Yds · Pass TD · INT · Comp% · Rush Yds · Rush TD · Fumbles |
| RB | Rush Yds · Att · Rush TD · Rec · Rec Yds · Rec TD · Fumbles |
| WR | Rec Yds · Rec · Targets · Rec TD · Yds/Rec |
| TE | Rec Yds · Rec · Targets · TD · Yds/Rec |

### Defense

| Tab | Columns | Source |
|-----|---------|--------|
| DT | Tackles · TFL · INTs · FF · FR · PBU | All 32 rosters |
| DE | Tackles · TFL · INTs · FF · FR · PBU | All 32 rosters |
| LB | Tackles · TFL · INTs · FF · FR · PBU | Leader categories |
| CB | Tackles · TFL · INTs · FF · FR · PBU | Leader categories |
| S  | Tackles · TFL · INTs · FF · FR · PBU | Leader categories |

---

## Team Stats Columns

| Offense | Defense |
|---------|---------|
| Pts/G · Yds/G · Pass/G · Rush/G · Pass TD · Rush TD | Pts All/G · Sacks · INTs · TFL · PD · Fum Rec |

---

## Local Development Setup

```bash
# 1. Clone the repo
git clone https://github.com/ratedriches/nfl-fantasy-feed.git
cd nfl-fantasy-feed

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev
# App runs at http://localhost:3000
```

No `.env` file or API keys needed — ESPN's API is public and unauthenticated.

---

## Deploying to Vercel

1. Push to GitHub (`git push`)
2. Vercel automatically detects the push and redeploys
3. Build takes ~1-2 minutes
4. Live at https://nfl-fantasy-feed.vercel.app

To manually trigger a redeploy without code changes:
```bash
git commit --allow-empty -m "Trigger redeploy" && git push
```

---

## Version Tagging (Bookmarking)

```bash
# Create a bookmark
git tag v3.0 && git push origin v3.0

# Revert to a bookmark
git checkout v2.2

# List all bookmarks
git tag
```

---

## Known Limitations & Notes

- **Mock tweets** — Beat writer tweets are placeholder data. Real integration requires a Twitter/X API key (paid).
- **ESPN API is unofficial** — No SLA. If ESPN changes their API structure, parsing may break. The code uses defensive null-coalescing (`??`) throughout to handle this gracefully.
- **DT/DE load time** — The defense stats route makes 32 roster calls + ~150 individual stats calls. This takes 3-5 seconds on first load but is cached for 1 hour.
- **Vercel free tier** — Serverless functions have a 10-second timeout. The defense stats route is close to this limit on cold starts.
- **NFLverse 2025 data** — An earlier version attempted to use NFLverse CSV for defense stats, but their 2025 data was not yet published at time of development. ESPN is used instead.
- **ESPN position classifications** — Some edge rushers are classified as "LB" by ESPN (e.g. Brian Burns, Nik Bonitto), not "DE". This is ESPN's own categorization, not a bug.
