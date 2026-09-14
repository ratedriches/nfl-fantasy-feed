import Link from "next/link";
import TeamMentionsClient from "@/components/TeamMentionsClient";

export default async function TeamMentionsPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900 px-4 py-4">
        <Link href={`/league/team/${teamId}`} className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400">
          ← Back to Team
        </Link>
        <h1 className="text-xl font-bold text-white">What They&apos;re Saying</h1>
        <p className="mt-0.5 text-xs text-gray-400">Every chat mention</p>
      </header>

      <main className="px-4 py-6">
        <TeamMentionsClient teamId={Number(teamId)} />
      </main>
    </div>
  );
}
