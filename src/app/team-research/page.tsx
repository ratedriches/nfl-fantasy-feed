import Link from "next/link";
import { teams } from "@/data/teams";

const divisions = [
  { name: "AFC East", teams: ["buffalo-bills", "miami-dolphins", "new-england-patriots", "new-york-jets"] },
  { name: "AFC North", teams: ["baltimore-ravens", "cincinnati-bengals", "cleveland-browns", "pittsburgh-steelers"] },
  { name: "AFC South", teams: ["houston-texans", "indianapolis-colts", "jacksonville-jaguars", "tennessee-titans"] },
  { name: "AFC West", teams: ["denver-broncos", "kansas-city-chiefs", "las-vegas-raiders", "los-angeles-chargers"] },
  { name: "NFC East", teams: ["dallas-cowboys", "new-york-giants", "philadelphia-eagles", "washington-commanders"] },
  { name: "NFC North", teams: ["chicago-bears", "detroit-lions", "green-bay-packers", "minnesota-vikings"] },
  { name: "NFC South", teams: ["atlanta-falcons", "carolina-panthers", "new-orleans-saints", "tampa-bay-buccaneers"] },
  { name: "NFC West", teams: ["arizona-cardinals", "los-angeles-rams", "san-francisco-49ers", "seattle-seahawks"] },
];

export default function TeamResearchPage() {
  const teamsBySlug = Object.fromEntries(teams.map((t) => [t.slug, t]));

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Home
        </Link>
        <h1 className="text-xl font-bold text-white">Team Research</h1>
        <p className="mt-0.5 text-xs text-gray-400">In-depth scouting and roster breakdowns</p>
      </header>

      <main className="px-4 py-5">
        <div className="flex flex-col gap-6">
          {divisions.map((division) => (
            <div key={division.name}>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500">
                {division.name}
              </h2>
              <div className="grid grid-cols-2 gap-2.5">
                {division.teams.map((slug) => {
                  const team = teamsBySlug[slug];
                  if (!team) return null;
                  return (
                    <Link
                      key={slug}
                      href={`/team-research/${slug}`}
                      className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 p-3 active:scale-95 transition-transform"
                    >
                      <div
                        className="absolute left-0 top-0 h-full w-1 rounded-l-xl"
                        style={{ backgroundColor: team.primaryColor }}
                      />
                      <div className="pl-2">
                        <img
                          src={`https://a.espncdn.com/i/teamlogos/nfl/500/${team.abbrev}.png`}
                          alt={team.name}
                          className="mb-2 h-9 w-9 object-contain"
                        />
                        <p className="text-xs font-semibold leading-tight text-white">
                          {team.name}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
