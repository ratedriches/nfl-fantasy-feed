import Link from "next/link";

function TwitterBirdIcon() {
  return (
    <svg viewBox="0 0 24 24" width="36" height="36" fill="#1DA1F2" aria-hidden="true">
      <path d="M23.954 4.569c-.885.389-1.830.654-2.825.775 1.014-.611 1.794-1.574 2.163-2.723-.951.555-2.005.959-3.127 1.184-.896-.959-2.173-1.559-3.591-1.559-2.717 0-4.92 2.203-4.92 4.917 0 .39.045.765.127 1.124C7.691 8.094 4.066 6.13 1.64 3.161c-.427.722-.666 1.561-.666 2.475 0 1.71.87 3.213 2.188 4.096-.807-.026-1.566-.248-2.228-.616v.061c0 2.385 1.693 4.374 3.946 4.827-.413.111-.849.171-1.296.171-.314 0-.615-.03-.916-.086.631 1.953 2.445 3.377 4.604 3.417-1.68 1.319-3.809 2.105-6.102 2.105-.39 0-.779-.023-1.17-.067 2.189 1.394 4.768 2.209 7.557 2.209 9.054 0 13.999-7.496 13.999-13.986 0-.209 0-.42-.015-.63.961-.689 1.8-1.56 2.46-2.548l-.047-.02z" />
    </svg>
  );
}

export default function DeepDiveResearchPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-5">
        <Link href="/" className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Home
        </Link>
        <h1 className="text-xl font-bold text-white">Deep Dive Research</h1>
        <p className="mt-0.5 text-xs text-gray-400">Injuries, scouting, and beat tweets for all 32 teams</p>
      </header>

      <main className="flex flex-1 flex-col gap-4 px-4 py-8">
        <Link
          href="/injuries"
          className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
        >
          <span className="text-4xl">🩹</span>
          <div>
            <h2 className="text-lg font-bold text-white">Injury Reports</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              Current injury status for all 32 teams
            </p>
          </div>
          <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
        </Link>

        <Link
          href="/team-research"
          className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
        >
          <span className="text-4xl">🔍</span>
          <div>
            <h2 className="text-lg font-bold text-white">Team Analysis</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              In-depth scouting and roster breakdowns for all 32 teams
            </p>
          </div>
          <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
        </Link>

        <Link
          href="/beat-writers"
          className="group flex items-center gap-5 rounded-2xl border border-gray-800 bg-gray-900 p-6 active:scale-95 transition-transform"
        >
          <TwitterBirdIcon />
          <div>
            <h2 className="text-lg font-bold text-white">Beat Tweets</h2>
            <p className="mt-0.5 text-sm text-gray-400">
              Latest tweets from reporters covering all 32 teams
            </p>
          </div>
          <span className="ml-auto text-gray-600 group-hover:text-gray-300">→</span>
        </Link>
      </main>
    </div>
  );
}
